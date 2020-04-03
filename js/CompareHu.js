"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Card_1 = require("./Card");
const Utils_1 = require("./Utils");
const TableHu_1 = require("./TableHu");
const MyJudger_1 = require("./ai/MyJudger");
/**
 * 比较两种胡牌算法：回溯法与查表法。
 *
 * 经过优化，查表法比回溯法快一点，但是两者差别不大
 * */
const cardCount2pattern = MyJudger_1.buildIndex(TableHu_1.shuziPai);
function randomSolvable() {
    /**
     * 随机生成一个可解的牌型，此函数用于测试胡牌算法的速度
     * 算法大意：首先随机出牌的张数，牌的张数必定是3n+2形式。
     * 首先，随机选将。然后，以三张为一组选择“面子”，也就是在10个
     * 区域里面寻找牌数为3的伪胡牌局面。
     * 在选牌过程中需要保证选出的牌自洽，也就是不能有牌个数超过四张。
     * */
    function get(part, cardCount) {
        if (part < 7) {
            return [cardCount];
        }
        else {
            const patterns = cardCount2pattern.get(cardCount);
            return Utils_1.randChoose(patterns).slice();
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
    const hand = [];
    const pile = Utils_1.li(34, 4); //余牌堆中每张牌的张数
    while (hand.length < total) {
        const part = Utils_1.randInt(0, 10); //随机一个区域
        //随机从这个区域中获取2张或者3张牌。如果是第一次，那么先处理将牌
        const pattern = get(part, hand.length == 0 ? 2 : 3);
        //如果余牌堆中有足够的牌，那么摸牌成功
        if (canAdd(pile, pattern, part)) {
            add(hand, pile, pattern, part);
        }
    }
    return hand;
}
function randomOne() {
    /**
     * 随机一个局面，可能有解也可能无解。但是，大概率是无解的。
     * 生成算法：随机洗牌，截取前n张牌。
     * */
    const cards = Card_1.getCards();
    const cardCount = Utils_1.randInt(1, 15); //牌的张数
    for (let i = 0; i < cardCount; i++)
        Utils_1.swap(cards, Utils_1.randInt(i, cards.length), i);
    return cards.slice(0, cardCount);
}
function compareHu() {
    //比较两种胡牌算法
    const a = [];
    const n = 10000000; //比较100万次
    const SOLVABLE_RATIO = 0.7; //可解问题所占的比例
    const cardCount = {};
    for (let i = 0; i < n; i++) {
        let p;
        if (Utils_1.random() < SOLVABLE_RATIO) {
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
            throw new Error('error');
        if (p.length > 14)
            throw new Error();
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
