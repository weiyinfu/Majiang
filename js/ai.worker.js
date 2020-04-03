"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ai_1 = require("./Ai");
const JudgerForAi_1 = require("./ai/JudgerForAi");
const ctx = self;
const ai = new Ai_1.Ai(new JudgerForAi_1.JudgerForAi());
ai.postMessage = message => {
    ctx.postMessage(message);
};
ctx.addEventListener('message', function (e) {
    ai.onMessage(e.data);
}, false);
exports.default = null;
