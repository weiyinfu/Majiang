"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * server worker
 * */
const ai_worker_1 = __importDefault(require("./ai.worker"));
const DavinceCodeServer_1 = require("./DavinceCodeServer");
const DavinceCodeProtocol_1 = require("./DavinceCodeProtocol");
const Handler_1 = require("../majiang/core/Handler");
const Utils_1 = require("../majiang/util/Utils");
const ctx = self;
//ui向server发送消息时，直接通过
const ui = {
    postMessage(message) {
        ctx.postMessage(message);
    },
    onMessage: Handler_1.emptyHandler,
};
const ais = [];
for (let i = 0; i < 2; i++) {
    const ai = new ai_worker_1.default();
    ai.onmessage = (event) => {
        ai.onMessage(event.data);
    };
    ais.push(ai);
}
ais.push(ui);
const server = new DavinceCodeServer_1.DavinceCodeServer();
const messageSet = new Set(Object.values(DavinceCodeProtocol_1.MessageType));
Utils_1.init(new Date().toString());
let gameSeed = Utils_1.randInt(0, 1000000);
ctx.onmessage = (event) => {
    //消息可能是主进程发过来的，也可能是从子线程发过来的
    const message = event.data;
    if (messageSet.has(message.type)) {
        //那么是正常消息，是UI worker发过来的，此处ui.onMessage会被server重写，所以可以放心调用
        ui.onMessage(message);
    }
    else {
        //UI进程发过来的后门消息
        if (message.type === 'newGame') {
            console.log(`game seed is ${gameSeed}`);
            gameSeed = Utils_1.randInt(0, 1000000);
            server.newGame(ais, gameSeed.toString()).then(winner => {
                console.log(`winner is ${winner}`);
            });
        }
        else if (message.type === 'status') {
            console.log(server);
        }
        else if (message.type === 'replay') {
            console.log(`replay game ${gameSeed}`);
            server.newGame(ais, gameSeed.toString()).then(winner => {
                console.log(`winner is ${winner}`);
            });
        }
        else {
            throw new Error(`unhandled message ${JSON.stringify(message)}`);
        }
    }
};
exports.default = null;
