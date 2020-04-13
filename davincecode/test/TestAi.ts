/**
 * 测试AI的正确性
 * AI必须迭代才能求出最佳结果
 * */
import {getCards, isUnknown} from "../Card";
import {remove} from "../../majiang/util/Utils";
import {SimpleSolver} from "../solver/SimpleSolver";

const hand = [
    '黑1,黑2,黑未知,黑6'.split(','),//此处黑未知为黑4或者黑5
    '黑3,黑未知,白4'.split(','),//此处黑未知必为黑4
]
const pile = getCards();
remove(pile, hand[0].filter(x => !isUnknown(x)));
remove(pile, hand[1].filter(x => !isUnknown(x)));
remove(pile, ['黑4', '黑5'])
hand.push(pile);
console.log(hand)
const simple = new SimpleSolver();
const advice = simple.getAdvice(hand, [])
console.log(0, 2, advice[0][2]);
console.log(1, 1, advice[1][1]);