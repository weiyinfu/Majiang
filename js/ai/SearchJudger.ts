import {Judger, JudgeResult, MIN_SCORE, State} from "../Judger";
import {hu, sortCards} from "../Card";
import {stringify, vectorize} from "./MyJudger";
import {compareKey, Topk} from "../Topk";
import {HashMap} from "../Collections";

/**
 * 基于搜索的Judger
 *
 * 任何一个比较弱的judger都可以通过SearchJudger变强
 * */

export const PRINT = {
    DEPTH_INFO: false,
}

function judge(hand: HashMap, pile: HashMap, jj: Judger, maxDepth: number): number {
    function see() {
        return jj.judge({a: pile.a, anGangCount: 0}, stringify(hand.a)).score;
    }

    function go(depth: number): number {
        if (PRINT.DEPTH_INFO) {
            console.log(`depth=${depth} hand=${stringify(hand.a).join(',')} ${new Date()}`)
        }
        if (depth >= maxDepth) {
            return see();
        }
        if (hand.total % 3 == 2) {
            //如果胡牌了
            if (hu(stringify(hand.a))) {
                return 1000;
            }
            //如果需要弃牌
            let maxScore = MIN_SCORE;
            const q = new Topk<[number, number]>(3, compareKey(x => x[1]));//弃牌及分数
            //注意，此处new Set(hand.keys)相当于复制一份手牌，这样做的目的是防止在迭代对hand进行增删影响迭代
            new Set(hand.keys).forEach(h => {
                hand.remove(h);
                const score = see();
                hand.add(h);
                q.push([h, score])
            });
            q.toList().forEach(([release, score]) => {
                hand.remove(release);
                const now = go(depth + 1);
                hand.add(release);
                maxScore = Math.max(now, maxScore);
            })
            return maxScore;
        } else if (hand.total % 3 == 1) {
            //需要摸牌
            let s = 0;
            const before = JSON.stringify(pile.a);
            new Set(pile.keys).forEach(i => {
                const p = pile.a[i] / pile.total;//摸到这种牌的概率
                pile.remove(i);
                hand.add(i);
                s += p * go(depth + 1);
                hand.remove(i);
                pile.add(i);
            })
            const after = JSON.stringify(pile.a);
            if (before !== after) {
                throw new Error('error');
            }
            return s;
        } else {
            throw new Error(`手牌数错误${hand.total}`);
        }
    }

    return go(0);
}

export class SearchJudger implements Judger {
    judger: Judger;
    maxDepth: number;

    constructor(judger: Judger, maxDepth: number) {
        this.judger = judger;
        this.maxDepth = maxDepth;
    }

    judge(state: State, hand: string[]): JudgeResult {
        sortCards(hand);
        const before = JSON.stringify([state, hand]);
        const hander = new HashMap(vectorize(hand));
        if (hander.total % 3 !== 1) throw new Error(`手牌个数应该模三余一 ${hand.join(',')}`);
        const score = judge(hander, new HashMap(state.a), this.judger, this.maxDepth);
        const after = JSON.stringify([state, stringify(hander.a)])
        if (after !== before) throw new Error(`前后不一致\nbefore:${before}\nafter:${after}`);
        return {score, meta: {}};
    }
}