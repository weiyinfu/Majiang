import {Judger, JudgeResult, State} from "../Judger";
import {PartGreedyJudger} from "./GreedyJudger";
import {SearchJudger} from "./SearchJudger";

/**
 * Ai总是调用这个文件
 * */
const judger = new SearchJudger(new PartGreedyJudger(), 3, 1);

export class BestJudger implements Judger {
    judge(state: State, hand: string[]): JudgeResult {
        return judger.judge(state, hand);
    }

    getName() {
        return BestJudger.name;
    }
}
