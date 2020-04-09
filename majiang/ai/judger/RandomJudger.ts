import {Judger, JudgeResult, State} from "../Judger";
import {random} from "../../util/Utils";
import {C, sortCards} from "../../core/Card";

/**
 * 随机返回分数，用于比较,它是一个笑话。
 * */
export class RandomJudger implements Judger {
    /**
     * RandomJudger会对局面进行随机评价，它永远都赢不了
     * */
    judge(state: State, hand: string[]): JudgeResult {
        if (hand.length % 3 !== 1) throw `手牌个数应该模三余一 ${hand.join(',')}`;
        return {score: random(), meta: {}};
    }

    getName() {
        return RandomJudger.name;
    }
}

export class ConstantJudger implements Judger {
    /**
     * ConstantJudger总是返回一个固定值，这样所有局面它都一视同仁，因为外层会对牌进行排序，
     * 所以弃牌时，总是弃掉最小的那张牌。这就使得它有一定的胜率，比RandomJudger强些，但是
     * 它依赖外部程序的排序行为。它的改进版为下面ExtremeJudger。
     * */
    judge(state: State, hand: string[]): JudgeResult {
        if (hand.length % 3 !== 1) throw `手牌个数应该模三余一 ${hand.join(',')}`;
        return {score: 0, meta: {}};
    }

    getName() {
        return ConstantJudger.name;
    }
}

export class ExtremeJudger implements Judger {
    /**
     * 极端Judger：这个judger认为，手牌中牌越大越好，或者牌越小越好。
     * 如果judger认为牌越大越好，那么最后它的手牌会变成一堆“筒牌”，称此judger为“留大”
     * 如果judger认为牌越小越好，那么最后它的手牌会变成一堆“东西南北中发白”，称此judger为“留小”
     * “留大”性能比“留小”性能好很多，因为留大最后剩下的是数字牌，可以形成顺子。而留小最后剩下字牌，没法形成顺子，导致胡牌局面更少。
     * */
    maxBetter: boolean;

    constructor(maxBetter: boolean) {
        this.maxBetter = maxBetter;
    }

    judge(state: State, hand: string[]): JudgeResult {
        if (hand.length % 3 !== 1) throw `手牌个数应该模三余一 ${hand.join(',')}`;
        const cards = hand.slice();
        sortCards(cards);
        let score: number;
        if (this.maxBetter) {
            score = C.byName(cards[0]).index;
        } else {
            score = -C.byName(cards[cards.length - 1]).index;
        }
        return {score, meta: {}};
    }

    getName() {
        return `${ExtremeJudger.name}(${this.maxBetter ? '留大' : '留小'})`
    }
}