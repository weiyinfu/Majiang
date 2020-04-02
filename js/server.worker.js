import {MajiangServer} from "./MajiangServer.ts";
import AiWorker from "./ai.worker.js";
import {MessageType} from "./MajiangProtocol.ts";
import {sortCards} from "./Card";

/**
 * 把调度器server封装成worker
 * server通过postMessage函数向各个worker发送消息
 * server会改写把worker的onmessage改写成onMessage函数
 * */
const ui = {
    onMessage: () => {
    },//ui的onMessage由Server负责赋值
    //Server向UI发送消息
    postMessage(message) {
        postMessage(message);
    },
};

function getAis() {
    const ais = [ui];
    for (let i = 0; i < 3; i++) {
        const worker = new AiWorker();
        //为了区分大小写，需要重写一下onmessage函数
        worker.onmessage = (e) => {
            worker.onMessage(e.data);
        };
        ais.push(worker);
    }
    return ais;
}

function shutDown(server) {
    server.ais.forEach(ai => {
        if (ai.terminate) {
            ai.terminate()
        }
    })
}

const messageTypes = new Set(Object.values(MessageType));
let server = null;

//UI向Server发的消息
addEventListener("message", e => {
    const message = e.data;
    if (messageTypes.has(message.type)) {
        //如果是麻将协议中的消息，那么需要发送给用户，因为这条消息是从ui.postMessage函数传过来的
        ui.onMessage(e.data);
    } else {
        console.log(message)
        switch (message.type) {
            case "newGame": {
                if (server !== null) {
                    shutDown(server);
                    server = null;
                }
                const ais = getAis();
                server = new MajiangServer(ais);
                server.newGame(ais);
                break;
            }
            case "status": {
                //打印server端的状态，用于调试
                console.log('手牌')
                console.log(server.hand.map(x => sortCards(x)))
                console.log('牌堆' + server.pile.length)
                console.log(server.pile)
                break;
            }
            default: {
                throw message;
            }
        }
    }
}, false);
console.log('server 初始化完成');
