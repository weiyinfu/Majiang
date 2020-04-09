import {Ai} from "./Ai";

const ctx = self as any;
const ai = new Ai();
ai.postMessage = (message) => {
    ctx.postMessage(message);
};
ctx.onmessage = (event: any) => {
    ai.onMessage(event.data);
}
export default null as any;