import {Judger, JudgeResult, State} from "../Judger";
import {sortCards} from "../../core/Card";

/**
 * 事他娘judger，执行各种校验。
 * 正常的judger在执行前后应该不改变State
 * */
export class TrivalJudger implements Judger {
    judger: Judger;

    constructor(judger: Judger) {
        this.judger = judger;
    }

    judge(state: State, hand: string[]): JudgeResult {
        if (hand.length % 3 !== 1) throw new Error(`手牌个数应该模三余一 ${hand.join(',')}`);
        sortCards(hand);
        const before = JSON.stringify([state, hand]);
        const res = this.judger.judge(state, hand);
        sortCards(hand);
        const after = JSON.stringify([state, hand]);
        if (before !== after) throw new Error(`Greedy Judger前后State不一样`);
        return res;
    }

    getName(): string {
        return TrivalJudger.name;
    }

}