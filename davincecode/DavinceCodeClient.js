"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DavinceCodeProtocol_1 = require("./DavinceCodeProtocol");
const Card_1 = require("./Card");
class DavinceCodeClient {
    constructor() {
        this.hand = [];
        this.userCount = -1;
        this.me = -1;
        this.diedSet = new Set();
        //因为自己的牌始终是显示着的，所以此处必须使用shown记录自己手牌的状态
        this.shown = new Set();
        this.badCalls = [];
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
    over() {
        return this.diedSet.size === this.userCount - 1;
    }
    onCall(req) {
        if (this.isDied(req.mine.who))
            throw new Error(`${req.mine.who} has already died`);
        const call = req.result ? req.call : req.mine;
        this.hand[call.who][call.which] = call.what;
        this.shown.add(call.what);
        if (this.isDied(call.who)) {
            this.diedSet.add(call.who);
        }
        if (!req.result) {
            //call自己的也需要保存，因为这表明别人可能没有这样的牌
            this.badCalls.push(req.call);
        }
        const resp = [{ call: null, token: req.token, type: req.type }];
        if (req.result && req.mine.who === this.me && !this.over()) {
            //如果游戏结束了，那么就没有必要继续call了
            resp.push({ call: DavinceCodeProtocol_1.EmptyCall(), token: req.token, type: req.type });
        }
        //call完之后肯定有牌会显示出来，此时更新badCalls列表
        this.badCalls = this.badCalls.filter(x => !this.shown.has(this.hand[x.who][x.which]));
        return resp;
    }
    onFetch(req) {
        if (this.isDied(req.who))
            throw new Error(`${req.who} has died`);
        if (req.who === this.me) {
            //如果是我摸到牌了
            if (req.what) { //如果我确实摸到牌了，此处牌堆里没有牌的时候，what为空
                this.hand[this.me].push(req.what);
                Card_1.sortCards(this.hand[this.me]);
                if (this.hand[this.me].indexOf(req.what) !== req.which) {
                    throw new Error(`client hand is different with server`);
                }
            }
            //我必须叫牌
            const resp = { call: DavinceCodeProtocol_1.EmptyCall(), token: req.token, type: req.type };
            return [resp];
        }
        else {
            if (req.what) { //如果牌堆里面有牌
                this.hand[req.who].splice(req.which, 0, req.what);
                //important!!更新badCall列表中元素的下标
                for (let bad of this.badCalls) {
                    if (bad.who === req.who) {
                        if (bad.which >= req.which) {
                            bad.which++;
                        }
                    }
                }
            }
            return [{ call: null, type: req.type, token: req.token }];
        }
    }
    onStart(req) {
        this.userCount = req.hand.length;
        this.diedSet = new Set();
        this.me = req.turn;
        //初始化手牌
        this.hand = req.hand;
        this.shown.clear();
        this.badCalls = [];
        return [{ type: DavinceCodeProtocol_1.MessageType.START, token: req.token }];
    }
}
exports.DavinceCodeClient = DavinceCodeClient;
