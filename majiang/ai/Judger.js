"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 麻将局面评判器接口，麻将局面评判器是麻将AI的核心部件。
 * 本程序规定了麻将局面评判器的核心要素。
 * 输入State和手牌hand，输出对“手牌”的评分
 * */
class State {
    constructor() {
        /**
         * 牌局面，这个局面是AI能够看到的全部信息
         * a表示每种未曾出现过的牌的张数
         * 对于a中全部为4张牌的牌，因为暗杠的缘故，都要乘以概率
         * 未知的牌中各张牌的张数，包括一切未曾显现的牌，包括别人的手牌，牌堆中的牌，暗杠的牌
         * */
        this.a = [];
        this.anGangCount = 0; //除我以外其他用户暗杠的牌的个数
    }
}
exports.State = State;
//judger返回的最低分数
exports.MIN_SCORE = Number.MIN_SAFE_INTEGER;
class JudgeResult {
    constructor() {
        //不同judger可以返回不同的meta信息，score越高代表局面越好
        this.score = 0;
        this.meta = null;
    }
}
exports.JudgeResult = JudgeResult;
