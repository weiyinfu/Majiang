"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MajiangProtocol_1 = require("../core/MajiangProtocol");
const Handler_1 = require("../core/Handler");
const MajiangClient_1 = require("../core/MajiangClient");
const Utils_1 = require("../util/Utils");
const BestHu_1 = require("../hu/BestHu");
const Sound_1 = require("./Sound");
const Card_1 = require("../core/Card");
var Sound;
(function (Sound) {
    Sound["START"] = "start";
    Sound["LOSE"] = "lose";
    Sound["WIN"] = "win";
    Sound["EAT"] = "eat";
    Sound["PENG"] = "peng";
    Sound["GANG"] = "gang";
})(Sound || (Sound = {}));
function wrap(s) {
    //用大括号把s括起来，便于与普通字符串区分
    return `{${s}}`;
}
class Ui {
    constructor() {
        this.winner = -1;
        this.messages = [];
        this.userNames = []; //用户名称
        this.client = new MajiangClient_1.MajiangClient(BestHu_1.BestHu);
        this.actions = [];
        this.postMessage = Handler_1.emptyHandler;
    }
    printMessage(message) {
        this.messages.push(message);
    }
    playCardSound(card) {
        this.playSound(Card_1.C.byName(card).sound);
    }
    playSound(sound) {
        Sound_1.playSound(sound);
    }
    sendActions(actions) {
        if (actions.length === 0)
            throw new Error(`无计可施`);
        if (actions.length === 1) {
            //如果用户只有一种决策，不用请示用户直接执行
            this.postMessage(actions[0]);
        }
        else {
            this.actions = actions;
        }
    }
    onEat(req) {
        this.playSound(Sound.EAT);
        this.printMessage(`${this.userNames[req.turn]}用${req.cards.slice(0, 2).join('')}吃了${wrap(req.cards[req.cards.length - 1])}`);
        this.sendActions(this.client.onEat(req));
    }
    onFetch(req) {
        this.printMessage(`${this.userNames[req.turn]}摸了一张${req.card ? wrap(req.card) : '牌'}`);
        this.sendActions(this.client.onFetch(req));
    }
    onOver(req) {
        if (req.mode === MajiangProtocol_1.OverMode.NO_CARD) {
            this.printMessage(`没牌了`);
        }
        else {
            this.printMessage(`${this.userNames[req.winner]}赢了！`);
        }
        this.playSound(req.winner === this.client.me ? Sound.WIN : Sound.LOSE);
        this.sendActions(this.client.onOver(req));
        this.winner = req.winner;
    }
    onPeng(req) {
        this.printMessage(`${this.userNames[req.turn]}碰了${wrap(this.client.lastRelease)}`);
        this.playSound(Sound.PENG);
        this.sendActions(this.client.onPeng(req));
    }
    onRelease(req) {
        this.playCardSound(req.card);
        this.printMessage(`${this.userNames[req.turn]}弃了一张${wrap(req.card)}`);
        this.sendActions(this.client.onRelease(req));
    }
    onStart(req) {
        this.winner = -1;
        this.messages = [];
        this.userNames = Utils_1.range(req.userCount).map(i => i == req.turn ? '我' : `${i}号`);
        this.playSound(Sound.START);
        this.printMessage(`游戏开始了！我摸到了${req.cards.length}张牌，一共${req.userCount}人参与。`);
        this.sendActions(this.client.onStart(req));
    }
    onMingGang(req) {
        this.playSound(Sound.GANG);
        this.printMessage(`${this.userNames[req.turn]}明杠了${wrap(this.client.lastRelease)}`);
        this.sendActions(this.client.onMingGang(req));
    }
    onAnGang(req) {
        this.playSound(Sound.GANG);
        this.printMessage(`${this.userNames[req.turn]}暗杠了${this.client.lastFetch ? wrap(this.client.lastFetch) : '一种牌'}`);
        this.sendActions(this.client.onAnGang(req));
    }
    onMessage(message) {
        switch (message.type) {
            case MajiangProtocol_1.MessageType.START: {
                this.onStart(message);
                break;
            }
            case MajiangProtocol_1.MessageType.RELEASE: {
                this.onRelease(message);
                break;
            }
            case MajiangProtocol_1.MessageType.PENG: {
                this.onPeng(message);
                break;
            }
            case MajiangProtocol_1.MessageType.EAT: {
                this.onEat(message);
                break;
            }
            case MajiangProtocol_1.MessageType.OVER: {
                this.onOver(message);
                break;
            }
            case MajiangProtocol_1.MessageType.FETCH: {
                this.onFetch(message);
                break;
            }
            case MajiangProtocol_1.MessageType.MING_GANG: {
                this.onMingGang(message);
                break;
            }
            case MajiangProtocol_1.MessageType.AN_GANG: {
                this.onAnGang(message);
                break;
            }
            default: {
                throw new Error(`未知的消息类型 ${message.type}`);
            }
        }
    }
}
exports.Ui = Ui;
