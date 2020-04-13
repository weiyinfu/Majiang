import {Ai} from "./Ai";
import {bestSolver} from "./solver/BestSolver";

const ctx = self as any;
const ai = new Ai(bestSolver);
ai.postMessage = (message) => {
    ctx.postMessage(message);
};
ctx.onmessage = (event: any) => {
    ai.onMessage(event.data);
}
export default null as any;