"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../util/Utils");
const Card_1 = require("../../core/Card");
/**
 * 随机返回分数，用于比较,它是一个笑话。
 * */
class RandomJudger {
    /**
     * RandomJudger会对局面进行随机评价，它永远都赢不了
     * */
    judge(state, hand) {
        if (hand.length % 3 !== 1)
            throw `手牌个数应该模三余一 ${hand.join(',')}`;
        return { score: Utils_1.random(), meta: {} };
    }
    getName() {
        return RandomJudger.name;
    }
}
exports.RandomJudger = RandomJudger;
class ConstantJudger {
    /**
     * ConstantJudger总是返回一个固定值，这样所有局面它都一视同仁，因为外层会对牌进行排序，
     * 所以弃牌时，总是弃掉最小的那张牌。这就使得它有一定的胜率，比RandomJudger强些，但是
     * 它依赖外部程序的排序行为。它的改进版为下面ExtremeJudger。
     * */
    judge(state, hand) {
        if (hand.length % 3 !== 1)
            throw `手牌个数应该模三余一 ${hand.join(',')}`;
        return { score: 0, meta: {} };
    }
    getName() {
        return ConstantJudger.name;
    }
}
exports.ConstantJudger = ConstantJudger;
class ExtremeJudger {
    constructor(maxBetter) {
        this.maxBetter = maxBetter;
    }
    judge(state, hand) {
        if (hand.length % 3 !== 1)
            throw `手牌个数应该模三余一 ${hand.join(',')}`;
        const cards = hand.slice();
        Card_1.sortCards(cards);
        let score;
        if (this.maxBetter) {
            score = Card_1.C.byName(cards[0]).index;
        }
        else {
            score = -Card_1.C.byName(cards[cards.length - 1]).index;
        }
        return { score, meta: {} };
    }
    getName() {
        return `${ExtremeJudger.name}(${this.maxBetter ? '留大' : '留小'})`;
    }
}
exports.ExtremeJudger = ExtremeJudger;
