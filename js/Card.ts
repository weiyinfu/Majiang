import {range} from "./Utils";

//所有的麻将字符
export const Majiang: string[] = Array.from('🀀🀁🀂🀃🀄🀅🀆🀇🀈🀉🀊🀋🀌🀍🀎🀏🀐🀑🀒🀓🀔🀕🀖🀗🀘🀙🀚🀛🀜🀝🀞🀟🀠🀡🀢🀣🀤🀥🀦🀧🀨🀩🀪🀫');


function buildNames() {
    //构建麻将名称列表
    let names: string[] = Array.from("东南西北中发白");
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 9; j++) {
            names.push((j + 1) + "万条筒"[i]);
        }
    }
    names = names.concat("梅 兰 竹 菊 春 夏 秋 冬 百搭 未知".split(/\s+/));
    return names;
}

export const NAMES = buildNames();
export let Sounds: string[] = NAMES.slice(0, 7 + 3 * 9);//花牌没有声音
export const UNKNOWN: string = NAMES[NAMES.length - 1];//未知的那张牌

class Card {
    color: string = "";//麻将的颜色，只用于UI显示
    image: string = "";//麻将的UTF8字符，只用于UI显示
    sound: string = "";//麻将的声音，只用于UI显示
    name: string = "";//麻将的名称
    part: number = 0;//麻将所属于的区域编号
    ordinal: number = 0;//麻将牌在其区域内的序号
    index: number = 0;//麻将的下标，在MAJIANG这个字符串中的下标
    sparseIndex: number = 0;//稀疏下标，取值为part*100+ordinal，稀疏下标的作用是快速判断连子，它是part和ordinal的组合
}


function buildCardMap() {
    const CardMap: { [index: string]: Card } = {}
    const cards: Card[] = [];
    for (let i = 0; i < Majiang.length; i++) {
        cards.push({
            color: 'black',
            image: Majiang[i],
            name: NAMES[i],
            index: i,
            part: -1,
            ordinal: -1,
            sound: NAMES[i],
            sparseIndex: -1,
        });
        CardMap[cards[i].name] = cards[i];
    }
    //一共十个分区：东西南北中发白，万筒条。分区用于判断顺子
    for (let i = 0; i < 7; i++) {
        cards[i].part = i;
        cards[i].ordinal = 0;
    }
    for (let i = 0; i < 3; i++) {
        for (var j = 0; j < 9; j++) {
            cards[i * 9 + j + 7].part = i + 7;
            cards[i * 9 + j + 7].ordinal = j;
        }
    }
    //利用sparseIndex可以避免区分区域而直接判断连子，不同区域不可能形成连子
    for (let i = 0; i < 7 + 3 * 9; i++) {
        cards[i].sparseIndex = cards[i].part * 100 + cards[i].ordinal;
    }
    //麻将字符和麻将颜色的映射，每种麻将都有特定的颜色
    const colorMap: { [index: string]: string[] } = {
        blue: Array.from('东南西北白').concat(range(9).map(x => `${x + 1}万`)),
        red: Array.from('中').concat(range(9).map(x => `${x + 1}筒`)),
        green: Array.from('发').concat(range(9).map(x => `${x + 1}条`)),
    };
    for (let color in colorMap) {
        for (let name of colorMap[color]) {
            CardMap[name].color = color;
        }
    }
    return CardMap;
}

export const CardMap: { [index: string]: Card } = buildCardMap();

export function getCard(part: number, ordinal: number): Card {
    //根据区域和序数获取麻将
    if (part < 7) {
        if (ordinal != 0) {
            throw 'error';
        }
        return CardMap[NAMES[part]];
    } else {
        if (!(ordinal >= 0 && ordinal < 9)) {
            throw 'error';
        }
        const ind = (part - 7) * 9 + 7 + ordinal;
        return CardMap[NAMES[ind]];
    }
}


export function sortCards(a: string[]) {
    //对麻将按照index进行排序
    return a.sort((x, y) => CardMap[x].index - CardMap[y].index);
}

export function getCards() {
    //获取麻将的全部牌，不考虑春夏秋冬和百搭
    let a: string[] = [];
    for (var i = 0; i < 34; i++)
        for (var j = 0; j < 4; j++)
            a.push(NAMES[i]);
    return a;
}

export function hu(sortedCards: string[]): boolean {
    //判断a中的牌是否胡牌，是否满足胡牌公式
    function toCardCount(sortedCards: string[]): [number, number][] {
        //把有序数组转换成一个[number,number]元祖列表，第一个元素表示sparseIndex，第二个元素表示个数
        let pairs: [number, number][] = [];
        for (let i = 0; i < sortedCards.length;) {
            let j = i + 1;
            for (; j < sortedCards.length; j++) {
                if (sortedCards[j] !== sortedCards[i]) {
                    break
                }
            }
            pairs.push([CardMap[sortedCards[i]].sparseIndex, j - i]);
            i = j
        }
        return pairs
    }

    function go(pairs: [number, number][], ind: number, hasJiang: boolean): boolean {
        if (ind >= pairs.length) return hasJiang;
        if (pairs[ind][1] === 0) {
            return go(pairs, ind + 1, hasJiang);
        }
        //如果开头为对子，并且没有将
        if (!hasJiang && pairs[ind][1] >= 2) {
            pairs[ind][1] -= 2;
            let res = go(pairs, ind, true);
            pairs[ind][1] += 2;
            if (res) return true
        }
        //如果是刻子
        if (pairs[ind][1] >= 3) {
            pairs[ind][1] -= 3;
            let res = go(pairs, ind, hasJiang);
            pairs[ind][1] += 3;
            if (res) return true
        }
        //如果是顺子
        if (ind + 2 < pairs.length
            && pairs[ind][1] > 0 && pairs[ind + 1][1] > 0 && pairs[ind + 2][1] > 0
            && pairs[ind][0] + 1 == pairs[ind + 1][0]
            && pairs[ind][0] + 2 == pairs[ind + 2][0]
        ) {
            for (let i = 0; i < 3; i++) pairs[ind + i][1]--;
            let res = go(pairs, ind, hasJiang);
            for (let i = 0; i < 3; i++) pairs[ind + i][1]++;
            if (res) return true
        }
        return false
    }

    if ([0, 2].indexOf(sortedCards.length % 3) == -1) return false
    let pairs = toCardCount(sortedCards);
    return go(pairs, 0, false)
}
