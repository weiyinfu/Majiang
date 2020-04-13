"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ai_1 = require("./Ai");
const BestSolver_1 = require("./solver/BestSolver");
const ctx = self;
const ai = new Ai_1.Ai(BestSolver_1.bestSolver);
ai.postMessage = (message) => {
    ctx.postMessage(message);
};
ctx.onmessage = (event) => {
    ai.onMessage(event.data);
};
exports.default = null;
