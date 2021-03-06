"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Handler_1 = require("../majiang/core/Handler");
const DavinceCodeProtocol_1 = require("./DavinceCodeProtocol");
const DavinceCodeClient_1 = require("./DavinceCodeClient");
const Card_1 = require("./Card");
function solve(hand, badCalls, solver) {
    /**
     * 根据hand和shown返回可以猜的call以及猜对的概率
     * 此处代码存在优化空间，但是这个游戏过于简单，没有优化的必要
     * */
    let call = DavinceCodeProtocol_1.EmptyCall();
    const advice = solver.getAdvice(hand, badCalls);
    let best = [];
    for (let i = 0; i < hand.length; i++) {
        for (let j = 0; j < hand[i].length; j++) {
            if (Card_1.isUnknown(hand[i][j])) {
                //如果是未知，才会放进去
                const now = advice[i][j];
                if (best.length === 0 || best.length > now.length) {
                    best = now;
                    call = {
                        who: i,
                        which: j,
                        what: now[0],
                    };
                }
            }
        }
    }
    if (!call.what) {
        throw new Error(`不可能为空`);
    }
    if (call === DavinceCodeProtocol_1.EmptyCall()) {
        throw new Error(`没什么可call的了，游戏该结束了`);
    }
    return [call, 1 / best.length];
}
class Ai {
    constructor(solver) {
        this.postMessage = Handler_1.emptyHandler;
        this.cli = new DavinceCodeClient_1.DavinceCodeClient();
        this.solver = solver;
    }
    only(responses) {
        if (responses.length !== 1) {
            throw new Error(`too many responses`);
        }
        return responses[0];
    }
    onStart(req) {
        return this.only(this.cli.onStart(req));
    }
    onFetch(req) {
        const responses = this.cli.onFetch(req);
        if (req.who === this.cli.me) {
            const [call, _] = solve(this.cli.hand, this.cli.badCalls, this.solver);
            if (responses.length !== 1)
                throw new Error(`too many responses here`);
            const resp = responses[0];
            resp.call = call;
            return resp;
        }
        else {
            return this.only(responses);
        }
    }
    onCall(req) {
        const responses = this.cli.onCall(req);
        if (this.cli.over()) {
            return this.only(responses);
        }
        if (req.result && req.mine.who === this.cli.me) {
            //如果是我自己并且我猜对了，那么我可以选择继续猜
            //理应返回两个response，一个是过，一个是call
            if (responses.length !== 2)
                throw new Error('unexpected responses');
            const [call, p] = solve(this.cli.hand, this.cli.badCalls, this.solver);
            let passResp = responses[0], callResp = responses[1];
            //贪心法，如果有必胜的把握一定会call，能call则call；如果没有必胜的把握，能不call则不call
            //如果只剩下最后一张牌了，那么一定要勇敢地call
            if (p > 0.999 || this.cli.shown.size >= 23) {
                callResp.call = call;
                return callResp;
            }
            else {
                return passResp;
            }
        }
        else {
            return this.only(responses);
        }
    }
    onMessage(message) {
        let response;
        switch (message.type) {
            case DavinceCodeProtocol_1.MessageType.START: {
                response = this.onStart(message);
                break;
            }
            case DavinceCodeProtocol_1.MessageType.FETCH: {
                response = this.onFetch(message);
                break;
            }
            case DavinceCodeProtocol_1.MessageType.CALL: {
                response = this.onCall(message);
                break;
            }
            default: {
                throw new Error(`cannot handle message ${JSON.stringify(message)}`);
            }
        }
        this.postMessage(response);
    }
}
exports.Ai = Ai;
