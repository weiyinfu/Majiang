import {ExtremeJudger} from "../judger/RandomJudger";
import {GreedyJudger, PartGreedyJudger} from "../judger/GreedyJudger";
import {playSelf, PRINT} from "./JudgerJudger";
import {PartSumJudger} from "../judger/MyJudger";
import {init} from "../../util/Utils";
import {SearchJudger} from "../judger/SearchJudger";

const judgerList = [
    // new RandomJudger(),
    // new ConstantJudger(),
    new ExtremeJudger(false),
    new ExtremeJudger(true),
    new GreedyJudger(),
    // new PartGreedyJudger(),
    new PartSumJudger(),
    // new MyJudger(),
    new SearchJudger(new PartGreedyJudger(), 2, 1),
    new SearchJudger(new PartGreedyJudger(), 4, 1),
    new SearchJudger(new PartGreedyJudger(), 3, 1),
    new SearchJudger(new PartGreedyJudger(), 2, 3),
    // new SearchJudger(new PartSumJudger(), 4, 2),
];
// PRINT.SHOW_RELEASE = true;
PRINT.SHOW_PROCESS = false;
init(new Date().toString())
const res = playSelf(judgerList, 10);
console.log(res)