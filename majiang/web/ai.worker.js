"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ai_1 = require("../ai/Ai");
const BestJudger_1 = require("../ai/judger/BestJudger");
const ctx = self;
const ai = new Ai_1.Ai(new BestJudger_1.BestJudger());
ai.postMessage = message => {
    ctx.postMessage(message);
};
ctx.addEventListener('message', function (e) {
    ai.onMessage(e.data);
}, false);
exports.default = null;
