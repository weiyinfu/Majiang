"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 全部胡牌表：理论上这种方法应该有最快的速度，但是实际上如果实现不好，这种方法反而会很慢。
 * */
const MyJudger_1 = require("../ai/judger/MyJudger");
const Utils_1 = require("../util/Utils");
const TableHu_1 = require("./TableHu");
const Card_1 = require("../core/Card");
function huPaiCount() {
    //胡牌时牌的张数到牌型数的映射
    const ma = {};
    const a = MyJudger_1.BIG;
    function go(ind, cardCount, prod) {
        if (cardCount > 14)
            return;
        if (ind === a.length) {
            if (cardCount % 3 !== 2)
                return;
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
    return ma;
}
exports.huPaiCount = huPaiCount;
function bisearch(x, a) {
    //二分法判断元素是否存在
    let l = 0, r = a.length;
    let mid = 0;
    while (l < r) {
        mid = (l + r) >> 1;
        if (a[mid] < x) {
            l = mid + 1;
        }
        else {
            r = mid;
        }
    }
    if (l >= a.length)
        return false;
    return a[l] == x;
}
exports.bisearch = bisearch;
class StringBigTableHu {
    constructor() {
        this.huSet = [];
        const beg = new Date();
        MyJudger_1.iteratePatterns(MyJudger_1.BIG, 14, ((cardCount, pattern) => {
            if (cardCount % 3 !== 2)
                return;
            const code = Utils_1.flat(pattern).join(',');
            this.huSet.push(code);
        }));
        console.log(`构建胡牌表${new Date().getTime() - beg.getTime()}`);
        this.huSet.sort();
    }
    hu(sortedCards) {
        const code = MyJudger_1.vectorize(sortedCards).join(',');
        return bisearch(code, this.huSet);
    }
}
exports.StringBigTableHu = StringBigTableHu;
class SetBigTableHu {
    constructor() {
        this.huSet = new Set();
        const beg = new Date();
        MyJudger_1.iteratePatterns(MyJudger_1.BIG, 14, ((cardCount, pattern) => {
            if (cardCount % 3 !== 2)
                return;
            const code = Utils_1.flat(pattern).join(',');
            this.huSet.add(code);
        }));
        console.log(`构建胡牌表用时${new Date().getTime() - beg.getTime()}`);
    }
    hu(sortedCards) {
        const code = MyJudger_1.vectorize(sortedCards).join(',');
        return this.huSet.has(code);
    }
}
exports.SetBigTableHu = SetBigTableHu;
class NumberBigTableHu {
    constructor() {
        this.huTable = new Set();
        const beg = new Date();
        MyJudger_1.iteratePatterns(MyJudger_1.BIG, 14, (cardCount, patterns) => {
            if (cardCount % 3 !== 2)
                return;
            const x = this.encodePattern(patterns);
            this.huTable.add(x.join(','));
        });
        console.log(`构建胡牌表完成，用时${new Date().getTime() - beg.getTime()}，元素个数${this.huTable.size}`);
    }
    encodePattern(pattern) {
        //把一个pattern映射成4个int，东西南北中发白为1个int，万桶条各1个int
        const code = Utils_1.li(4, 0);
        for (let i = 0; i < 7; i++) {
            code[0] += TableHu_1.Pow5[i] * pattern[i][0];
        }
        for (let i = 0; i < 3; i++) {
            for (let ordinal = 0; ordinal < 9; ordinal++) {
                code[i + 1] += TableHu_1.Pow5[ordinal] * pattern[i + 7][ordinal];
            }
        }
        return code;
    }
    encodeCards(cards) {
        const code = Utils_1.li(4, 0);
        for (let i = 0; i < cards.length; i++) {
            const c = Card_1.C.byName(cards[i]);
            if (c.part < 7) {
                code[0] += TableHu_1.Pow5[c.part];
            }
            else {
                code[c.part - 7 + 1] += TableHu_1.Pow5[c.ordinal];
            }
        }
        return code;
    }
    hu(sortedCards) {
        const code = this.encodeCards(sortedCards);
        return this.huTable.has(code.join(','));
    }
}
exports.NumberBigTableHu = NumberBigTableHu;
