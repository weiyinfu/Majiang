/**
 * 麻将局面评判器接口，麻将局面评判器是麻将AI的核心部件。
 * 本程序规定了麻将局面评判器的核心要素。
 * 输入State和手牌hand，输出对“手牌”的评分
 * */
export class State {
    /**
     * 牌局面，这个局面是AI能够看到的全部信息
     * a表示每种未曾出现过的牌的张数
     * 对于a中全部为4张牌的牌，因为暗杠的缘故，都要乘以概率
     * 未知的牌中各张牌的张数，包括一切未曾显现的牌，包括别人的手牌，牌堆中的牌，暗杠的牌
     * */
    a: number[] = [];
    anGangCount: number = 0;//除我以外其他用户暗杠的牌的个数
}

//judger返回的最低分数
export const MIN_SCORE = Number.MIN_SAFE_INTEGER;

export class JudgeResult {
    //不同judger可以返回不同的meta信息，score越高代表局面越好
    score: number = 0;
    meta: any = null;
}

export interface Judger {
    //麻将局面评判器
    judge(state: State, hand: string[]): JudgeResult;


    getName(): string;
}
