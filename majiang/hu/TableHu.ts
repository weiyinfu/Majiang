import {li, range} from "../util/Utils";
import {Hu} from "../core/Hu";
import {C} from "../core/Card";

/**
 * 基于查表的胡牌算法
 * */
export function ok(a: number[], ind: number, canJiang: boolean): boolean {
    //判断给定局面是否有解，a是一个9维数组，其中数字表示每种数字的个数;从ind处开始搜索,canJiang表示是否可以有将
    if (ind === a.length) {
        //遍历结束
        return true;
    }
    if (a[ind] === 0) {
        return ok(a, ind + 1, canJiang);
    }
    if (canJiang && a[ind] >= 2) {
        a[ind] -= 2;
        const res = ok(a, ind, false);
        a[ind] += 2;
        if (res) return true;
    }
    if (a[ind] >= 3) {
        //刻子
        a[ind] -= 3;
        const res = ok(a, ind, canJiang);
        a[ind] += 3;
        if (res) return true;
    }
    if (ind + 2 < a.length && a[ind] && a[ind + 1] && a[ind + 2]) {
        //连子
        for (let i = 0; i < 3; i++) a[ind + i]--;
        const res = ok(a, ind, canJiang);
        for (let i = 0; i < 3; i++) a[ind + i]++;
        if (res) return true;
    }
    return false;
}

function buildNumberCards() {
    //9种牌，每种4张，寻找出全部有解的牌型
    const MAX_CARD = 14;//牌数不超过14
    const NUMBER_COUNT = 9;//数字的个数不超过9

    //构建数字牌的有解的情况
    function solvable(a: number[]) {
        const cardCount = a.reduce((o, n) => o + n, 0)
        //胡牌局面必定是模三余2或3
        if (cardCount > MAX_CARD) return false;
        if (cardCount % 3 != 2 && cardCount % 3 != 0) return false;
        return ok(a, 0, true);
    }

    //产生所有的局面,总共5^9种情况
    let solvableList: number[][] = [];

    function go(a: number[], has: number[], ind: number, cardCount: number): void {
        if (ind === a.length) {
            //走到了最后，产生了一个局面
            if (solvable(a)) {
                solvableList.push(a.slice());
            }
            return
        }
        if (cardCount > MAX_CARD) return;
        for (let i = 0; i <= has[ind]; i++) {
            a[ind] = i;
            go(a, has, ind + 1, cardCount + i);
            a[ind] = 0;
        }
    }

    const a = li(NUMBER_COUNT, 0);
    const cardCount = li(NUMBER_COUNT, 4);
    go(a, cardCount, 0, 0);
    return solvableList;
}

//可解的数字牌
export const shuziPai: number[][] = buildNumberCards()

/**
 * 把有解的数字牌制成一个数字集合
 * */
function encode(pattern: number[]) {
//把数字牌牌型编码为数字，使用5进制数字表示
    let s = 0;
    for (let i = 0; i < pattern.length; i++) {
        s += Math.pow(5, i) * pattern[i];
    }
    return s;
}

const shuziPaiSet = new Set(shuziPai.map(encode))
//胡牌时，字牌可能的pattern
const ziPaiSet = new Set([0, 2, 3].map(x => encode([x])))
export const Pow5 = range(10).map(x => Math.floor(Math.pow(5, x)))

export class TableHu implements Hu {
    hu(cards: string[]): boolean {
        //基于查表的胡牌算法,cards可以无序
        let pattern: number[] = li(10, 0);//10个part，每个part的编码
        let partCardCount: number[] = li(10, 0);//10个part，每个part的牌数
        for (let i of cards) {
            const card = C.byName(i);
            pattern[card.part] += Pow5[card.ordinal];
            partCardCount[card.part]++;
        }
        let hasJiang = false;
        for (let i of partCardCount) {
            if (i % 3 == 2) {
                if (hasJiang) return false
                hasJiang = true
            } else if (i % 3 !== 0) {
                return false;
            }
        }
        //没有将不算赢
        if (!hasJiang) return false
        for (let part = 0; part < 10; part++) {
            const codeSet = part < 7 ? ziPaiSet : shuziPaiSet;
            if (!codeSet.has(pattern[part])) return false;
        }
        return true;
    }
}
