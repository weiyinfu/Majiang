"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 麻将调度器
 */
const Card_1 = require("./Card");
const MajiangProtocol_1 = require("./MajiangProtocol");
const uuid_1 = require("uuid");
const Utils_1 = require("./Utils");
function contain(big, small) {
    //判断big牌列表中是否包含small中的全部牌
    for (let i of small) {
        if (big.indexOf(i) === -1) {
            return false;
        }
    }
    return true;
}
function releaseModePriority(opType) {
    //对弃牌的操作的优先级
    switch (opType) {
        case MajiangProtocol_1.ReleaseResponseMode.PASS:
            return 0;
        case MajiangProtocol_1.ReleaseResponseMode.EAT:
            return 1;
        case MajiangProtocol_1.ReleaseResponseMode.PENG:
            return 2;
        case MajiangProtocol_1.ReleaseResponseMode.MING_GANG:
            return 3;
        case MajiangProtocol_1.ReleaseResponseMode.HU:
            return 4;
        default:
            throw new Error('unknown op type ' + opType);
    }
}
class MajiangServer {
    constructor() {
        //宏观参数
        this.USER_COUNT = 4; //用户的个数
        this.CARD_COUNT = 13; //每个人的手牌数
        //各种牌区域
        this.hand = []; //各个用户的手牌
        this.shown = []; //各个用户的亮牌，“吃，碰，明杠”之后被迫显示出来的牌
        this.anGang = []; //各个用户暗杠的牌，暗杠的牌只需要放一张就可以（因为四张相同）
        this.pile = []; //牌堆，未知的牌
        this.rubbish = []; //用户当前的弃牌，当牌堆中的牌被摸完时，对发出来的牌进行重新洗牌
        //各个用户接口
        this.users = [];
    }
    broadcast(messageGenerator) {
        return new Promise((resolve) => {
            const responses = new Array(this.USER_COUNT);
            const got = new Set();
            for (let userId = 0; userId < this.USER_COUNT; userId++) {
                const token = uuid_1.v4();
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
                    got.add(userId);
                    if (got.size === this.USER_COUNT) {
                        //如果各个用户都回复了，那么执行下一步
                        resolve(responses);
                    }
                };
                this.users[userId].postMessage(message);
            }
        });
    }
    newGame(users) {
        return __awaiter(this, void 0, void 0, function* () {
            this.users = users;
            this.USER_COUNT = users.length;
            this.pile = Card_1.getCards();
            Utils_1.shuffle(this.pile);
            this.hand = [];
            this.rubbish = [];
            this.shown = Utils_1.ll(this.USER_COUNT);
            this.anGang = Utils_1.ll(this.USER_COUNT);
            Utils_1.range(this.USER_COUNT).forEach(userId => {
                let userCards = this.pile.splice(0, this.CARD_COUNT);
                this.hand.push(userCards);
            });
            const responses = yield this.broadcast(turn => {
                const req = {
                    type: MajiangProtocol_1.MessageType.START,
                    cards: this.hand[turn].slice(),
                    turn: turn,
                    token: "",
                    userCount: this.USER_COUNT,
                };
                return req;
            });
            //总是从第0号用户开始摸牌
            const winner = yield this.doFetch(0);
            //执行一项校验，检查游戏过程中牌是否合理，最终的牌数应该和开局时的牌数相同
            let allCards = Utils_1.flat([this.pile, this.shown, this.hand, this.rubbish, Utils_1.li(4, this.anGang)]);
            if (Card_1.sortCards(Card_1.getCards()).join('') !== Card_1.sortCards(allCards).join('')) {
                throw new Error(`游戏状态错误`);
            }
            return winner;
        });
    }
    doFetch(fetcher) {
        return __awaiter(this, void 0, void 0, function* () {
            //从牌堆摸一张牌，返回胜利者的ID
            if (this.pile.length === 0) {
                const responses = yield this.broadcast(turn => {
                    const resp = {
                        winner: -1,
                        type: MajiangProtocol_1.MessageType.OVER,
                        token: '',
                        mode: MajiangProtocol_1.OverMode.NO_CARD,
                    };
                    return resp;
                });
                return -1;
            }
            const fetched = this.pile.splice(0, 1)[0];
            this.hand[fetcher].push(fetched);
            const responses = yield this.broadcast(t => {
                const req = {
                    type: MajiangProtocol_1.MessageType.FETCH,
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
                case MajiangProtocol_1.FetchResponseMode.AN_GANG: {
                    //从手牌中移掉四张牌
                    const responses = yield this.broadcast(turn => {
                        const resp = {
                            turn: fetcher,
                            token: '',
                            type: MajiangProtocol_1.MessageType.AN_GANG,
                        };
                        return resp;
                    });
                    Utils_1.remove(this.hand[fetcher], Utils_1.li(4, fetched));
                    this.anGang[fetcher].push(fetched);
                    //对于暗杠无需校验，只需要通知一下即可，暗杠完了之后继续当前用户的摸牌弃牌
                    return this.doFetch(fetcher);
                }
                case MajiangProtocol_1.FetchResponseMode.RELEASE: {
                    return this.doRelease(fetcher, fetchResp.release);
                }
                case MajiangProtocol_1.FetchResponseMode.HU_SELF: {
                    //自摸糊了
                    const responses = yield this.broadcast(turn => {
                        const req = {
                            type: MajiangProtocol_1.MessageType.OVER,
                            winner: fetcher,
                            token: "",
                            mode: MajiangProtocol_1.OverMode.HU_SELF,
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
        });
    }
    doRelease(sender, release) {
        return __awaiter(this, void 0, void 0, function* () {
            //用户sender弃牌release，返回胜利者的ID
            const releaseId = this.hand[sender].indexOf(release);
            this.hand[sender].splice(releaseId, 1);
            //通知各个AI，有人弃了若干张牌
            const responses = yield this.broadcast((turn) => {
                const req = {
                    type: MajiangProtocol_1.MessageType.RELEASE,
                    turn: sender,
                    card: release,
                    token: "",
                };
                return req;
            });
            //消息校验，验证所有用户的消息都是合法的
            this.validateReleaseResponse(responses, sender, release);
            let receiver = 0;
            //因为胡牌存在截胡规则，所以从当前用户开始转，只有遇到更高优先级才改变receiver
            for (let i = 0; i < this.USER_COUNT; i++) {
                const who = (sender + i) % 4;
                if (releaseModePriority(responses[who].mode) > releaseModePriority(responses[receiver].mode)) {
                    receiver = i;
                }
            }
            const releaseResp = responses[receiver];
            switch (releaseResp.mode) {
                case MajiangProtocol_1.ReleaseResponseMode.PASS: {
                    this.rubbish.push(release);
                    return this.doFetch((sender + 1) % this.USER_COUNT);
                }
                case MajiangProtocol_1.ReleaseResponseMode.PENG: {
                    Utils_1.remove(this.hand[receiver], Utils_1.li(2, release)); //从手牌删除掉，放到明牌里面
                    this.shown[receiver].push(Utils_1.li(3, release));
                    const responses = yield this.broadcast(turn => {
                        const req = {
                            type: MajiangProtocol_1.MessageType.PENG,
                            turn: receiver,
                            token: "",
                        };
                        return req;
                    });
                    //参数校验
                    this.validatePengResponse(responses, receiver);
                    //完成碰牌之后receiver需要弃牌
                    const pengResp = responses[receiver];
                    return yield this.doRelease(receiver, pengResp.release);
                }
                case MajiangProtocol_1.ReleaseResponseMode.MING_GANG: {
                    //如果杠牌了
                    Utils_1.remove(this.hand[receiver], Utils_1.li(3, release)); //从手牌删除掉，放到明牌里面
                    this.shown[receiver].push(Utils_1.li(4, release));
                    const responses = this.broadcast(turn => {
                        const req = {
                            type: MajiangProtocol_1.MessageType.MING_GANG,
                            turn: receiver,
                            token: "",
                        };
                        return req;
                    });
                    //明杠不需要弃牌，也不需要参数校验，需要重新摸牌弃牌
                    return yield this.doFetch(receiver);
                }
                case MajiangProtocol_1.ReleaseResponseMode.EAT: {
                    const cards = releaseResp.show;
                    Utils_1.remove(this.hand[receiver], cards);
                    cards.push(release);
                    this.shown[receiver].push(cards);
                    const responses = yield this.broadcast(turn => {
                        const req = {
                            type: MajiangProtocol_1.MessageType.EAT,
                            turn: receiver,
                            cards: cards,
                            token: "",
                        };
                        return req;
                    });
                    this.validateEatResponse(responses, sender, receiver);
                    const resp = responses[receiver];
                    return this.doRelease(receiver, resp.release);
                }
                case MajiangProtocol_1.ReleaseResponseMode.HU: {
                    //如果胡牌了
                    this.hand[receiver].push(release);
                    const responses = yield this.broadcast(turn => {
                        const req = {
                            type: MajiangProtocol_1.MessageType.OVER,
                            winner: receiver,
                            token: "",
                            mode: MajiangProtocol_1.OverMode.HU,
                        };
                        return req;
                    });
                    //通知别人胡牌之后不需要校验回复responses
                    return receiver;
                }
                default: {
                    throw new Error(`未知的弃牌回复模式${releaseResp.mode}`);
                }
            }
        });
    }
    validateReleaseResponse(responses, sender, release) {
        //校验弃牌回复
        for (let receiver = 0; receiver < this.USER_COUNT; receiver++) {
            const response = responses[receiver];
            if (response.type !== MajiangProtocol_1.MessageType.RELEASE) {
                throw new Error("消息类型错误");
            }
            switch (response.mode) {
                case MajiangProtocol_1.ReleaseResponseMode.PASS: {
                    if (response.show.length) {
                        throw new Error(`你一边说过，一边又尝试出牌`);
                    }
                    break;
                }
                case MajiangProtocol_1.ReleaseResponseMode.EAT: {
                    if (receiver === sender) {
                        throw new Error("你怎么可以吃自己刚刚弃的牌");
                    }
                    if (!response.show) {
                        throw new Error(`你既然说吃，为什么不显示出自己的牌来?`);
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
                    Card_1.sortCards(a);
                    //吃了的牌必须是顺子
                    if (!(Card_1.CardMap[a[0]].sparseIndex + 1 == Card_1.CardMap[a[1]].sparseIndex &&
                        Card_1.CardMap[a[0]].sparseIndex + 2 == Card_1.CardMap[a[2]].sparseIndex)) {
                        throw new Error(`AI不能吃但是它返回吃，构不成顺子`);
                    }
                    break;
                }
                case MajiangProtocol_1.ReleaseResponseMode.PENG: {
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
                    if (Utils_1.getCount(this.hand[receiver], release) < 2) {
                        throw new Error("碰牌的前提是你必须至少有两张相同的牌");
                    }
                    break;
                }
                case MajiangProtocol_1.ReleaseResponseMode.MING_GANG: {
                    if (receiver === sender) {
                        throw new Error("不能明杠自己刚刚的弃牌");
                    }
                    if (!response.show) {
                        throw new Error("show数组不能为null，必须是一个空数组");
                    }
                    if (response.show.length != 0) {
                        throw new Error("show 数组应该为空");
                    }
                    if (Utils_1.getCount(this.hand[receiver], release) < 3) {
                        throw new Error("明杠必须至少有三张相同的牌");
                    }
                    break;
                }
                case MajiangProtocol_1.ReleaseResponseMode.HU: {
                    const cards = this.hand[receiver].slice();
                    cards.push(release);
                    Card_1.sortCards(cards);
                    if (!Card_1.hu(cards)) {
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
    validatePengResponse(responses, receiver) {
        //校验碰牌之后的回复
        for (let i = 0; i < this.USER_COUNT; i++) {
            const response = responses[i];
            if (response.type !== MajiangProtocol_1.MessageType.PENG) {
                throw new Error("消息类型错误");
            }
            if (i === receiver) {
                if (response.release) {
                    if (this.hand[receiver].indexOf(response.release) === -1) {
                        throw new Error(`你怎么可以弃你没有的牌`);
                    }
                }
                else {
                    throw new Error("碰完之后该你弃牌了");
                }
            }
            else {
                if (response.release) {
                    throw new Error("不该你弃牌你弃什么牌");
                }
            }
        }
    }
    validateFetchResponse(responses, card, turn) {
        for (let i = 0; i < this.USER_COUNT; i++) {
            const response = responses[i];
            if (response.type !== MajiangProtocol_1.MessageType.FETCH) {
                throw new Error("消息类型错误");
            }
            switch (response.mode) {
                case MajiangProtocol_1.FetchResponseMode.RELEASE: {
                    if (turn !== i)
                        throw new Error(`别人刚摸了一张牌你弃什么牌`);
                    //如果是当前用户的id
                    if (!response.release)
                        throw new Error("该你弃牌你咋不弃牌");
                    if (this.hand[i].indexOf(response.release) === -1) {
                        throw new Error("你咋还能弃你没有的牌");
                    }
                    break;
                }
                case MajiangProtocol_1.FetchResponseMode.AN_GANG: {
                    if (turn !== i)
                        throw new Error(`别人刚摸了一张牌你怎么能杠牌`);
                    if (i === turn) {
                        //用户已经拥有的牌的个数
                        if (Utils_1.getCount(this.hand[i], card) < 3) {
                            throw new Error("你无权暗杠");
                        }
                    }
                    else {
                        throw new Error("刚才不是你摸牌，你凭啥暗杠");
                    }
                    break;
                }
                case MajiangProtocol_1.FetchResponseMode.HU_SELF: {
                    if (turn !== i)
                        throw new Error(`别人刚摸了一张牌你${i}怎么可能胡牌`);
                    //自摸胡校验
                    Card_1.sortCards(this.hand[turn]);
                    if (!Card_1.hu(this.hand[turn])) {
                        throw new Error("你没有胡为啥说胡了");
                    }
                    break;
                }
                case MajiangProtocol_1.FetchResponseMode.PASS: {
                    //如果不是你摸牌你就应该是pass
                    if (turn === i) {
                        throw new Error(`该你采取行动了，你不能pass`);
                    }
                }
            }
        }
    }
    validateEatResponse(responses, sender, receiver) {
        for (let i = 0; i < this.USER_COUNT; i++) {
            const resp = responses[i];
            if (resp.type !== MajiangProtocol_1.MessageType.EAT) {
                throw new Error("消息类型错误");
            }
            if (i === receiver) {
                if (!resp.release)
                    throw new Error("该你弃牌了你咋不弃牌");
                if (this.hand[receiver].indexOf(resp.release) === -1) {
                    throw new Error("你怎么可以弃你没有的牌");
                }
            }
            else {
                if (resp.release) {
                    throw new Error("不该你弃牌，你弃什么牌");
                }
            }
        }
    }
}
exports.MajiangServer = MajiangServer;
