"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Card_1 = require("../Card");
const Utils_1 = require("../../majiang/util/Utils");
/***
 * AI算法的核心就是利用：现在信息+历史上叫错牌的信息，推断未知牌
 * */
function isBadCall(badCalls, who, which, ordinal) {
    //检查badCall列表里面是否包含某个断言
    for (let call of badCalls) {
        if (call.who === who && call.which === which && call.what === Card_1.C.byOrdinal(ordinal).name) {
            return true;
        }
    }
    return false;
}
function getOptions(hand, shown, who, which, badCalls) {
    /**
     * 只考虑一行的情况下给出推荐答案来
     * 获取who,which处元素可取值
     * */
    const h = hand[who];
    if (!Card_1.isUnknown(h[which])) {
        return [Card_1.C.byName(h[which]).ordinal];
    }
    //首先寻找上界和下界
    let up = which;
    while (up < h.length && Card_1.isUnknown(h[up]))
        up++;
    let down = which;
    while (down >= 0 && Card_1.isUnknown(h[down]))
        down--;
    //一切都是闭区间，让down，downValue和up，upValue都变成闭区间
    let downValue = down >= 0 ? Card_1.C.byName(h[down]).ordinal + 1 : 0;
    let upValue = up < h.length ? Card_1.C.byName(h[up]).ordinal - 1 : Card_1.MAX_ORDINAL;
    down++;
    up--;
    //根据颜色进一步调整downValue和upValue，down处的颜色与downValue应该匹配，up处的颜色与upValue应该匹配
    if ((Card_1.C.byName(h[up]).ordinal & 1) !== (upValue & 1))
        upValue--;
    if ((Card_1.C.byName(h[down]).ordinal & 1) !== (downValue & 1))
        downValue++;
    //现在down处对应downValue，up处对应upValue，进一步收紧范围
    while (shown.has(upValue) || isBadCall(badCalls, who, up, upValue)) {
        upValue -= 2;
    }
    while (up > which) {
        const now = Card_1.C.byName(h[up]).ordinal & 1;
        const next = Card_1.C.byName(h[up - 1]).ordinal & 1;
        if (now === next) {
            //如果奇偶性相同，则减2
            upValue -= 2;
        }
        else {
            //如果奇偶性不同，则减1
            upValue--;
        }
        while (shown.has(upValue) || isBadCall(badCalls, who, up, upValue)) {
            upValue -= 2;
        }
        up--;
    }
    while (shown.has(downValue) || isBadCall(badCalls, who, down, downValue)) {
        downValue += 2;
    }
    while (down < which) {
        const now = Card_1.C.byName(h[down]).ordinal & 1;
        const next = Card_1.C.byName(h[down + 1]).ordinal & 1;
        if (now === next) {
            //如果奇偶性相同，则加2
            downValue += 2;
        }
        else {
            //如果奇偶性不同，则加1
            downValue += 1;
        }
        while (shown.has(downValue) || isBadCall(badCalls, who, down, downValue)) {
            downValue += 2;
        }
        down++;
    }
    const available = [];
    const nowCard = Card_1.C.byName(h[which]).ordinal & 1;
    for (let i = downValue; i <= upValue; i++) {
        if (!shown.has(i) && !isBadCall(badCalls, who, which, i)) {
            if (nowCard === (i & 1)) { //如果当前牌与which牌颜色相同
                available.push(i);
            }
        }
    }
    if (available.length === 0)
        throw new Error(`cannot find available`);
    return available;
}
exports.getOptions = getOptions;
function getShown(hand) {
    const shown = new Set();
    for (let i = 0; i < hand.length; i++) {
        for (let j = 0; j < hand[i].length; j++) {
            if (!Card_1.isUnknown(hand[i][j])) {
                if (!Card_1.C.byName(hand[i][j]))
                    throw new Error(`cannot find ${hand[i][j]}`);
                shown.add(Card_1.C.byName(hand[i][j]).ordinal);
            }
        }
    }
    return shown;
}
class SimpleSolver {
    getAdvice(hand, badCalls) {
        /**
         * 获取浅层次建议
         * 考虑全局多次迭代直到不再改变为止，无法解决如下情况：
         * 三个option分别为
         * [1,2],[1,2],[1,2,3]
         * 显然这种情况可以优化为：[1,2],[1,2],[3]
         * */
        const h = Utils_1.deepcopy(hand);
        const shown = getShown(hand);
        const ans = Utils_1.ll(hand.length);
        while (1) {
            let updated = false;
            for (let i = 0; i < h.length; i++) {
                for (let j = 0; j < h[i].length; j++) {
                    if (Card_1.isUnknown(h[i][j])) {
                        const ops = getOptions(h, shown, i, j, badCalls);
                        if (ops.length === 1) {
                            updated = true;
                            const card = Card_1.C.byOrdinal(ops[0]);
                            if (!card)
                                throw new Error(`cannot find ${ops[0]}`);
                            shown.add(card.ordinal);
                            h[i][j] = card.name;
                        }
                        if (ops.length === 0)
                            throw new Error(`(${i},${j})不可能为空`);
                        ans[i][j] = ops.map(x => Card_1.C.byOrdinal(x).name);
                    }
                    else {
                        ans[i][j] = [h[i][j]];
                    }
                }
            }
            if (!updated) {
                break;
            }
        }
        return ans;
    }
}
exports.SimpleSolver = SimpleSolver;
