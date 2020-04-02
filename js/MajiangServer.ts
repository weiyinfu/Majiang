/**
 * 麻将调度器，不能阻塞
 */
import {CardMap, getCards, hu, sortCards} from "./Card";
import {
    AnGangRequest,
    EatReply,
    EatRequest,
    FetchReply,
    FetchReplyMode,
    FetchRequest,
    MessageType,
    MingGangRequest,
    OverMode,
    OverRequest,
    PengReply,
    PengRequest,
    ReleaseReply,
    ReleaseReplyMode,
    ReleaseRequest,
    StartRequest
} from "./MajiangProtocol";
import {Handler} from "./Handler";
import {v4 as uuid} from "uuid";
import {flat, getCount, li, ll, remove, shuffle} from "./Utils";

function contain<T>(big: T[], small: T[]) {
    //判断big牌列表中是否包含small中的全部牌
    for (let i of small) {
        if (big.indexOf(i) === -1) {
            return false
        }
    }
    return true
}

function releaseModePriority(opType: ReleaseReplyMode): number {
    //对弃牌的操作的优先级
    switch (opType) {
        case ReleaseReplyMode.PASS:
            return 0;
        case ReleaseReplyMode.EAT:
            return 1;
        case ReleaseReplyMode.PENG:
            return 2;
        case ReleaseReplyMode.MING_GANG:
            return 3;
        case ReleaseReplyMode.HU:
            return 4;
        default:
            throw 'unknown op type ' + opType;
    }
}

export class MajiangServer {
    //宏观参数
    USER_COUNT: number = 4;//用户的个数
    CARD_COUNT: number = 13;//每个人的手牌数
    //各种牌区域
    hand: string[][] = []; //各个用户的手牌
    shown: string[][][] = []; //各个用户的亮牌，“吃，碰，明杠”之后被迫显示出来的牌
    anGang: string[][] = [];//各个用户暗杠的牌，暗杠的牌只需要放一张就可以（因为四张相同）
    pile: string[] = []; //牌堆，未知的牌
    rubbish: string[] = [];//用户当前的弃牌，当牌堆中的牌被摸完时，对发出来的牌进行重新洗牌
    //各个用户接口
    users: Handler[] = [];

    async broadcast(messageGenerator: (turn: number) => any): Promise<any[]> {
        return new Promise((resolve: (responses: any[]) => void, reject: ((error: string) => void)) => {
            const responses: any[] = li(4, null);
            for (let userId = 0; userId < this.USER_COUNT; userId++) {
                const token = uuid();
                const message = messageGenerator(userId);
                message.token = token;
                this.users[userId].postMessage(message);
                this.users[userId].onMessage = (resp) => {
                    if (resp.token !== token) {
                        throw '收到错误消息，token不对';
                    }
                    if (resp.type !== message.type) {
                        throw "回复的消息类型与请求类型应该一致";
                    }
                    //把消息放到合适的位置
                    responses[userId] = resp;
                    const waiting = responses.filter(x => x === null).length;
                    if (waiting === 0) {
                        //如果各个用户都回复了，那么执行下一步
                        resolve(responses);
                    }
                }
            }
        });
    }


    newGame(users: Handler[]) {
        this.users = users;
        this.USER_COUNT = users.length;
        this.pile = getCards();
        shuffle(this.pile);
        this.hand = [];
        this.rubbish = [];
        this.shown = ll(this.USER_COUNT);
        this.anGang = ll(this.USER_COUNT);
        for (let userId = 0; userId < this.USER_COUNT; userId++) {
            let userCards = this.pile.splice(0, this.CARD_COUNT);
            this.hand.push(userCards);
        }
        this.broadcast(turn => {
            const req: StartRequest = {
                type: MessageType.START,
                cards: this.hand[turn],
                turn: turn,
                token: "",
                userCount: this.USER_COUNT,
            };
            return req;
        }).then(() => {
            //总是从第0号用户开始摸牌
            this.doFetch(0).then(() => {
                console.log(`游戏结束`);
                //执行一项校验，检查游戏过程中牌是否合理，最终的牌数应该和开局时的牌数相同
                let allCards: string[] = flat([this.pile, this.shown, this.hand, this.rubbish, li(4, this.anGang)]);
                if (sortCards(getCards()).join('') !== sortCards(allCards).join('')) {
                    throw `游戏状态错误`;
                }
            });
        });
    }

    async doFetch(fetcher: number): Promise<any> {
        //从牌堆摸一张牌
        if (this.pile.length === 0) {
            const responses = await this.broadcast(turn => {
                const resp: OverRequest = {
                    winner: -1,
                    type: MessageType.OVER,
                    token: '',
                    mode: OverMode.NO_CARD,
                }
                return resp;
            });
            return;
        }
        const card = this.pile.splice(0, 1)[0]
        this.hand[fetcher].push(card);
        const responses = await this.broadcast(t => {
            const req: FetchRequest = {
                type: MessageType.FETCH,
                card: t === fetcher ? card : "",
                turn: fetcher,
                token: "",
            };
            return req;
        });
        //消息校验
        this.validateFetchReply(responses, card, fetcher);
        const fetchReply = <FetchReply>responses[fetcher];
        switch (fetchReply.mode) {
            case FetchReplyMode.AN_GANG: {
                //从手牌中移掉四张牌
                const responses = await this.broadcast(turn => {
                    const resp: AnGangRequest = {
                        turn: fetcher,
                        token: '',
                        type: MessageType.AN_GANG,
                    };
                    return resp;
                });
                remove(this.hand[fetcher], li(4, card));
                this.anGang[fetcher].push(card);
                //对于暗杠无需校验，只需要通知一下即可，暗杠完了之后继续当前用户的摸牌弃牌
                return this.doFetch(fetcher);
            }
            case FetchReplyMode.RELEASE: {
                return this.doRelease(fetcher, fetchReply.release);
            }
            case FetchReplyMode.HU_SELF: {
                //自摸糊了
                const responses = await this.broadcast(turn => {
                    const req: OverRequest = {
                        type: MessageType.OVER,
                        winner: fetcher,
                        token: "",
                        mode: OverMode.HU_SELF,
                    };
                    return req;
                });
                break;
            }
            //pass类型的reply在validate的时候就会报错
            default: {
                throw `unknown ${fetchReply.mode}`;
            }
        }
    }

    async doRelease(sender: number, release: string): Promise<any> {
        //用户sender弃牌release
        const releaseId = this.hand[sender].indexOf(release);
        this.hand[sender].splice(releaseId, 1);
        //通知各个AI，有人弃了若干张牌
        const responses = await this.broadcast((turn) => {
            const req: ReleaseRequest = {
                type: MessageType.RELEASE,
                turn: sender,
                card: release,
                token: "",
            };
            return req;
        });
        //消息校验，验证所有用户的消息都是合法的
        this.validateReleaseReply(responses, sender, release);
        let receiver: number = 0;
        //因为胡牌存在截胡规则，所以从当前用户开始转，只有遇到更高优先级才改变receiver
        for (let i = 0; i < this.USER_COUNT; i++) {
            const who = (sender + i) % 4;
            if (releaseModePriority(responses[who].mode) > releaseModePriority(responses[receiver].mode)) {
                receiver = i;
            }
        }
        const releaseResp: ReleaseReply = responses[receiver];
        switch (releaseResp.mode) {
            case ReleaseReplyMode.PASS: {
                this.rubbish.push(release);
                return this.doFetch((sender + 1) % this.USER_COUNT);
            }
            case ReleaseReplyMode.PENG: {
                remove(this.hand[receiver], li(2, release));//从手牌删除掉，放到明牌里面
                this.shown[receiver].push(li(3, release));
                return this.broadcast(turn => {
                    const req: PengRequest = {
                        type: MessageType.PENG,
                        turn: receiver,
                        token: "",
                    };
                    return req;
                }).then(responses => {
                    //参数校验
                    this.validatePengReply(responses, receiver);
                    //完成碰牌之后receiver需要弃牌
                    const pengReply = responses[receiver];
                    return this.doRelease(receiver, pengReply.release);
                });
            }
            case ReleaseReplyMode.MING_GANG: {
                //如果杠牌了
                remove(this.hand[receiver], li(3, release));//从手牌删除掉，放到明牌里面
                this.shown[receiver].push(li(4, release));
                return this.broadcast(turn => {
                    const req: MingGangRequest = {
                        type: MessageType.MING_GANG,
                        turn: receiver,
                        token: "",
                    };
                    return req;
                }).then(responses => {
                    //明杠不需要弃牌，也不需要参数校验，需要重新摸牌弃牌
                    return this.doFetch(receiver);
                });
            }
            case ReleaseReplyMode.EAT: {
                const cards = releaseResp.show;
                remove(this.hand[receiver], cards);
                cards.push(release);
                this.shown[receiver].push(cards);
                return this.broadcast(turn => {
                    const req: EatRequest = {
                        type: MessageType.EAT,
                        turn: receiver,
                        cards: cards,
                        token: "",
                    };
                    return req;
                }).then(responses => {
                    this.validateEatReply(responses, sender, receiver);
                    const resp = <EatReply>responses[receiver];
                    return this.doRelease(receiver, resp.release);
                });
            }
            case ReleaseReplyMode.HU: {
                //如果胡牌了
                this.hand[receiver].push(release);
                return this.broadcast(turn => {
                    const req: OverRequest = {
                        type: MessageType.OVER,
                        winner: receiver,
                        token: "",
                        mode: OverMode.HU,
                    };
                    return req;
                }).then(responses => {
                    //通知别人胡牌之后不需要校验回复
                    return;
                });
            }
            default: {
                throw `未知的弃牌回复模式${releaseResp.mode}`;
            }
        }
    }

    validateReleaseReply(responses: ReleaseReply[], sender: number, release: string) {
        //校验弃牌回复
        for (let receiver = 0; receiver < this.USER_COUNT; receiver++) {
            const response = responses[receiver];
            if (response.type !== MessageType.RELEASE) {
                throw "消息类型错误";
            }
            switch (response.mode) {
                case ReleaseReplyMode.PASS: {
                    if (response.show.length) {
                        throw `你一边说过，一边又尝试出牌`;
                    }
                    break;
                }
                case ReleaseReplyMode.EAT: {
                    if (receiver === sender) {
                        throw "你怎么可以吃自己刚刚弃的牌";
                    }
                    if (!response.show) {
                        throw `你既然说吃，为什么不显示出自己的牌来?`
                    }
                    //只有下家可以吃
                    if (response.show.length !== 2) {
                        throw "展示的牌必须是2张";
                    }
                    if ((sender + 1) % 4 !== receiver) {
                        throw "只有下家才能吃牌"
                    }
                    if (!contain(this.hand[receiver], response.show)) {
                        //接收者必须包含它所展示的牌，不能撒谎
                        throw "你展示了你没有的牌，所以不能吃牌";
                    }
                    let a = response.show.slice();
                    a.push(release);
                    sortCards(a);
                    //吃了的牌必须是顺子
                    if (!(CardMap[a[0]].sparseIndex + 1 == CardMap[a[1]].sparseIndex &&
                        CardMap[a[0]].sparseIndex + 2 == CardMap[a[2]].sparseIndex)) {
                        throw `AI不能吃但是它返回吃，构不成顺子`;
                    }
                    break;
                }
                case ReleaseReplyMode.PENG: {
                    if (receiver === sender) {
                        throw "你怎么可以吃自己刚刚弃的牌";
                    }
                    if (!response.show) {
                        throw "碰牌show数组不应为空";
                    }
                    if (response.show.length != 0) {
                        throw "碰牌无需展示牌";
                    }
                    //只有刻子才能碰
                    if (getCount(this.hand[receiver], release) < 2) {
                        throw "碰牌的前提是你必须至少有两张相同的牌";
                    }
                    break;
                }
                case ReleaseReplyMode.MING_GANG: {
                    if (receiver === sender) {
                        throw "不能明杠自己刚刚的弃牌";
                    }
                    if (!response.show) {
                        throw "show数组不能为null，必须是一个空数组"
                    }
                    if (response.show.length != 0) {
                        throw "show 数组应该为空";
                    }
                    if (getCount(this.hand[receiver], release) < 3) {
                        throw "明杠必须至少有三张相同的牌";
                    }
                    break;
                }
                case ReleaseReplyMode.HU: {
                    const cards = this.hand[receiver].slice();
                    cards.push(release);
                    sortCards(cards);
                    if (!hu(cards)) {
                        throw `你根本胡不了牌，你为啥报胡牌？${JSON.stringify(cards)}`;
                    }
                    break;
                }
                default: {
                    throw `未知的回复类型${response}`;
                }
            }
        }
    }

    validatePengReply(responses: PengReply[], receiver: number) {
        //校验碰牌之后的回复
        for (let i = 0; i < this.USER_COUNT; i++) {
            const response = responses[i];
            if (response.type !== MessageType.PENG) {
                throw "消息类型错误";
            }
            if (i === receiver) {
                if (response.release) {
                    if (this.hand[receiver].indexOf(response.release) === -1) {
                        throw `你怎么可以弃你没有的牌`;
                    }
                } else {
                    throw "碰完之后该你弃牌了";
                }
            } else {
                if (response.release) {
                    throw "不该你弃牌你弃什么牌";
                }
            }
        }
    }

    validateFetchReply(responses: FetchReply[], card: string, turn: number) {
        for (let i = 0; i < this.USER_COUNT; i++) {
            const response = responses[i];
            if (response.type !== MessageType.FETCH) {
                throw "消息类型错误";
            }
            switch (response.mode) {
                case FetchReplyMode.RELEASE: {
                    if (turn !== i) throw `别人刚摸了一张牌你弃什么牌`;
                    //如果是当前用户的id
                    if (!response.release) throw "该你弃牌你咋不起牌";
                    if (this.hand[i].indexOf(response.release) === -1) {
                        throw "你咋还能弃你没有的牌";
                    }
                    break;
                }
                case FetchReplyMode.AN_GANG: {
                    if (turn !== i) throw `别人刚摸了一张牌你怎么能杠牌`;
                    if (i === turn) {
                        //用户已经拥有的牌的个数
                        if (getCount(this.hand[i], card) < 3) {
                            throw "你无权暗杠";
                        }
                    } else {
                        throw "刚才不是你摸牌，你凭啥暗杠";
                    }
                    break;
                }
                case FetchReplyMode.HU_SELF: {
                    if (turn !== i) throw `别人刚摸了一张牌你${i}怎么可能胡牌`;
                    //自摸胡校验
                    sortCards(this.hand[turn]);
                    if (!hu(this.hand[turn])) {
                        throw "你没有胡为啥说胡了";
                    }
                    break;
                }
                case FetchReplyMode.PASS: {
                    //如果不是你摸牌你就应该是pass
                    if (turn === i) {
                        throw `该你采取行动了，你不能pass`
                    }
                }
            }
        }
    }

    validateEatReply(responses: any[], sender: number, receiver: number) {
        for (let i = 0; i < this.USER_COUNT; i++) {
            const resp = <EatReply>responses[i];
            if (resp.type !== MessageType.EAT) {
                throw "消息类型错误";
            }
            if (i === receiver) {
                if (!resp.release) throw "该你弃牌了你咋不弃牌";
                if (this.hand[receiver].indexOf(resp.release) === -1) {
                    throw "你怎么可以弃你没有的牌";
                }
            } else {
                if (resp.release) {
                    throw "不该你弃牌，你弃什么牌";
                }
            }
        }
    }
}