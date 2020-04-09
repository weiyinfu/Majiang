"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MyJudger_1 = require("../majiang/ai/judger/MyJudger");
const a = [2, 3, 3, 4];
const target = [[2, 0, 1, 0], [1, 1, 2, 1], [0, 2, 2, 0]];
const res = MyJudger_1.FetchBall.accurate(a, target);
const monte = MyJudger_1.FetchBall.montecarlo(a, target, 2000);
console.log(`accurate ${res}
motecarlo ${monte}
atMost:${MyJudger_1.FetchBall.atMost(a, target)}
atLeast:${MyJudger_1.FetchBall.atLeast(a, target)}
`);
