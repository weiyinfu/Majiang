import {Ai} from "./Ai.ts";
import {MyJudger} from "./ai/MyJudger";

/**
 * 把SearchAi封装成一个Worker
 * */
const ai = new Ai(new MyJudger(), message => {
    postMessage(message);
});
addEventListener('message', function (e) {
    ai.onMessage(e.data)
}, false);