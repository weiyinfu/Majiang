/**
 * 计算胡牌局面的个数
 * */
import {BIG, iteratePatterns} from "../ai/judger/MyJudger";
import {huPaiCount} from "./BigTableHu";

function bruteforceIterate() {
    //遍历全部胡牌局面,需要70s
    let total = 0
    const begTime = new Date().getTime()
    iteratePatterns(BIG, 14,
        ((cardCount, pattern) => {
            if (cardCount % 3 !== 2) return;
            total++;
            if (total % 1000000 === 0) {
                console.log(total)
            }
        }));
    const endTime = new Date().getTime()
    console.log(`遍历全部胡牌局面的用时${endTime - begTime},遍历到的局面总数${total}`)
}

const ma = huPaiCount()
let s = 0
for (let i in ma) {
    s += ma[i]
}
console.log(`胡牌局面个数${s}：`)
console.log(ma)
bruteforceIterate()