/**
 * server worker
 * */
import AiWorker from "./ai.worker";
import {DavinceCodeServer} from "./DavinceCodeServer";
import {MessageType} from "./DavinceCodeProtocol";
import {emptyHandler, Handler} from "../majiang/core/Handler";
import {init, randInt} from "../majiang/util/Utils";

const ctx = self as any;
//ui向server发送消息时，直接通过
const ui: Handler = {
    postMessage(message: any): void {
        ctx.postMessage(message);
    },
    onMessage: emptyHandler,
}

const ais: Handler [] = [];
for (let i = 0; i < 2; i++) {
    const ai = new AiWorker();
    ai.onmessage = (event: any) => {
        ai.onMessage(event.data)
    }
    ais.push(ai);
}
ais.push(ui);

const server = new DavinceCodeServer();
const messageSet = new Set<string>(Object.values(MessageType));
init(new Date().toString());
let gameSeed = randInt(0, 1000000);


ctx.onmessage = (event: any) => {
    //消息可能是主进程发过来的，也可能是从子线程发过来的
    const message = event.data;
    if (messageSet.has(message.type)) {
        //那么是正常消息，是UI worker发过来的，此处ui.onMessage会被server重写，所以可以放心调用
        ui.onMessage(message);
    } else {
        //UI进程发过来的后门消息
        if (message.type === 'newGame') {
            console.log(`game seed is ${gameSeed}`);
            gameSeed = randInt(0, 1000000);
            server.newGame(ais, gameSeed.toString()).then(winner => {
                console.log(`winner is ${winner}`);
            })
        } else if (message.type === 'status') {
            console.log(server);
        } else if (message.type === 'replay') {
            console.log(`replay game ${gameSeed}`)
            server.newGame(ais, gameSeed.toString()).then(winner => {
                console.log(`winner is ${winner}`);
            })
        } else {
            throw new Error(`unhandled message ${JSON.stringify(message)}`);
        }
    }
}
export default null as any;