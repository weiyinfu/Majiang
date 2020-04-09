"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Judger_1 = require("../Judger");
const MyJudger_1 = require("./MyJudger");
const Topk_1 = require("../../util/Topk");
const Collections_1 = require("../../util/Collections");
const BestHu_1 = require("../../hu/BestHu");
/**
 * 基于搜索的Judger
 *
 * 任何一个比较弱的judger都可以通过SearchJudger变强
 * 可以断言，搜索深度越大，搜索广度越大，效果越好。
 * 当搜索深度和搜索广度达到最大值时，这就是无敌版AI。
 * */
function judge(hand, pile, jj, maxDepth, releaseSplit) {
    function see() {
        //此处为了写法的美观简洁，对hand.a反复进行序列化有点浪费时间
        return jj.judge({ a: pile.a, anGangCount: 0 }, MyJudger_1.stringify(hand.a)).score;
    }
    function go(depth) {
        /**
         * go函数根据手牌决定操作，当手牌数模3余2时，需要弃牌
         * 当手牌数模3余1时，需要摸牌。
         * */
        if (depth >= maxDepth) {
            return see();
        }
        if (hand.total % 3 == 2) {
            //如果胡牌了，那就不需要再弃牌了
            if (BestHu_1.BestHu.hu(MyJudger_1.stringify(hand.a))) {
                return see();
            }
            //如果需要弃牌
            let maxScore = Judger_1.MIN_SCORE;
            const q = new Topk_1.Topk(releaseSplit, Topk_1.compareKey(x => x[1])); //弃牌及分数
            //注意，此处new Set(hand.keys)相当于复制一份手牌，这样做的目的是防止在迭代对hand进行增删影响迭代
            const handSet = new Set(hand.keys).values();
            while (1) {
                const res = handSet.next();
                if (res.done)
                    break;
                const release = res.value;
                hand.remove(release);
                const score = see();
                hand.add(release);
                q.push([release, score]);
            }
            const goodRelease = q.toList();
            for (let i = 0; i < goodRelease.length; i++) {
                const release = goodRelease[i][0];
                hand.remove(release);
                const now = go(depth + 1);
                hand.add(release);
                maxScore = Math.max(now, maxScore);
            }
            return maxScore;
        }
        else if (hand.total % 3 == 1) {
            let s = 0;
            const pileSet = new Set(pile.keys).values();
            while (1) {
                const res = pileSet.next();
                if (res.done)
                    break;
                const i = res.value;
                const p = pile.a[i] / pile.total; //摸到这种牌的概率
                pile.remove(i);
                hand.add(i);
                s += p * go(depth + 1);
                hand.remove(i);
                pile.add(i);
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
    constructor(judger, maxDepth, releaseSplit) {
        this.judger = judger;
        this.maxDepth = maxDepth;
        this.releaseSplit = releaseSplit;
    }
    judge(state, hand) {
        const handSet = new Collections_1.HashMap(MyJudger_1.vectorize(hand));
        const score = judge(handSet, new Collections_1.HashMap(state.a), this.judger, this.maxDepth, this.releaseSplit);
        return { score, meta: {} };
    }
    getName() {
        return `${SearchJudger.name}(depth=${this.maxDepth},width=${this.releaseSplit})`;
    }
}
exports.SearchJudger = SearchJudger;
