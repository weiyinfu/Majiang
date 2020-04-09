"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JudgerJudger_1 = require("./JudgerJudger");
const MyJudger_1 = require("../judger/MyJudger");
const RandomJudger_1 = require("../judger/RandomJudger");
// const jj = new SearchJudger(new GreedyJudger(), 2, 2);
// const jj = new GreedyJudger();
let jj = new MyJudger_1.PartSumJudger();
// jj = new ConstantJudger();
jj = new RandomJudger_1.ExtremeJudger(true);
// const jj = new RandomJudger();
const res = JudgerJudger_1.judgeJudger(jj, JudgerJudger_1.generateProblems(1), 13);
console.log(`期望摸牌次数${res}`);
