"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
//所有的麻将字符
exports.Majiang = Array.from('🀀🀁🀂🀃🀄🀅🀆🀇🀈🀉🀊🀋🀌🀍🀎🀏🀐🀑🀒🀓🀔🀕🀖🀗🀘🀙🀚🀛🀜🀝🀞🀟🀠🀡🀢🀣🀤🀥🀦🀧🀨🀩🀪🀫');
function buildNames() {
    //构建麻将名称列表
    let names = Array.from("东南西北中发白");
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 9; j++) {
            names.push((j + 1) + "万条筒"[i]);
        }
    }
    names = names.concat("梅 兰 竹 菊 春 夏 秋 冬 百搭 未知".split(/\s+/));
    return names;
}
exports.NAMES = buildNames();
exports.Sounds = exports.NAMES.slice(0, 7 + 3 * 9); //花牌没有声音
exports.UNKNOWN = exports.NAMES[exports.NAMES.length - 1]; //未知的那张牌
class Card {
    constructor() {
        this.color = ""; //麻将的颜色，只用于UI显示
        this.image = ""; //麻将的UTF8字符，只用于UI显示
        this.sound = ""; //麻将的声音，只用于UI显示
        this.name = ""; //麻将的名称
        this.part = 0; //麻将所属于的区域编号
        this.ordinal = 0; //麻将牌在其区域内的序号
        this.index = 0; //麻将的下标，在MAJIANG这个字符串中的下标
        this.sparseIndex = 0; //稀疏下标，取值为part*100+ordinal，稀疏下标的作用是快速判断连子，它是part和ordinal的组合
    }
}
exports.Card = Card;
function buildCardMap() {
    const CardMap = {};
    const cards = [];
    for (let i = 0; i < exports.Majiang.length; i++) {
        cards.push({
            color: 'black',
            image: exports.Majiang[i],
            name: exports.NAMES[i],
            index: i,
            part: -1,
            ordinal: -1,
            sound: exports.NAMES[i],
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
    const colorMap = {
        blue: Array.from('东南西北白').concat(Utils_1.range(9).map(x => `${x + 1}万`)),
        red: Array.from('中').concat(Utils_1.range(9).map(x => `${x + 1}筒`)),
        green: Array.from('发').concat(Utils_1.range(9).map(x => `${x + 1}条`)),
    };
    for (let color in colorMap) {
        for (let name of colorMap[color]) {
            CardMap[name].color = color;
        }
    }
    return CardMap;
}
exports.CardMap = buildCardMap();
function getCard(part, ordinal) {
    //根据区域和序数获取麻将
    if (part < 7) {
        if (ordinal != 0) {
            throw new Error(`error card ordinal error ordinal=${ordinal} part=${part}`);
        }
        return exports.CardMap[exports.NAMES[part]];
    }
    else {
        if (!(ordinal >= 0 && ordinal < 9)) {
            throw new Error(`error ordinal error :ordinal=${ordinal} part=${part}`);
        }
        const ind = (part - 7) * 9 + 7 + ordinal;
        return exports.CardMap[exports.NAMES[ind]];
    }
}
exports.getCard = getCard;
function sortCards(a) {
    //对麻将按照index进行排序
    return a.sort((x, y) => exports.CardMap[x].index - exports.CardMap[y].index);
}
exports.sortCards = sortCards;
function getCards() {
    //获取麻将的全部牌，不考虑春夏秋冬和百搭
    let a = [];
    for (var i = 0; i < 34; i++)
        for (var j = 0; j < 4; j++)
            a.push(exports.NAMES[i]);
    return a;
}
exports.getCards = getCards;
function hu(sortedCards) {
    //判断a中的牌是否胡牌，是否满足胡牌公式
    function toCardCount(sortedCards) {
        //把有序数组转换成一个[number,number]元祖列表，第一个元素表示sparseIndex，第二个元素表示个数
        let pairs = [];
        for (let i = 0; i < sortedCards.length;) {
            let j = i + 1;
            for (; j < sortedCards.length; j++) {
                if (sortedCards[j] !== sortedCards[i]) {
                    break;
                }
            }
            pairs.push([exports.CardMap[sortedCards[i]].sparseIndex, j - i]);
            i = j;
        }
        return pairs;
    }
    function go(pairs, ind, hasJiang) {
        if (ind >= pairs.length)
            return hasJiang;
        if (pairs[ind][1] === 0) {
            return go(pairs, ind + 1, hasJiang);
        }
        //如果开头为对子，并且没有将
        if (!hasJiang && pairs[ind][1] >= 2) {
            pairs[ind][1] -= 2;
            let res = go(pairs, ind, true);
            pairs[ind][1] += 2;
            if (res)
                return true;
        }
        //如果是刻子
        if (pairs[ind][1] >= 3) {
            pairs[ind][1] -= 3;
            let res = go(pairs, ind, hasJiang);
            pairs[ind][1] += 3;
            if (res)
                return true;
        }
        //如果是顺子
        if (ind + 2 < pairs.length
            && pairs[ind][1] > 0 && pairs[ind + 1][1] > 0 && pairs[ind + 2][1] > 0
            && pairs[ind][0] + 1 == pairs[ind + 1][0]
            && pairs[ind][0] + 2 == pairs[ind + 2][0]) {
            for (let i = 0; i < 3; i++)
                pairs[ind + i][1]--;
            let res = go(pairs, ind, hasJiang);
            for (let i = 0; i < 3; i++)
                pairs[ind + i][1]++;
            if (res)
                return true;
        }
        return false;
    }
    if ([0, 2].indexOf(sortedCards.length % 3) == -1)
        return false;
    let pairs = toCardCount(sortedCards);
    return go(pairs, 0, false);
}
exports.hu = hu;
