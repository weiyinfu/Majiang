import {Ai} from "../ai/Ai";
import {BestJudger} from "../ai/judger/BestJudger";

const ctx: Worker = self as any;
const ai = new Ai(new BestJudger());
ai.postMessage = message => {
    ctx.postMessage(message);
}
ctx.addEventListener('message', function (e) {
    ai.onMessage(e.data)
}, false);
export default null as any;