"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 暴力计算胡牌局面的个数
 * */
const MyJudger_1 = require("./ai/MyJudger");
function huPaiCount() {
    //胡牌时牌的张数到牌型数的映射
    const ma = {};
    const a = MyJudger_1.BIG;
    function go(ind, cardCount, prod) {
        if (cardCount > 14)
            return;
        if (ind === a.length) {
            if (!ma[cardCount])
                ma[cardCount] = 0;
            ma[cardCount] += prod;
            return;
        }
        a[ind].forEach((v, k) => {
            //如果已经有了将，那么不能再有将了
            if (cardCount % 3 == 2) {
                if (k % 3 == 2)
                    return;
            }
            go(ind + 1, cardCount + k, prod * v.length);
        });
    }
    go(0, 0, 1);
    let s = 0;
    for (let i in ma) {
        s += ma[i];
    }
    console.log(`胡牌局面个数${s}：`);
    console.log(ma);
    return ma;
}
function bruteforceIterate() {
    //遍历全部胡牌局面,需要160s
    let total = 0;
    const begTime = new Date().getTime();
    const a = MyJudger_1.BIG;
    MyJudger_1.iteratePatterns(a, 14, ((cardCount, pattern) => {
        total++;
        if (total % 1000000 === 0) {
            console.log(total);
        }
    }));
    const endTime = new Date().getTime();
    console.log(`遍历全部胡牌局面的用时${endTime - begTime},遍历到的局面总数${total}`);
}
huPaiCount();
bruteforceIterate();
