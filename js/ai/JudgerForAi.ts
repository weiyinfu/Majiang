import {Judger, JudgeResult, State} from "../Judger";
import {GreedyJudger} from "./GreedyJudger";
import {SearchJudger} from "./SearchJudger";

/**
 * Ai总是调用这个文件
 * */
const judger = new SearchJudger(new GreedyJudger(), 2);

export class JudgerForAi implements Judger {
    judge(state: State, hand: string[]): JudgeResult {
        return judger.judge(state, hand);
    }
}
