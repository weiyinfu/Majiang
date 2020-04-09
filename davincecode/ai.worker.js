"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ai_1 = require("./Ai");
const ctx = self;
const ai = new Ai_1.Ai();
ai.postMessage = (message) => {
    ctx.postMessage(message);
};
ctx.onmessage = (event) => {
    ai.onMessage(event.data);
};
exports.default = null;
