import {Judger, JudgeResult, State} from "../Judger";
import {randInt} from "../Utils";

/**
 * 随机返回分数，用于比较,它是一个笑话。
 * */
const MAXN = 10000;

export class RandomJudger implements Judger {
    judge(state: State, hand: string[]): JudgeResult {
        if (hand.length % 3 !== 1) throw `手牌个数应该模三余一 ${hand.join(',')}`;
        return {score: randInt(0, MAXN), meta: {}};
    }
}