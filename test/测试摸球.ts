import {FetchBall} from "../majiang/ai/judger/MyJudger";

const a = [2, 3, 3, 4];
const target = [[2, 0, 1, 0], [1, 1, 2, 1], [0, 2, 2, 0]];
const res = FetchBall.accurate(a, target);
const monte = FetchBall.montecarlo(a, target, 2000);
console.log(`accurate ${res}
motecarlo ${monte}
atMost:${FetchBall.atMost(a, target)}
atLeast:${FetchBall.atLeast(a, target)}
`)
