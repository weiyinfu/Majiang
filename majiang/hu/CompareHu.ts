import {C, getCards, sortCards} from "../core/Card";
import {getCount, li, ll, randChoose, randInt, random, swap} from "../util/Utils";
import {shuziPai, TableHu} from "./TableHu";
import {buildReverseIndexOfPatterns} from "../ai/judger/MyJudger";
import {Hu} from "../core/Hu";
import {PartSearchHu, SearchHu} from "./SearchHu";
import {NumberBigTableHu} from "./BigTableHu";

/**
 * 比较胡牌算法：回溯法与查表法。
 *
 * 经过优化，查表法比回溯法快一点，但是两者差别不大
 * */
const cardCount2pattern = buildReverseIndexOfPatterns(shuziPai);

function randomSolvable(): string[] {
    /**
     * 随机生成一个可解的牌型，此函数用于测试胡牌算法的速度
     * 算法大意：首先随机出牌的张数，牌的张数必定是3n+2形式。
     * 首先，随机选将。然后，以三张为一组选择“面子”，也就是在10个
     * 区域里面寻找牌数为3的伪胡牌局面。
     * 在选牌过程中需要保证选出的牌自洽，也就是不能有牌个数超过四张。
     * */
    function get(part: number, cardCount: number): number[] {
        if (part < 7) {
            return [cardCount]
        } else {
            const patterns = <number[][]>cardCount2pattern.get(cardCount);
            return randChoose(patterns).slice();
        }
    }

    function add(a: string[], had: number[], pattern: number[], part: number) {
        //把part区pattern牌加入到a里面
        for (let i = 0; i < pattern.length; i++) {
            const card = C.byPartOrdinal(part, i)
            had[card.index] -= pattern[i];
            for (let j = 0; j < pattern[i]; j++) {
                a.push(card.name)
            }
        }
    }

    function canAdd(had: number[], pattern: number[], part: number) {
        //判断pattern是否可以添加到牌中
        for (let i = 0; i < pattern.length; i++) {
            const card = C.byPartOrdinal(part, i);
            if (had[card.index] < pattern[i]) {
                return false;
            }
        }
        return true;
    }

    //随机生成各个区域的牌的张数
    const total = randChoose([2, 5, 8, 11, 14])//牌的张数
    const hand: string[] = []
    const pile: number[] = li(34, 4);//余牌堆中每张牌的张数
    while (hand.length < total) {
        const part = randInt(0, 10)//随机一个区域
        //随机从这个区域中获取2张或者3张牌。如果是第一次，那么先处理将牌
        const pattern = get(part, hand.length == 0 ? 2 : 3);
        //如果余牌堆中有足够的牌，那么摸牌成功
        if (canAdd(pile, pattern, part)) {
            add(hand, pile, pattern, part);
        }
    }
    return hand
}

function randomOne(): string[] {
    /**
     * 随机一个局面，可能有解也可能无解。但是，大概率是无解的。
     * 生成算法：随机洗牌，截取前n张牌。
     * */
    const cards = getCards();
    const cardCount = randInt(1, 15);//牌的张数
    for (let i = 0; i < cardCount; i++) swap(cards, randInt(i, cards.length), i);
    return cards.slice(0, cardCount);
}

function compareHu(huList: Hu[], n: number, SOLVABLE_RATIO: number) {
    //比较两种胡牌算法
    const a: string[][] = []
    const cardCount: { [index: number]: number } = {}
    for (let i = 0; i < n; i++) {
        let p: string[]
        if (random() < SOLVABLE_RATIO) {
            p = randomSolvable()
        } else {
            p = randomOne()
        }
        if (!cardCount[p.length]) {
            cardCount[p.length] = 0
        }
        cardCount[p.length]++
        if (p.length == 0) throw new Error('error')
        if (p.length > 14) throw new Error();
        a.push(sortCards(p))
    }
    console.log(`${a.length}个问题已生成，可解比例为${SOLVABLE_RATIO} \n问题分布${JSON.stringify(cardCount, null, 2)}`)
    const huAnswer: boolean[][] = ll(huList.length);
    const table: any[] = []
    for (let hi = 0; hi < huList.length; hi++) {
        const beg = new Date();
        const hu = huList[hi];
        for (let i of a) {
            huAnswer[hi].push(hu.hu(i.slice()))
        }
        const used = new Date().getTime() - beg.getTime();
        console.log(`${hu.constructor.name}需要时间${used}`);
        table.push({
            name: hu.constructor.name,
            time: used,
        })
    }
    for (let i = 0; i < a.length; i++) {
        for (let hi = 1; hi < huList.length; hi++) {
            if (huAnswer[hi][i] != huAnswer[0][i]) {
                console.log(`双方答案不一致
${huList[hi].constructor.name} ${huAnswer[hi][i]}
${huList[0].constructor.name} ${huAnswer[0][i]}
题目：${a[i].join(',')}
                `)
            }
        }
    }
    const canSolve = getCount(huAnswer[0], true)
    console.log(`问题类型：有解${canSolve}，无解${a.length - canSolve}`)
    console.table(table);
    // const big = huList[huList.length - 1] as BigTableHu
    // console.log(big.searchTime)
}

compareHu([
        new SearchHu(),
        new PartSearchHu(),
        new TableHu(),
        new NumberBigTableHu(),
        // new SetBigTableHu(),
        // new StringBigTableHu(),
    ], 1000000,
    0.4)
