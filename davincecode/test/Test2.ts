/**
 * 测试AI的正确性
 * AI必须迭代才能求出最佳结果
 * */
import {getOptions, SimpleSolver} from "../solver/SimpleSolver";
import {DeepSolver} from "../solver/DeepSolver";
import {C} from "../Card";

const hand = [
    '黑未知,黑3'.split(','),//此处黑未知为黑1或者黑2
    '黑未知,黑4'.split(','),//此处黑未知为黑1或者黑2
    '黑未知,黑6'.split(','),//此处黑未知必为黑5
]
// const pile = getCards();
// remove(pile, hand[0].filter(x => !isUnknown(x)));
// remove(pile, hand[1].filter(x => !isUnknown(x)));
// hand.push(pile);
console.log(hand)
// const advice = getAdvice(hand, [])
// console.log(advice);
console.log(getOptions(hand, new Set(), 0, 1, []))
for (let i = 0; i < 3; i++) {
    console.log(i)
    console.log(getOptions(hand, new Set(), i, 0, []).map(x => C.byOrdinal(x).name))
}
const simple = new SimpleSolver();
console.log(`=======advice====`)
console.log(simple.getAdvice(hand, []));
const deep = new DeepSolver();
console.log(deep.getAdvice(hand, []));