"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Card_1 = require("./Card");
const Utils_1 = require("./Utils");
const TableHu_1 = require("./TableHu");
/**
 * 比较两种胡牌算法
 *
 * 经过优化，查表法比回溯法快一点，但是两者差别不大
 * */
function buildShuziReverseIndex() {
    //构建数字牌牌的张数到牌型的倒排索引
    const map = {};
    for (let i of TableHu_1.shuziPai) {
        const s = i.reduce((o, n) => o + n, 0);
        if (!map[s])
            map[s] = [];
        map[s].push(i);
    }
    return map;
}
const cardCount2pattern = buildShuziReverseIndex();
function randomSolvable() {
    //随机生成一个可解的牌型，此函数用于测试胡牌算法的速度
    function get(part, cardCount) {
        if (part < 7) {
            return [cardCount];
        }
        else {
            return Utils_1.randChoose(cardCount2pattern[cardCount]).slice();
        }
    }
    function add(a, had, pattern, part) {
        //把part区pattern牌加入到a里面
        for (let i = 0; i < pattern.length; i++) {
            const card = Card_1.getCard(part, i);
            had[card.index] -= pattern[i];
            for (let j = 0; j < pattern[i]; j++) {
                a.push(card.name);
            }
        }
    }
    function canAdd(had, pattern, part) {
        //判断pattern是否可以添加到牌中
        for (let i = 0; i < pattern.length; i++) {
            const card = Card_1.getCard(part, i);
            if (had[card.index] < pattern[i]) {
                return false;
            }
        }
        return true;
    }
    //随机生成各个区域的牌的张数
    const total = Utils_1.randChoose([2, 5, 8, 11, 14]); //牌的张数
    const cards = [];
    const had = Utils_1.li(34, 4); //余牌堆中每张牌的张数
    while (cards.length < total) {
        const part = Utils_1.randInt(0, 10); //随机一个区域
        //随机从这个区域中获取2张或者3张牌。如果是第一次，那么先处理将牌
        const pattern = get(part, cards.length == 0 ? 2 : 3);
        //如果余牌堆中有足够的牌，那么摸牌成功
        if (canAdd(had, pattern, part)) {
            add(cards, had, pattern, part);
        }
    }
    return cards;
}
function randomOne() {
    //随机一个局面，可能有解也可能无解
    class Pair {
        constructor() {
            this.index = -1;
            this.count = -1;
        }
    }
    let a = [];
    //34张牌，每张牌都可能为0
    for (let i = 0; i < 34; i++) {
        a.push({
            index: i,
            count: Utils_1.randInt(0, 5)
        });
    }
    Utils_1.shuffle(a);
    const cardCount = Utils_1.randInt(1, 15); //牌的张数
    const cards = [];
    out: for (let pair of a) {
        for (let i = 0; i < pair.count; i++) {
            cards.push(Card_1.NAMES[pair.index]);
            if (cards.length === cardCount) {
                break out;
            }
        }
    }
    return cards;
}
function compareHu() {
    //比较两种胡牌算法
    const a = [];
    const n = 1000000; //比较100万次
    const SOLVABLE_RATIO = 0.7; //可解问题所占的比例
    const cardCount = {};
    for (let i = 0; i < n; i++) {
        let p;
        if (Math.random() < SOLVABLE_RATIO) {
            p = randomSolvable();
        }
        else {
            p = randomOne();
        }
        if (!cardCount[p.length]) {
            cardCount[p.length] = 0;
        }
        cardCount[p.length]++;
        if (p.length == 0)
            throw 'error';
        if (p.length > 14)
            throw 'error';
        a.push(Card_1.sortCards(p));
    }
    console.log(`${a.length}个问题已生成，可解比例为${SOLVABLE_RATIO} \n问题分布${JSON.stringify(cardCount, null, 2)}`);
    let beg = new Date().getTime();
    const huAnswer = [];
    for (let i of a) {
        huAnswer.push(Card_1.hu(i.slice()));
    }
    let end = new Date().getTime();
    console.log(`回溯法需要的时间${end - beg}`);
    beg = new Date().getTime();
    const tableAnswer = [];
    for (let i of a) {
        tableAnswer.push(TableHu_1.huByTable(i.slice()));
    }
    end = new Date().getTime();
    console.log(`查表法需要的时间${end - beg}`);
    for (let i = 0; i < n; i++) {
        if (huAnswer[i] !== tableAnswer[i]) {
            console.log(`双方答案不一致`);
            console.log(a[i]);
            console.log(`回溯法答案${huAnswer[i]},查表法答案${tableAnswer[i]}`);
        }
    }
    const canSolve = Utils_1.getCount(huAnswer, true);
    console.log(`问题类型：有解${canSolve}，无解${a.length - canSolve}`);
}
compareHu();
