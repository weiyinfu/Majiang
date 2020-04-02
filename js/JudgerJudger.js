"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Judger评判器，评价一个Judger的好坏，用于迭代麻将judge算法
 *
 * 把初始牌放在judger手中，重复调用摸牌+弃牌过程直到胡牌，期望胡牌步数越少，judger越强
 * */
const Judger_1 = require("./Judger");
const Card_1 = require("./Card");
const Utils_1 = require("./Utils");
const MyJudger_1 = require("./ai/MyJudger");
const PRINT = {
    SHOW_PROCESS: true,
};
function judgeJudger(judger, caseCount) {
    //对judger执行caseCount次评估，计算平均需要多少步才能结束游戏
    const times = Utils_1.li(136, 0); //游戏最多进行136步
    for (let cas = 0; cas < caseCount; cas++) {
        const pile = Card_1.getCards();
        Utils_1.shuffle(pile);
        const hand = pile.splice(0, 13);
        Card_1.sortCards(hand);
        let fetchCount = 0;
        while (pile.length) {
            //一直摸牌，直到牌堆中没牌或者胡牌为止
            if (PRINT.SHOW_PROCESS)
                console.log(hand.length, pile.length, hand.join(','));
            const card = pile.pop();
            hand.push(card);
            Card_1.sortCards(hand);
            fetchCount++;
            if (Card_1.hu(hand)) {
                if (PRINT.SHOW_PROCESS)
                    console.log(`摸到:${card},胡牌了`);
                break;
            }
            const state = {
                a: MyJudger_1.vectorize(pile),
                anGangCount: 0
            };
            let best = {
                score: Judger_1.MIN_SCORE,
                release: '',
            };
            new Set(hand).forEach(h => {
                const myHand = hand.slice();
                Utils_1.remove(myHand, [h]);
                const result = judger.judge(state, myHand);
                if (result.score > best.score) {
                    best.score = result.score;
                    best.release = h;
                }
            });
            if (PRINT.SHOW_PROCESS)
                console.log(`摸到:${card} 弃牌:${best.release}`);
            Utils_1.remove(hand, [best.release]);
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
const myJudger = new MyJudger_1.MyJudger();
const res = judgeJudger(myJudger, 5);
console.log(res);
