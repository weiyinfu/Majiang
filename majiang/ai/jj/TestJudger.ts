import {SearchJudger} from "../judger/SearchJudger";
import {GreedyJudger} from "../judger/GreedyJudger";
import {generateProblems, judgeJudger, PRINT} from "./JudgerJudger";
import {PartSumJudger} from "../judger/MyJudger";
import {ConstantJudger, ExtremeJudger, RandomJudger} from "../judger/RandomJudger";

// const jj = new SearchJudger(new GreedyJudger(), 2, 2);
// const jj = new GreedyJudger();
let jj = new PartSumJudger();
// jj = new ConstantJudger();
jj = new ExtremeJudger(true);
// const jj = new RandomJudger();

const res = judgeJudger(jj, generateProblems(1), 13);
console.log(`期望摸牌次数${res}`)
