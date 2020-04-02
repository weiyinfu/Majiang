/**
 * Judger评判器，评价一个Judger的好坏，用于迭代麻将judge算法
 *
 * 把初始牌放在judger手中，重复调用摸牌+弃牌过程直到胡牌，期望胡牌步数越少，judger越强
 * */
import {Judger, MIN_SCORE, State} from "./Judger";
import {getCards, hu, sortCards} from "./Card";
import {li, remove, shuffle} from "./Utils";
import {MyJudger, vectorize} from "./ai/MyJudger";

const PRINT = {
    SHOW_PROCESS: true,//显示打牌过程
}

function judgeJudger(judger: Judger, caseCount: number) {
    //对judger执行caseCount次评估，计算平均需要多少步才能结束游戏
    const times = li(136, 0);//游戏最多进行136步
    for (let cas = 0; cas < caseCount; cas++) {
        const pile = getCards();
        shuffle(pile);
        const hand = pile.splice(0, 13);
        sortCards(hand);
        let fetchCount = 0;
        while (pile.length) {
            //一直摸牌，直到牌堆中没牌或者胡牌为止
            if (PRINT.SHOW_PROCESS)
                console.log(hand.length, pile.length, hand.join(','))
            const card = <string>pile.pop();
            hand.push(card);
            sortCards(hand);
            fetchCount++;
            if (hu(hand)) {
                if (PRINT.SHOW_PROCESS) console.log(`摸到:${card},胡牌了`);
                break;
            }
            const state: State = {
                a: vectorize(pile),
                anGangCount: 0
            }
            let best = {
                score: MIN_SCORE,
                release: '',
            }
            new Set(hand).forEach(h => {
                const myHand = hand.slice();
                remove(myHand, [h]);
                const result = judger.judge(state, myHand);
                if (result.score > best.score) {
                    best.score = result.score;
                    best.release = h;
                }
            });
            if (PRINT.SHOW_PROCESS)
                console.log(`摸到:${card} 弃牌:${best.release}`);
            remove(hand, [best.release]);
        }
        times[fetchCount]++;
        console.log(`第${cas}次实验，摸了${fetchCount}次游戏结束\n==============`);
    }
    //计算期望步数
    let s = 0;
    for (let i = 0; i < times.length; i++) {
        s += times[i] / caseCount * i;
    }
    return s;
}

const myJudger = new MyJudger();
const res = judgeJudger(myJudger, 5);
console.log(res)