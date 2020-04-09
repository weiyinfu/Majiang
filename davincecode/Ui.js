"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DavinceCodeProtocol_1 = require("./DavinceCodeProtocol");
const DavinceCodeClient_1 = require("./DavinceCodeClient");
const Utils_1 = require("../majiang/util/Utils");
class Ui {
    constructor(postMessage) {
        this.cli = new DavinceCodeClient_1.DavinceCodeClient();
        this.actions = []; //用户可以执行的操作
        this.messages = [];
        this.userNames = [];
        if (!postMessage)
            throw new Error('error postMessage');
        this.postMessage = postMessage;
    }
    printMessage(message) {
        this.messages.push(message);
    }
    sendAction(resp) {
        if (resp.length === 0)
            throw new Error(`should response`);
        if (resp.length === 1) {
            this.postMessage(resp[0]);
            return;
        }
        throw new Error(`cannot send many responses ${JSON.stringify(resp)}`);
    }
    onCall(req) {
        const { call, mine } = req;
        const responses = this.cli.onCall(req);
        this.printMessage(`${this.userNames[mine.who]}称${this.userNames[call.who]}的第${call.which + 1}是${call.what}。${req.result ? '说得对' : '错了'}`);
        if (!req.result) {
            this.printMessage(`为表示惩罚，${this.userNames[mine.who]}刚才摸的那张牌是${mine.what}`);
        }
        else {
            this.printMessage(`为表示奖励，${this.userNames[mine.who]}有权选择继续猜牌`);
        }
        const validCall = req.result ? req.call : req.mine;
        if (this.cli.isDied(validCall.who)) {
            this.printMessage(`${this.userNames[validCall.who]}死了`);
        }
        if (this.cli.over()) {
            //如果猜完之后游戏结束了，那么必然接下来我没什么可做了
            this.sendAction(responses);
            const winner = Utils_1.range(this.cli.userCount).map(x => x).filter(x => !this.cli.isDied(x))[0];
            this.printMessage(`${this.userNames[winner]}赢了`);
            return;
        }
        if (req.mine.who === this.cli.me) {
            //如果是我在call
            if (req.result) {
                //如果我猜对了，那么我可以继续猜
                this.actions = responses;
            }
            else {
                //如果猜错了，我什么都不能做
                this.sendAction(responses);
            }
        }
        else {
            //如果是别人在call，那么肯定直接过
            this.sendAction(responses);
        }
    }
    onStart(req) {
        const responses = this.cli.onStart(req);
        this.messages = [];
        this.actions = [];
        this.userNames = Utils_1.range(this.cli.userCount).map(x => x === this.cli.me ? '我' : `${x}号`);
        this.printMessage(`游戏开始了，一共${this.cli.userCount}个用户参与，我是${this.cli.me}个摸牌`);
        this.sendAction(responses);
    }
    onFetch(req) {
        const responses = this.cli.onFetch(req);
        if (!req.what) {
            this.printMessage(`轮到${this.userNames[req.who]} call了，但是没牌了。直接叫牌。`);
        }
        if (req.who === this.cli.me) {
            if (req.what) {
                this.printMessage(`${this.userNames[req.who]}摸了一张${req.what}`);
            }
            if (responses.length !== 1)
                throw new Error(`摸牌之后只能有一种操作，client似乎错了`);
            this.actions = responses;
        }
        else {
            if (req.what) {
                this.printMessage(`${this.userNames[req.who]}摸了一张牌放在了${req.which}处`);
            }
            this.sendAction(responses);
        }
    }
    onMessage(message) {
        switch (message.type) {
            case DavinceCodeProtocol_1.MessageType.CALL: {
                this.onCall(message);
                break;
            }
            case DavinceCodeProtocol_1.MessageType.FETCH: {
                this.onFetch(message);
                break;
            }
            case DavinceCodeProtocol_1.MessageType.START: {
                this.onStart(message);
                break;
            }
            default: {
                throw new Error(`unknown message type ${JSON.stringify(message)}`);
            }
        }
    }
}
exports.Ui = Ui;
