/**
 * 启发式评判器，直接评价一个局面
 * */
import {Judger, JudgeResult, MIN_SCORE, State} from "../Judger";
import {compactPartPairs, compactSparseIndexPairs} from "../../hu/SearchHu";

const Score = {
    Single: -1,//单子的个数
    Pair: 3,//对子的个数
    Triple: 10,//刻子的个数
    Shunzi: 10,//顺子的个数
    HalfShunzi: 2,//半个顺子的个数
}

//遍历手牌的全部划分方法，求分值最大的划分
export function greedyJudgeCompact(pairs: [number, number][], ind: number): number {
    /**
     * pairs是紧密排列的
     * */
    if (ind >= pairs.length) return 0;
    if (pairs[ind][1] === 0) {
        return greedyJudgeCompact(pairs, ind + 1);
    }
    let score = MIN_SCORE;
    //如果开头为对子，并且没有将
    if (pairs[ind][1] >= 2) {
        pairs[ind][1] -= 2;
        const now = Score.Pair + greedyJudgeCompact(pairs, ind);
        pairs[ind][1] += 2;
        score = Math.max(now, score);
    }
    //如果是刻子
    if (pairs[ind][1] >= 3) {
        pairs[ind][1] -= 3;
        let now = Score.Triple + greedyJudgeCompact(pairs, ind);
        pairs[ind][1] += 3;
        score = Math.max(now, score);
    }
    //如果是顺子
    if (ind + 2 < pairs.length
        && pairs[ind][1] > 0 && pairs[ind + 1][1] > 0 && pairs[ind + 2][1] > 0
        && pairs[ind][0] + 1 == pairs[ind + 1][0]
        && pairs[ind][0] + 2 == pairs[ind + 2][0]
    ) {
        for (let i = 0; i < 3; i++) pairs[ind + i][1]--;
        let now = Score.Shunzi + greedyJudgeCompact(pairs, ind);
        for (let i = 0; i < 3; i++) pairs[ind + i][1]++;
        score = Math.max(now, score);
    }
    //如果是部分顺子
    if (ind + 1 < pairs.length
        && pairs[ind][1] > 0 && pairs[ind + 1][1] > 0
        && pairs[ind][0] + 1 == pairs[ind + 1][0]
    ) {
        for (let i = 0; i < 2; i++) pairs[ind + i][1]--;
        let now = Score.HalfShunzi + greedyJudgeCompact(pairs, ind);
        for (let i = 0; i < 2; i++) pairs[ind + i][1]++;
        score = Math.max(now, score);
    }
    //如果是单子
    if (pairs[ind][1] == 1) {
        pairs[ind][1]--;
        let now = Score.Single + greedyJudgeCompact(pairs, ind);
        pairs[ind][1]++;
        score = Math.max(now, score);
    }
    return score;
}

export class GreedyJudger implements Judger {
    /**
     * 直接计算，不分区
     * 一件事物有多种解释方式，求最大可能的解释方式
     * */
    judge(state: State, hand: string[]): JudgeResult {
        const pairs = compactSparseIndexPairs(hand);
        const score = greedyJudgeCompact(pairs, 0);
        return {
            score, meta: {}
        };
    }

    getName() {
        return GreedyJudger.name;
    }
}

export class PartGreedyJudger implements Judger {
    /**
     * 一件事物有多种解释方式，求最大可能的解释方式
     * PartGreedyJudger速度比GreedyJudger速度快，并且两者结果相同
     * */
    judge(state: State, hand: string[]): JudgeResult {
        let parts = compactPartPairs(hand);
        let s = 0;
        for (let i = 0; i < parts.length; i++) {
            s += greedyJudgeCompact(parts[i], 0);
        }
        return {
            score: s, meta: {}
        };
    }

    getName() {
        return PartGreedyJudger.name;
    }
}

