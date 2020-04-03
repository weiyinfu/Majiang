import {Ai} from "./Ai";
import {JudgerForAi} from "./ai/JudgerForAi";

const ctx: Worker = self as any;
const ai = new Ai(new JudgerForAi());
ai.postMessage = message => {
    ctx.postMessage(message);
}
ctx.addEventListener('message', function (e) {
    ai.onMessage(e.data)
}, false);
export default null as any;