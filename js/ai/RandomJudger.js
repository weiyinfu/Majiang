"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
/**
 * 随机返回分数，用于比较,它是一个笑话。
 * */
const MAXN = 10000;
class RandomJudger {
    judge(state, hand) {
        if (hand.length % 3 !== 1)
            throw `手牌个数应该模三余一 ${hand.join(',')}`;
        return { score: Utils_1.randInt(0, MAXN), meta: {} };
    }
}
exports.RandomJudger = RandomJudger;
