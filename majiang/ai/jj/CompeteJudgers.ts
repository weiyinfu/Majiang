import {RandomJudger} from "../judger/RandomJudger";
import {GreedyJudger, PartGreedyJudger} from "../judger/GreedyJudger";
import {SearchJudger} from "../judger/SearchJudger";
import {playTogether} from "./JudgerJudger";
import {PartSumJudger} from "../judger/MyJudger";

const judgers = [
    // new RandomJudger(),
    // new GreedyJudger(),
    // new PartSumJudger(),
    new SearchJudger(new PartGreedyJudger(), 2, 3),
    new SearchJudger(new PartGreedyJudger(), 2, 1),
    new SearchJudger(new PartGreedyJudger(), 3, 2),
    new SearchJudger(new PartGreedyJudger(), 4, 2),
];
playTogether(judgers, 20);