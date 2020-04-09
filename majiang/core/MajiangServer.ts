/**
 * 麻将调度器
 *
 * 为什么把摸牌过程弄成异步？
 * 因为server应该将主动权尽量交给用户去执行，而生成牌这件事就是用户控制的。
 * server应该只提供一种机制，不提供数据
 */
import {C, getCards, sortCards} from "./Card";
import {
    AnGangRequest,
    AnGangResponse,
    EatRequest,
    EatResponse,
    FetchRequest,
    FetchResponse,
    FetchResponseMode,
    MessageType,
    MingGangRequest,
    OverMode,
    OverRequest,
    OverResponse,
    PengRequest,
    PengResponse,
    ReleaseRequest,
    ReleaseResponse,
    ReleaseResponseMode,
    Request,
    Response,
    StartRequest,
    StartResponse
} from "./MajiangProtocol";
import {Handler} from "./Handler";
import {v4 as uuid} from "uuid";
import {deepcopy, flat, getCount, init, li, ll, remove, shuffle, swap} from "../util/Utils";
import {Pile} from "./Pile";
import {Hu} from "./Hu";

function contain<T>(big: T[], small: T[]) {
    //判断big牌列表中是否包含small中的全部牌
    for (let i of small) {
        if (big.indexOf(i) === -1) {
            return false
        }
    }
    return true
}

function releaseModePriority(opType: ReleaseResponseMode): number {
    //对弃牌的操作的优先级
    switch (opType) {
        case ReleaseResponseMode.PASS:
            return 0;
        case ReleaseResponseMode.EAT:
            return 1;
        case ReleaseResponseMode.PENG:
            return 2;
        case ReleaseResponseMode.MING_GANG:
            return 3;
        case ReleaseResponseMode.HU:
            return 4;
        default:
            throw new Error('unknown op type ' + opType);
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
    pile: Pile; //牌堆，未知的牌
    rubbish: string[] = [];//用户当前的弃牌，当牌堆中的牌被摸完时，对发出来的牌进行重新洗牌
    //各个用户接口
    users: Handler[] = [];
    hu: Hu;//胡牌算法求解器

    constructor(pile: Pile, users: Handler[], hu: Hu) {
        this.pile = pile;
        this.users = users;
        this.hu = hu;
        this.USER_COUNT = users.length;
    }

    broadcast(messageGenerator: (turn: number) => Request): Promise<Response[]> {
        return new Promise((resolve: (responses: Response[]) => void) => {
            const responses: Response[] = new Array(this.USER_COUNT);
            const got = new Set<number>();
            for (let userId = 0; userId < this.USER_COUNT; userId++) {
                const token = uuid();
                const message = messageGenerator(userId);
                message.token = token;
                //注意：应该先设置好onMessage，再调用postMessage，否则有一定概率出错（在各个用户与server同步的情况下，肯定出错）
                this.users[userId].onMessage = (resp) => {
                    if (resp.token !== token) {
                        throw new Error('收到错误消息，token不对');
                    }
                    if (resp.type !== message.type) {
                        throw new Error("回复的消息类型与请求类型应该一致");
                    }
                    //把消息放到合适的位置
                    responses[userId] = resp;
                    got.add(userId)
                    if (got.size === this.USER_COUNT) {
                        //如果各个用户都回复了，那么执行下一步
                        resolve(responses);
                    }
                }
                this.users[userId].postMessage(message);
            }
        });
    }

    async doStart(): Promise<number> {
        //在给定牌的情况下开始新游戏
        this.hand = [];
        this.rubbish = [];
        this.shown = ll(this.USER_COUNT);
        this.anGang = ll(this.USER_COUNT);
        for (let i = 0; i < this.USER_COUNT; i++) {
            let userCards = await this.pile.getMany(this.CARD_COUNT);
            this.hand.push(userCards);
        }
        const responses = await this.broadcast(turn => {
            const req: StartRequest = {
                type: MessageType.START,
                cards: this.hand[turn].slice(),
                turn: turn,
                token: "",
                userCount: this.USER_COUNT,
            };
            return req;
        }) as StartResponse[];
        //总是从第0号用户开始摸牌
        const winner = await this.doFetch(0);
        //执行一项校验，检查游戏过程中牌是否合理，最终的牌数应该和开局时的牌数相同
        const pile = []
        while (1) {
            let card = this.pile.getCard();
            if (card) {
                pile.push(card);
            }
        }
        let allCards: string[] = flat(pile, this.shown, this.hand, this.rubbish, li(4, this.anGang));
        if (sortCards(getCards()).join('') !== sortCards(allCards).join('')) {
            throw new Error(`游戏状态错误`);
        }
        return winner;
    }

    async doFetch(fetcher: number): Promise<number> {
        //从牌堆摸一张牌，返回胜利者的ID
        const fetched = await this.pile.getCard();
        if (!fetched) {
            //如果牌为空，表明没牌了
            const responses = <OverResponse[]>await this.broadcast(turn => {
                const resp: OverRequest = {
                    winner: -1,
                    type: MessageType.OVER,
                    token: '',
                    mode: OverMode.NO_CARD,
                    hand: deepcopy(this.hand),
                    anGang: deepcopy(this.anGang),
                }
                return resp;
            });
            return -1;
        }
        this.hand[fetcher].push(fetched);
        const responses = <FetchResponse[]>await this.broadcast(t => {
            const req: FetchRequest = {
                type: MessageType.FETCH,
                card: t === fetcher ? fetched : "",
                turn: fetcher,
                token: "",
            };
            return req;
        });
        //消息校验
        this.validateFetchResponse(responses, fetched, fetcher);
        const fetchResp = responses[fetcher];
        switch (fetchResp.mode) {
            case FetchResponseMode.AN_GANG: {
                //从手牌中移掉四张牌
                const responses = <AnGangResponse[]>await this.broadcast(turn => {
                    const resp: AnGangRequest = {
                        turn: fetcher,
                        token: '',
                        type: MessageType.AN_GANG,
                    };
                    return resp;
                });
                remove(this.hand[fetcher], li(4, fetched));
                this.anGang[fetcher].push(fetched);
                //对于暗杠无需校验，只需要通知一下即可，暗杠完了之后继续当前用户的摸牌弃牌
                return this.doFetch(fetcher);
            }
            case FetchResponseMode.RELEASE: {
                return this.doRelease(fetcher, fetchResp.release);
            }
            case FetchResponseMode.HU_SELF: {
                //自摸糊了
                const responses = <OverResponse[]>await this.broadcast(turn => {
                    const req: OverRequest = {
                        type: MessageType.OVER,
                        winner: fetcher,
                        token: "",
                        mode: OverMode.HU_SELF,
                        hand: deepcopy(this.hand),
                        anGang: deepcopy(this.anGang),
                    };
                    return req;
                });
                return fetcher;
            }
            //pass类型的response在validate的时候就会报错
            default: {
                throw new Error(`unknown ${fetchResp.mode}`);
            }
        }
    }

    async doRelease(sender: number, release: string): Promise<number> {
        //用户sender弃牌release，返回胜利者的ID
        const releaseId = this.hand[sender].indexOf(release);
        this.hand[sender].splice(releaseId, 1);
        //通知各个AI，有人弃了若干张牌
        const responses = <ReleaseResponse[]>await this.broadcast((turn) => {
            const req: ReleaseRequest = {
                type: MessageType.RELEASE,
                turn: sender,
                card: release,
                token: "",
            };
            return req;
        });
        //消息校验，验证所有用户的消息都是合法的
        this.validateReleaseResponse(responses, sender, release);
        let receiver: number = 0;
        //因为胡牌存在截胡规则，所以从当前用户开始转，只有遇到更高优先级才改变receiver
        for (let i = 0; i < this.USER_COUNT; i++) {
            const who = (sender + i) % 4;
            if (releaseModePriority(responses[who].mode) > releaseModePriority(responses[receiver].mode)) {
                receiver = i;
            }
        }
        const releaseResp: ReleaseResponse = responses[receiver];
        switch (releaseResp.mode) {
            case ReleaseResponseMode.PASS: {
                this.rubbish.push(release);
                return this.doFetch((sender + 1) % this.USER_COUNT);
            }
            case ReleaseResponseMode.PENG: {
                remove(this.hand[receiver], li(2, release));//从手牌删除掉，放到明牌里面
                this.shown[receiver].push(li(3, release));
                const responses = <PengResponse[]>await this.broadcast(turn => {
                    const req: PengRequest = {
                        type: MessageType.PENG,
                        turn: receiver,
                        token: "",
                    };
                    return req;
                })
                //参数校验
                this.validatePengResponse(responses, receiver);
                //完成碰牌之后receiver需要弃牌
                const pengResp = responses[receiver];
                return this.doRelease(receiver, pengResp.release);
            }
            case ReleaseResponseMode.MING_GANG: {
                //如果杠牌了
                remove(this.hand[receiver], li(3, release));//从手牌删除掉，放到明牌里面
                this.shown[receiver].push(li(4, release));
                const responses = await this.broadcast(turn => {
                    const req: MingGangRequest = {
                        type: MessageType.MING_GANG,
                        turn: receiver,
                        token: "",
                    };
                    return req;
                })
                //明杠不需要弃牌，也不需要参数校验，需要重新摸牌弃牌
                return this.doFetch(receiver);
            }
            case ReleaseResponseMode.EAT: {
                const cards = releaseResp.show;
                remove(this.hand[receiver], cards);
                cards.push(release);
                this.shown[receiver].push(cards);
                const responses = <EatResponse[]>await this.broadcast(turn => {
                    const req: EatRequest = {
                        type: MessageType.EAT,
                        turn: receiver,
                        cards: cards,
                        token: "",
                    };
                    return req;
                })
                this.validateEatResponse(responses, sender, receiver);
                const resp = <EatResponse>responses[receiver];
                return this.doRelease(receiver, resp.release);
            }
            case ReleaseResponseMode.HU: {
                //如果胡牌了
                this.hand[receiver].push(release);
                const responses = await this.broadcast(turn => {
                    const req: OverRequest = {
                        type: MessageType.OVER,
                        winner: receiver,
                        token: "",
                        mode: OverMode.HU,
                        hand: deepcopy(this.hand),
                        anGang: deepcopy(this.anGang),
                    };
                    return req;
                })
                //通知别人胡牌之后不需要校验回复responses
                return receiver;
            }
            default: {
                throw new Error(`未知的弃牌回复模式${releaseResp.mode}`);
            }
        }
    }

    validateReleaseResponse(responses: ReleaseResponse[], sender: number, release: string) {
        //校验弃牌回复
        for (let receiver = 0; receiver < this.USER_COUNT; receiver++) {
            const response = responses[receiver];
            if (response.type !== MessageType.RELEASE) {
                throw new Error("消息类型错误");
            }
            switch (response.mode) {
                case ReleaseResponseMode.PASS: {
                    if (response.show.length) {
                        throw new Error(`你一边说过，一边又尝试出牌`);
                    }
                    break;
                }
                case ReleaseResponseMode.EAT: {
                    if (receiver === sender) {
                        throw new Error("你怎么可以吃自己刚刚弃的牌");
                    }
                    if (!response.show) {
                        throw new Error(`你既然说吃，为什么不显示出自己的牌来?`)
                    }
                    if (response.show.length !== 2) {
                        throw new Error("展示的牌必须是2张");
                    }
                    //只有下家可以吃
                    if ((sender + 1) % this.USER_COUNT !== receiver) {
                        throw new Error("只有下家才能吃牌");
                    }
                    if (!contain(this.hand[receiver], response.show)) {
                        //接收者必须包含它所展示的牌，不能撒谎
                        throw new Error("你展示了你没有的牌，所以不能吃牌");
                    }
                    let a = response.show.slice();
                    a.push(release);
                    sortCards(a);
                    //吃了的牌必须是顺子
                    if (!(C.byName(a[0]).sparseIndex + 1 == C.byName(a[1]).sparseIndex &&
                        C.byName(a[0]).sparseIndex + 2 == C.byName(a[2]).sparseIndex)) {
                        throw new Error(`AI不能吃但是它返回吃，构不成顺子`);
                    }
                    break;
                }
                case ReleaseResponseMode.PENG: {
                    if (receiver === sender) {
                        throw new Error("你怎么可以吃自己刚刚弃的牌");
                    }
                    if (!response.show) {
                        throw new Error("碰牌show数组不应为空");
                    }
                    if (response.show.length != 0) {
                        throw new Error("碰牌无需展示牌");
                    }
                    //只有刻子才能碰
                    if (getCount(this.hand[receiver], release) < 2) {
                        throw new Error("碰牌的前提是你必须至少有两张相同的牌");
                    }
                    break;
                }
                case ReleaseResponseMode.MING_GANG: {
                    if (receiver === sender) {
                        throw new Error("不能明杠自己刚刚的弃牌");
                    }
                    if (!response.show) {
                        throw new Error("show数组不能为null，必须是一个空数组")
                    }
                    if (response.show.length != 0) {
                        throw new Error("show 数组应该为空");
                    }
                    if (getCount(this.hand[receiver], release) < 3) {
                        throw new Error("明杠必须至少有三张相同的牌");
                    }
                    break;
                }
                case ReleaseResponseMode.HU: {
                    const cards = this.hand[receiver].slice();
                    cards.push(release);
                    sortCards(cards);
                    if (!this.hu.hu(cards)) {
                        throw new Error(`你根本胡不了牌，你为啥报胡牌？${JSON.stringify(cards)}`);
                    }
                    break;
                }
                default: {
                    throw new Error(`未知的回复类型${response}`);
                }
            }
        }
    }

    validatePengResponse(responses: PengResponse[], receiver: number) {
        //校验碰牌之后的回复
        for (let i = 0; i < this.USER_COUNT; i++) {
            const response = responses[i];
            if (response.type !== MessageType.PENG) {
                throw new Error("消息类型错误");
            }
            if (i === receiver) {
                if (response.release) {
                    if (this.hand[receiver].indexOf(response.release) === -1) {
                        throw new Error(`你怎么可以弃你没有的牌`);
                    }
                } else {
                    throw new Error("碰完之后该你弃牌了");
                }
            } else {
                if (response.release) {
                    throw new Error("不该你弃牌你弃什么牌");
                }
            }
        }
    }

    validateFetchResponse(responses: FetchResponse[], card: string, turn: number) {
        for (let i = 0; i < this.USER_COUNT; i++) {
            const response = responses[i];
            if (response.type !== MessageType.FETCH) {
                throw new Error("消息类型错误");
            }
            switch (response.mode) {
                case FetchResponseMode.RELEASE: {
                    if (turn !== i) throw new Error(`别人刚摸了一张牌你弃什么牌`);
                    //如果是当前用户的id
                    if (!response.release) throw new Error("该你弃牌你咋不弃牌");
                    if (this.hand[i].indexOf(response.release) === -1) {
                        throw new Error("你咋还能弃你没有的牌");
                    }
                    break;
                }
                case FetchResponseMode.AN_GANG: {
                    if (turn !== i) throw new Error(`别人刚摸了一张牌你怎么能杠牌`);
                    if (i === turn) {
                        //用户已经拥有的牌的个数
                        if (getCount(this.hand[i], card) < 3) {
                            throw new Error("你无权暗杠");
                        }
                    } else {
                        throw new Error("刚才不是你摸牌，你凭啥暗杠");
                    }
                    break;
                }
                case FetchResponseMode.HU_SELF: {
                    if (turn !== i) throw new Error(`别人刚摸了一张牌你${i}怎么可能胡牌`);
                    //自摸胡校验
                    sortCards(this.hand[turn]);
                    if (!this.hu.hu(this.hand[turn])) {
                        throw new Error("你没有胡为啥说胡了");
                    }
                    break;
                }
                case FetchResponseMode.PASS: {
                    //如果不是你摸牌你就应该是pass
                    if (turn === i) {
                        throw new Error(`该你采取行动了，你不能pass`)
                    }
                }
            }
        }
    }

    validateEatResponse(responses: EatResponse[], sender: number, receiver: number) {
        for (let i = 0; i < this.USER_COUNT; i++) {
            const resp = responses[i];
            if (resp.type !== MessageType.EAT) {
                throw new Error("消息类型错误");
            }
            if (i === receiver) {
                if (!resp.release) throw new Error("该你弃牌了你咋不弃牌");
                if (this.hand[receiver].indexOf(resp.release) === -1) {
                    throw new Error("你怎么可以弃你没有的牌");
                }
            } else {
                if (resp.release) {
                    throw new Error("不该你弃牌，你弃什么牌");
                }
            }
        }
    }
}