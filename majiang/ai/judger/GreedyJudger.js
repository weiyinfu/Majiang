"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 启发式评判器，直接评价一个局面
 * */
const Judger_1 = require("../Judger");
const SearchHu_1 = require("../../hu/SearchHu");
const Score = {
    Single: -1,
    Pair: 3,
    Triple: 10,
    Shunzi: 10,
    HalfShunzi: 2,
};
//遍历手牌的全部划分方法，求分值最大的划分
function greedyJudgeCompact(pairs, ind) {
    /**
     * pairs是紧密排列的
     * */
    if (ind >= pairs.length)
        return 0;
    if (pairs[ind][1] === 0) {
        return greedyJudgeCompact(pairs, ind + 1);
    }
    let score = Judger_1.MIN_SCORE;
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
        && pairs[ind][0] + 2 == pairs[ind + 2][0]) {
        for (let i = 0; i < 3; i++)
            pairs[ind + i][1]--;
        let now = Score.Shunzi + greedyJudgeCompact(pairs, ind);
        for (let i = 0; i < 3; i++)
            pairs[ind + i][1]++;
        score = Math.max(now, score);
    }
    //如果是部分顺子
    if (ind + 1 < pairs.length
        && pairs[ind][1] > 0 && pairs[ind + 1][1] > 0
        && pairs[ind][0] + 1 == pairs[ind + 1][0]) {
        for (let i = 0; i < 2; i++)
            pairs[ind + i][1]--;
        let now = Score.HalfShunzi + greedyJudgeCompact(pairs, ind);
        for (let i = 0; i < 2; i++)
            pairs[ind + i][1]++;
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
exports.greedyJudgeCompact = greedyJudgeCompact;
class GreedyJudger {
    /**
     * 直接计算，不分区
     * 一件事物有多种解释方式，求最大可能的解释方式
     * */
    judge(state, hand) {
        const pairs = SearchHu_1.compactSparseIndexPairs(hand);
        const score = greedyJudgeCompact(pairs, 0);
        return {
            score, meta: {}
        };
    }
    getName() {
        return GreedyJudger.name;
    }
}
exports.GreedyJudger = GreedyJudger;
class PartGreedyJudger {
    /**
     * 一件事物有多种解释方式，求最大可能的解释方式
     * PartGreedyJudger速度比GreedyJudger速度快，并且两者结果相同
     * */
    judge(state, hand) {
        let parts = SearchHu_1.compactPartPairs(hand);
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
exports.PartGreedyJudger = PartGreedyJudger;
