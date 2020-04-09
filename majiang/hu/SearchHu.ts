import {Hu} from "../core/Hu";
import {C} from "../core/Card";

function compactOk(pairs: [number, number][], ind: number, hasJiang: boolean): boolean {
    if (ind >= pairs.length) return hasJiang;
    if (pairs[ind][1] === 0) {
        return compactOk(pairs, ind + 1, hasJiang);
    }
    //如果开头为对子，并且没有将
    if (!hasJiang && pairs[ind][1] >= 2) {
        pairs[ind][1] -= 2;
        let res = compactOk(pairs, ind, true);
        pairs[ind][1] += 2;
        if (res) return true
    }
    //如果是刻子
    if (pairs[ind][1] >= 3) {
        pairs[ind][1] -= 3;
        let res = compactOk(pairs, ind, hasJiang);
        pairs[ind][1] += 3;
        if (res) return true
    }
    //如果是顺子
    if (ind + 2 < pairs.length
        && pairs[ind][1] > 0 && pairs[ind + 1][1] > 0 && pairs[ind + 2][1] > 0
        && pairs[ind][0] + 1 === pairs[ind + 1][0]
        && pairs[ind][0] + 2 === pairs[ind + 2][0]
    ) {
        for (let i = 0; i < 3; i++) pairs[ind + i][1]--;
        let res = compactOk(pairs, ind, hasJiang);
        for (let i = 0; i < 3; i++) pairs[ind + i][1]++;
        if (res) return true
    }
    return false
}

export function compactSparseIndexPairs(sortedCards: string[]): [number, number][] {
    //把有序数组转换成一个[number,number]元组列表，第一个元素表示sparseIndex，第二个元素表示个数
    let pairs: [number, number][] = [];
    for (let i = 0; i < sortedCards.length;) {
        let j = i + 1;
        for (; j < sortedCards.length; j++) {
            if (sortedCards[j] !== sortedCards[i]) {
                break
            }
        }
        pairs.push([C.byName(sortedCards[i]).sparseIndex, j - i]);
        i = j
    }
    return pairs
}

export class SearchHu implements Hu {
    //判断a中的牌是否胡牌，是否满足胡牌公式
    hu(sortedCards: string[]): boolean {
        if ([0, 2].indexOf(sortedCards.length % 3) == -1) return false
        let pairs = compactSparseIndexPairs(sortedCards);
        return compactOk(pairs, 0, false)
    }
}

export function compactPartPairs(sortedCards: string[]) {
    //把有序数组转换成一个[number,number]元组列表，第一个元素表示sparseIndex，第二个元素表示个数
    const parts: [number, number][][] = [];
    let lastPart = -1;
    let current: [number, number][] = [];
    for (let i = 0; i < sortedCards.length;) {
        let j = i + 1;
        for (; j < sortedCards.length; j++) {
            if (sortedCards[j] !== sortedCards[i]) {
                break
            }
        }
        const card = C.byName(sortedCards[i]);
        if (card.part !== lastPart) {
            //提交上一个part
            if (current.length) {
                parts.push(current);
                current = [];
            }
            lastPart = card.part;
        }
        current.push([card.ordinal, j - i]);
        i = j
    }
    if (current.length) {
        parts.push(current);
    }
    return parts;
}

export class PartSearchHu implements Hu {
    /**
     * 这种方式先分区然后搜索，在TableHu中通过查表来判断一个part是否可解，这里使用
     * 回溯法判断一个part是否可解。这种方式比上面那种方式慢
     * */
    hu(sortedCards: string[]): boolean {
        if (sortedCards.length % 3 !== 2) return false;
        const parts = compactPartPairs(sortedCards);
        let hadJiang = false;
        for (let i = 0; i < parts.length; i++) {
            const partPairs = parts[i];
            let total = 0;
            let valid = false;
            for (let j = 0; j < partPairs.length; j++) total += partPairs[j][1];
            if (total % 3 === 2) {
                if (hadJiang) {
                    return false;
                } else {
                    hadJiang = true;
                    valid = compactOk(partPairs, 0, false);
                }
            } else if (total % 3 == 0) {
                valid = compactOk(partPairs, 0, true);
            } else {
                //整个区域只有一张牌，必定无解
                return false;
            }
            if (!valid) return false;
        }
        return true;
    }
}