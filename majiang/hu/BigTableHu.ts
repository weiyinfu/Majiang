/**
 * 全部胡牌表：理论上这种方法应该有最快的速度，但是实际上如果实现不好，这种方法反而会很慢。
 * */
import {BIG, iteratePatterns, stringify, vectorize} from "../ai/judger/MyJudger";
import {Hu} from "../core/Hu";
import {flat, li} from "../util/Utils";
import {Pow5} from "./TableHu";
import {C} from "../core/Card";

export function huPaiCount() {
    //胡牌时牌的张数到牌型数的映射
    const ma: { [index: number]: number } = {}
    const a = BIG;

    function go(ind: number, cardCount: number, prod: number) {
        if (cardCount > 14) return;
        if (ind === a.length) {
            if (cardCount % 3 !== 2) return;
            if (!ma[cardCount]) ma[cardCount] = 0
            ma[cardCount] += prod
            return;
        }
        a[ind].forEach((v, k) => {
            //如果已经有了将，那么不能再有将了
            if (cardCount % 3 == 2) {
                if (k % 3 == 2) return;
            }
            go(ind + 1, cardCount + k, prod * v.length)
        })
    }

    go(0, 0, 1);
    return ma
}


export function bisearch<T>(x: T, a: T[]): boolean {
    //二分法判断元素是否存在
    let l = 0, r = a.length
    let mid = 0
    while (l < r) {
        mid = (l + r) >> 1;
        if (a[mid] < x) {
            l = mid + 1;
        } else {
            r = mid;
        }
    }
    if (l >= a.length) return false;
    return a[l] == x
}

export class StringBigTableHu implements Hu {
    /**
     * 把每个胡牌局面转成字符串直接拼接起来，使用数组二分查找的方式判断元素存在性
     * 基于字符串的TableHu，非常缓慢
     * */
    huSet: string[];

    constructor() {
        this.huSet = [];
        const beg = new Date()
        iteratePatterns(BIG, 14, ((cardCount, pattern) => {
            if (cardCount % 3 !== 2) return;
            const code = flat(pattern).join(',');
            this.huSet.push(code);
        }))
        console.log(`构建胡牌表${new Date().getTime() - beg.getTime()}`)
        this.huSet.sort()
    }

    hu(sortedCards: string[]): boolean {
        const code = vectorize(sortedCards).join(',')
        return bisearch(code, this.huSet);
    }

}

export class SetBigTableHu implements Hu {
    //基于字符串的TableHu，非常缓慢
    huSet: Set<string>;

    constructor() {
        this.huSet = new Set<string>();
        const beg = new Date()
        iteratePatterns(BIG, 14, ((cardCount, pattern) => {
            if (cardCount % 3 !== 2) return;
            const code = flat(pattern).join(',');
            this.huSet.add(code);
        }))
        console.log(`构建胡牌表用时${new Date().getTime() - beg.getTime()}`)
    }

    hu(sortedCards: string[]): boolean {
        const code = vectorize(sortedCards).join(',')
        return this.huSet.has(code);
    }
}

export class NumberBigTableHu implements Hu {
    /**
     * 把东西南北中发白，万，筒，条各作为一个int，拼接起来形成字符串
     * */
    huTable: Set<string>;

    constructor() {
        this.huTable = new Set<string>();
        const beg = new Date()
        iteratePatterns(BIG, 14, (cardCount: number, patterns: number[][]) => {
            if (cardCount % 3 !== 2) return;
            const x = this.encodePattern(patterns);
            this.huTable.add(x.join(','));
        })
        console.log(`构建胡牌表完成，用时${new Date().getTime() - beg.getTime()}，元素个数${this.huTable.size}`)
    }

    encodePattern(pattern: number[][]): number[] {
        //把一个pattern映射成4个int，东西南北中发白为1个int，万桶条各1个int
        const code = li(4, 0);
        for (let i = 0; i < 7; i++) {
            code[0] += Pow5[i] * pattern[i][0];
        }
        for (let i = 0; i < 3; i++) {
            for (let ordinal = 0; ordinal < 9; ordinal++) {
                code[i + 1] += Pow5[ordinal] * pattern[i + 7][ordinal];
            }
        }
        return code;
    }

    encodeCards(cards: string[]): number[] {
        const code = li(4, 0);
        for (let i = 0; i < cards.length; i++) {
            const c = C.byName(cards[i]);
            if (c.part < 7) {
                code[0] += Pow5[c.part];
            } else {
                code[c.part - 7 + 1] += Pow5[c.ordinal];
            }
        }
        return code;
    }

    hu(sortedCards: string[]): boolean {
        const code = this.encodeCards(sortedCards);
        return this.huTable.has(code.join(','));
    }
}