"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MajiangServer_1 = require("../core/MajiangServer");
const ai_worker_1 = __importDefault(require("./ai.worker"));
const MajiangProtocol_1 = require("../core/MajiangProtocol");
const Card_1 = require("../core/Card");
const Handler_1 = require("../core/Handler");
const Pile_1 = require("../core/Pile");
const BestHu_1 = require("../hu/BestHu");
const ctx = self;
/**
 * 把调度器server封装成worker
 * server通过postMessage函数向各个worker发送消息
 * server会改写把worker的onmessage改写成onMessage函数
 * */
const ui = {
    onMessage: Handler_1.emptyHandler,
    //Server向UI发送消息
    postMessage(message) {
        ctx.postMessage(message);
    },
};
const ais = [ui];
for (let i = 0; i < 3; i++) {
    const worker = new ai_worker_1.default();
    //为了区分大小写，需要重写一下onmessage函数
    worker.onmessage = (e) => {
        worker.onMessage(e.data);
    };
    ais.push(worker);
}
const k = Math.floor(Math.random() * 1000000).toString();
console.log(`game seed=${k}`);
const messageTypes = new Set(Object.values(MajiangProtocol_1.MessageType));
const server = new MajiangServer_1.MajiangServer(new Pile_1.RandomPile(k), ais, BestHu_1.BestHu);
/**
 * inited用于控制newGame的次数，禁止多次调用MajiangServer的newGame，因为
 * 麻将服务器是一个异步的过程。重复newGame可能导致异步错误。所以正确的做法应该
 * 是调用worker.close()（在子线程中）或者worker.terminate()（在主线程中），
 * 关闭之后重新启动一个新的Server Worker。
 * */
let inited = false;
//UI向Server发的消息
ctx.addEventListener("message", e => {
    const message = e.data;
    if (messageTypes.has(message.type)) {
        //如果是麻将协议中的消息，那么需要发送给用户，因为这条消息是从ui.postMessage函数传过来的
        ui.onMessage(e.data);
    }
    else {
        switch (message.type) {
            case "newGame": {
                // 注意：当newGame事件只能调用一次。
                if (inited)
                    throw new Error(`duplicate new Game`);
                inited = true;
                server.doStart().then(winner => {
                    console.log(`${winner}赢了`);
                });
                break;
            }
            case "status": {
                //打印server端的状态，用于调试
                console.log('手牌');
                console.log(server.hand.map(x => Card_1.sortCards(x)));
                console.log('牌堆' + server.pile);
                console.log(server.pile);
                break;
            }
            default: {
                throw message;
            }
        }
    }
}, false);
//万物皆空，这一句话与import xxWorker from "xxx"遥相呼应，避免了各种ts类型检查报错
exports.default = null;
