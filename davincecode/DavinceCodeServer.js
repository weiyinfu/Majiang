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
const Card_1 = require("./Card");
const Utils_1 = require("../majiang/util/Utils");
const uuid_1 = require("uuid");
const DavinceCodeProtocol_1 = require("./DavinceCodeProtocol");
class DavinceCodeServer {
    constructor() {
        this.userCount = 0;
        this.pile = []; //牌堆
        this.hand = []; //手牌，手牌应该有状态，倒或者没倒
        this.users = []; //用户
        this.shown = new Set(); //所有已经倒下的牌，因为每个牌的名字是唯一的，所以可以使用set
        this.diedSet = new Set(); //死亡的用户集合
    }
    isDied(userId) {
        //判断用户是否死亡
        if (this.diedSet.has(userId))
            return true;
        for (let i of this.hand[userId]) {
            if (!this.shown.has(i)) {
                return false;
            }
        }
        this.diedSet.add(userId);
        return true;
    }
    broadcast(requestGetter) {
        return new Promise(resolve => {
            const responses = new Array(this.userCount);
            const waiting = new Set();
            for (let userId = 0; userId < this.userCount; userId++) {
                waiting.add(userId);
                const token = uuid_1.v4();
                const req = requestGetter(userId);
                req.token = token;
                this.users[userId].onMessage = (resp) => {
                    if (resp.token !== token)
                        throw new Error("token不对");
                    if (resp.type !== req.type)
                        throw new Error("type不对");
                    waiting.delete(userId);
                    responses[userId] = resp;
                    if (waiting.size === 0) {
                        resolve(responses);
                    }
                };
                this.users[userId].postMessage(req);
            }
        });
    }
    newGame(users, seed) {
        return __awaiter(this, void 0, void 0, function* () {
            Utils_1.init(seed.toString());
            this.userCount = users.length;
            this.users = users;
            this.pile = Card_1.getCards();
            Utils_1.shuffle(this.pile);
            this.shown = new Set();
            this.diedSet = new Set();
            if (this.userCount < 2)
                throw new Error('too few users');
            if (this.userCount > 4)
                throw new Error('too many users');
            let handCount = this.userCount === 4 ? 3 : 4;
            this.hand = Utils_1.ll(this.userCount);
            for (let i = 0; i < this.userCount; i++) {
                this.hand[i] = this.pile.splice(0, handCount);
                Card_1.sortCards(this.hand[i]);
            }
            const responses = yield this.broadcast(turn => {
                const hand = Utils_1.deepcopy(this.hand);
                for (let i = 0; i < this.userCount; i++) {
                    if (i !== turn) {
                        for (let j = 0; j < hand[i].length; j++) {
                            hand[i][j] = Card_1.hide(hand[i][j]);
                        }
                    }
                }
                const req = {
                    type: DavinceCodeProtocol_1.MessageType.START,
                    turn: turn,
                    hand,
                    token: "",
                };
                return req;
            });
            return yield this.doFetch(0);
        });
    }
    doFetch(fetcher) {
        return __awaiter(this, void 0, void 0, function* () {
            //执行摸牌
            if (this.isDied(fetcher))
                return this.doFetch((fetcher + 1) % this.userCount);
            let fetched = '';
            if (this.pile.length > 0) {
                const ind = Utils_1.randInt(0, this.pile.length);
                fetched = this.pile.splice(ind, 1)[0];
                this.hand[fetcher].push(fetched);
                Card_1.sortCards(this.hand[fetcher]);
            }
            let responses = yield this.broadcast(turn => {
                let what = fetched;
                if (what) {
                    what = turn === fetcher ? fetched : Card_1.hide(fetched);
                }
                const req = {
                    what,
                    who: fetcher,
                    which: this.hand[fetcher].indexOf(fetched),
                    token: '',
                    type: DavinceCodeProtocol_1.MessageType.FETCH,
                };
                return req;
            });
            this.validateFetchResponse(responses, fetcher);
            const resp = responses[fetcher];
            //重写fetched，fetched表示最小的那张牌
            if (!fetched) {
                //如果没牌了，那么下次猜错了倒下最左边没有倒下的牌
                fetched = this.hand[fetcher].filter(x => !this.shown.has(x))[0];
            }
            return this.doCall(fetcher, fetched, resp.call);
        });
    }
    doCall(caller, lastFetch, call) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDied(caller))
                throw new Error(`user ${caller} has died,cannot call anymore`);
            const result = this.getCallResult(call);
            const mine = {
                who: caller,
                what: result ? '' : lastFetch,
                which: this.hand[caller].indexOf(lastFetch),
            };
            const validCall = result ? call : mine;
            this.shown.add(validCall.what);
            //把结果通知给各个用户
            const responses = yield this.broadcast(userId => {
                const req = {
                    call,
                    result,
                    mine: mine,
                    token: "",
                    type: DavinceCodeProtocol_1.MessageType.CALL,
                };
                return req;
            });
            if (this.isDied(validCall.who)) {
                this.diedSet.add(validCall.who);
                if (this.diedSet.size === this.userCount - 1) {
                    //场上只剩下一个人了
                    let winner = -1;
                    for (let userId = 0; userId < this.userCount; userId++)
                        if (!this.isDied(userId))
                            winner = userId;
                    return winner;
                }
            }
            //成功了，则应该继续call
            this.validateCallResponse(caller, result, responses);
            const resp = responses[caller];
            if (resp.call) {
                //如果call对的用户继续call
                return this.doCall(caller, lastFetch, resp.call);
            }
            else {
                return this.doFetch((caller + 1) % this.userCount);
            }
        });
    }
    validateCallResponse(caller, result, responses) {
        for (let i = 0; i < this.userCount; i++) {
            if (this.isDied(i))
                continue;
            const resp = responses[i];
            if (i === caller) {
                if (resp.call) {
                    if (result) {
                        //上次猜测成功了
                        this.validateCall(caller, resp.call);
                    }
                    else {
                        throw new Error(`last time you failed so you cannot continue call`);
                    }
                }
                else {
                    // caller不再继续call了
                }
            }
            else {
                if (resp.call) {
                    throw new Error(`不该着你call你call什么`);
                }
            }
        }
    }
    getCallResult(call) {
        //判断叫牌结果是否正确
        if (call.who < 0 || call.who >= this.userCount)
            return false;
        if (this.isDied(call.who))
            return false;
        if (this.shown.has(call.what))
            return false;
        if (this.hand[call.who][call.which] === call.what)
            return true;
        return false;
    }
    validateCall(userId, call) {
        if (call.who < 0 || call.who > this.userCount) {
            throw new Error(`call.who error ${call.who}`);
        }
        if (this.isDied(call.who)) {
            throw new Error(`${call.who} has already died`);
        }
        if (userId === call.who) {
            throw new Error(`cannot call your self's card`);
        }
        if (call.which < 0 || call.which >= this.hand[call.who].length) {
            throw new Error(`call.which error ${call.which}`);
        }
        if (!Card_1.CardMap[call.what]) {
            throw new Error(`call 的牌错误 ${call.what}`);
        }
    }
    validateFetchResponse(responses, fetcher) {
        for (let userId = 0; userId < this.userCount; userId++) {
            if (this.isDied(userId)) { //不检验死者的回复
                continue;
            }
            const resp = responses[userId];
            if (userId === fetcher) {
                if (resp.call === null)
                    throw new Error(`You should call`);
                this.validateCall(fetcher, resp.call);
            }
            else {
                //如果不是我，那么理应pass
                if (resp.call !== null)
                    throw new Error(`You shouldn't call`);
            }
        }
    }
}
exports.DavinceCodeServer = DavinceCodeServer;
