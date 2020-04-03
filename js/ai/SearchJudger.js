"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Judger_1 = require("../Judger");
const Card_1 = require("../Card");
const MyJudger_1 = require("./MyJudger");
const Topk_1 = require("../Topk");
const Collections_1 = require("../Collections");
/**
 * 基于搜索的Judger
 *
 * 任何一个比较弱的judger都可以通过SearchJudger变强
 * */
exports.PRINT = {
    DEPTH_INFO: false,
};
function judge(hand, pile, jj, maxDepth) {
    function see() {
        return jj.judge({ a: pile.a, anGangCount: 0 }, MyJudger_1.stringify(hand.a)).score;
    }
    function go(depth) {
        if (exports.PRINT.DEPTH_INFO) {
            console.log(`depth=${depth} hand=${MyJudger_1.stringify(hand.a).join(',')} ${new Date()}`);
        }
        if (depth >= maxDepth) {
            return see();
        }
        if (hand.total % 3 == 2) {
            //如果胡牌了
            if (Card_1.hu(MyJudger_1.stringify(hand.a))) {
                return 1000;
            }
            //如果需要弃牌
            let maxScore = Judger_1.MIN_SCORE;
            const q = new Topk_1.Topk(3, Topk_1.compareKey(x => x[1])); //弃牌及分数
            //注意，此处new Set(hand.keys)相当于复制一份手牌，这样做的目的是防止在迭代对hand进行增删影响迭代
            new Set(hand.keys).forEach(h => {
                hand.remove(h);
                const score = see();
                hand.add(h);
                q.push([h, score]);
            });
            q.toList().forEach(([release, score]) => {
                hand.remove(release);
                const now = go(depth + 1);
                hand.add(release);
                maxScore = Math.max(now, maxScore);
            });
            return maxScore;
        }
        else if (hand.total % 3 == 1) {
            //需要摸牌
            let s = 0;
            const before = JSON.stringify(pile.a);
            new Set(pile.keys).forEach(i => {
                const p = pile.a[i] / pile.total; //摸到这种牌的概率
                pile.remove(i);
                hand.add(i);
                s += p * go(depth + 1);
                hand.remove(i);
                pile.add(i);
            });
            const after = JSON.stringify(pile.a);
            if (before !== after) {
                throw new Error('error');
            }
            return s;
        }
        else {
            throw new Error(`手牌数错误${hand.total}`);
        }
    }
    return go(0);
}
class SearchJudger {
    constructor(judger, maxDepth) {
        this.judger = judger;
        this.maxDepth = maxDepth;
    }
    judge(state, hand) {
        Card_1.sortCards(hand);
        const stateString = JSON.stringify(state);
        const hander = new Collections_1.HashMap(MyJudger_1.vectorize(hand));
        if (hander.total % 3 !== 1)
            throw new Error(`手牌个数应该模三余一 ${hand.join(',')}`);
        const score = judge(hander, new Collections_1.HashMap(state.a), this.judger, this.maxDepth);
        const nowHand = MyJudger_1.stringify(hander.a);
        for (let i = 0; i < hand.length; i++)
            if (hand[i] != nowHand[i])
                throw new Error(`前后不一致\nbefore:${hand.join(',')}\nafter:${nowHand.join(',')}`);
        const after = JSON.stringify(state);
        if (after !== stateString) {
            throw new Error(`error state changed`);
        }
        return {
            score, meta: {}
        };
    }
}
exports.SearchJudger = SearchJudger;
