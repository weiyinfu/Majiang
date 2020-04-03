/**
 * 贪心评判器，直接评价一个局面
 * */
import {Judger, JudgeResult, MIN_SCORE, State} from "../Judger";
import {CardMap, sortCards} from "../Card";

const Score = {
    PAIR: 3,//对子的个数
    Shunzi: 10,//顺子的个数
    Kezi: 10,//刻子的个数
    halfShunzi: 2,//半个顺子的个数
    danzi: -1,//单子的个数
}

function toCardCount(sortedCards: string[]): [number, number][] {
    //把有序数组转换成一个[number,number]元祖列表，第一个元素表示sparseIndex，第二个元素表示个数
    let pairs: [number, number][] = [];
    for (let i = 0; i < sortedCards.length;) {
        let j = i + 1;
        for (; j < sortedCards.length; j++) {
            if (sortedCards[j] !== sortedCards[i]) {
                break
            }
        }
        pairs.push([CardMap[sortedCards[i]].sparseIndex, j - i]);
        i = j
    }
    return pairs
}

function getScore(sortedCards: string[]): number {
    //遍历手牌的全部划分方法，求分值最大的划分
    function go(pairs: [number, number][], ind: number): number {
        if (ind >= pairs.length) return 0;
        if (pairs[ind][1] === 0) {
            return go(pairs, ind + 1);
        }
        let score = MIN_SCORE;
        //如果开头为对子，并且没有将
        if (pairs[ind][1] >= 2) {
            pairs[ind][1] -= 2;
            const now = Score.PAIR + go(pairs, ind);
            pairs[ind][1] += 2;
            score = Math.max(now, score);
        }
        //如果是刻子
        if (pairs[ind][1] >= 3) {
            pairs[ind][1] -= 3;
            let now = Score.Kezi + go(pairs, ind);
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
            let now = Score.Shunzi + go(pairs, ind);
            for (let i = 0; i < 3; i++) pairs[ind + i][1]++;
            score = Math.max(now, score);
        }
        //如果是部分顺子
        //如果是顺子
        if (ind + 1 < pairs.length
            && pairs[ind][1] > 0 && pairs[ind + 1][1] > 0
            && pairs[ind][0] + 1 == pairs[ind + 1][0]
        ) {
            for (let i = 0; i < 2; i++) pairs[ind + i][1]--;
            let now = Score.halfShunzi + go(pairs, ind);
            for (let i = 0; i < 2; i++) pairs[ind + i][1]++;
            score = Math.max(now, score);
        }
        //如果是单子
        if (pairs[ind][1] == 1) {
            pairs[ind][1]--;
            let now = Score.danzi + go(pairs, ind);
            pairs[ind][1]++;
            score = Math.max(now, score);
        }
        return score;
    }

    let pairs = toCardCount(sortedCards);
    return go(pairs, 0)
}

export class GreedyJudger implements Judger {
    /**
     * 一件事物有多种解释方式，求最大可能的解释方式
     * */
    judge(state: State, hand: string[]): JudgeResult {
        sortCards(hand);
        const bak = JSON.stringify(state);
        const safe = hand.slice();
        const score = getScore(hand);
        sortCards(hand);
        for (let i = 0; i < hand.length; i++) if (hand[i] != safe[i]) throw `前后不一致\nbefore:${safe.join(',')}\nafter:${hand.join(',')}`;
        const after = JSON.stringify(state);
        if (bak !== after) throw new Error(`Greedy Judger前后State不一样`);
        return {
            score, meta: {}
        };
    }
}