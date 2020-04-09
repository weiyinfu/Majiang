/**
 * 我自己实现的第一个麻将局面评估器：运行效率太低，每次judge一次需要100ms
 *
 * TODO:Judger考虑暗杠：暗杠会造成局面数爆炸，所以暂时不考虑暗杠，暗杠需要猜牌。
 * TODO:MyJudger有点混乱，主要原因是最开始把麻将当成了无放回无弃球的游戏。应该实现更强大的AI。
 * */
import {Judger, JudgeResult, State} from "../Judger";
import {deepcopy, flat, getCount, li, randInt, swap} from "../../util/Utils";
import {C, NAMES, sortCards} from "../../core/Card";
import {shuziPai} from "../../hu/TableHu";


const MAX_STEPS = 100000;//到达胜利的步数
type PatternCallback = (cardCount: number, pattern: number[][]) => void;

export function buildReverseIndexOfPatterns(patterns: number[][]) {
    let cardCount2pattern: Map<number, number[][]> = new Map<number, number[][]>();
    for (let i = 0; i < patterns.length; i++) {
        const p = patterns[i];
        const s = p.reduce((o, n) => o + n, 0)
        let now = cardCount2pattern.get(s);
        now ? now.push(p) : cardCount2pattern.set(s, [p]);
    }
    return cardCount2pattern;
}

function buildReverseIndex() {
    //10个分区，每个分区都有可能有解的局面
    //为每个分区建立 牌的张数=>patterns倒排索引
    //字牌pattern列表
    const zi = buildReverseIndexOfPatterns([[0], [2], [3]]);
    const shuzi = buildReverseIndexOfPatterns(shuziPai);
    return li(7, zi).concat(li(3, shuzi));
}

export const BIG: Map<number, number[][]>[] = buildReverseIndex();
//日志相关的开关
export const PRINT = {
    SHOW_TARGET: false,//是否打印judge函数的目标
};

export function vectorize(a: string[]) {
    //把牌列表转换成34维的向量
    const v: number[] = li(34, 0);
    for (let i = 0; i < a.length; i++) {
        const x = a[i];
        const card = C.byName(x);
        if (!card) throw new Error(`no card ${x}`);
        if (card.index < 0 || card.index >= 34) {
            throw new Error(`error card ${x}`);
        }
        v[card.index]++
    }
    return v;
}

export function splitVector(cardVector: number[]) {
    //把一维向量转成10个part的一维向量
    if (cardVector.length !== 34) throw new Error('error vector length');
    const parts: number[][] = [];
    for (let i = 0; i < 7; i++) {
        //字牌
        parts.push([cardVector[i]]);
    }
    for (let i = 0; i < 3; i++) {
        //数字牌
        const beg = 7 + i * 9, end = 7 + (i + 1) * 9;
        parts.push(cardVector.slice(beg, end));
    }
    return parts;
}

export function stringify(a: number[]) {
    //把牌向量转换成字符串数组，返回的手牌必然是有序的
    if (a.length !== 34) throw new Error('error');
    let cards: string[] = [];
    for (let i = 0; i < a.length; i++) {
        cards = cards.concat(li(a[i], NAMES[i]));
    }
    return cards;
}

function stringifyPart(part: number, a: number[]) {
    //把一个part的向量转成字符串数组
    const cards: string[] = []
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a[i]; j++)
            cards.push(C.byPartOrdinal(part, i).name);
    }
    return cards;
}

function diff(target: number[], now: number[]) {
    //计算差牌，从now到target需要新摸到哪些牌
    if (target.length !== now.length) throw new Error(`error ${target.join(',')} | ${now.join(',')}`);
    const c: number[] = new Array(target.length);
    for (let i = 0; i < target.length; i++) {
        c[i] = Math.max(target[i] - now[i], 0);
    }
    return c;
}

function diff2(target: number[][], now: number[][]): number[] {
    //直接对2层分区进行diff
    if (target.length !== now.length || target.length == 10) throw new Error('error');
    let ind = 0;
    const c: number[] = new Array(34);
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < target[i].length; j++) {
            c[ind] = Math.max(target[i][j] - now[i][j]);
            ind++;
        }
    }
    return c;
}

export class FetchBall {
    //多目标不放回不弃牌摸球问题
    static atLeast(a: number[], target: number[][],): number {
        //最少摸球次数，直接返回target中元素个数
        let minSteps = MAX_STEPS;
        for (let t of target) {
            let s = 0;
            for (let i = 0; i < a.length; i++) {
                if (t[i] > a[i]) {
                    s = MAX_STEPS;
                    break;
                }//不可能完成
                s += t[i];
            }
            minSteps = Math.min(minSteps, s);
        }
        return minSteps;
    }

    static montecarlo(a: number[], target: number[][], caseCount: number): number {
        //蒙特卡罗法解决摸球问题，这个算法必须足够高效
        const ballCount = a.reduce((o, n) => o + n, 0)
        const times = li(ballCount + 1, 0);//摸球的次数应该比ballCount大1
        let box: number[] = [];
        for (let i = 0; i < a.length; i++) box = box.concat(li(a[i], i));
        const TARGET_LEFT = target.map(pattern => a.length - getCount(pattern, 0))
        for (let i of TARGET_LEFT) if (i === 0) return 0;
        for (let cas = 0; cas < caseCount; cas++) {
            const targetLeft = TARGET_LEFT.slice();
            const ta = deepcopy(target);
            over:
                for (let i = 0; i < box.length; i++) {
                    //随机选择一个球
                    swap(box, i, randInt(i, box.length));
                    const ball = box[i];
                    //让每个task都减少这个球
                    for (let ti = 0; ti < ta.length; ti++) {
                        const t = ta[ti];
                        if (t[ball]) {
                            t[ball]--;
                            if (t[ball] === 0) {
                                targetLeft[ti]--;
                                if (targetLeft[ti] === 0) {
                                    //摸了i+1次球达到目标了
                                    times[i + 1]++;
                                    break over;
                                }
                            }
                        }
                    }
                }
        }
        //计算期望
        let expect = 0;
        for (let i = 0; i < times.length; i++) expect += i * times[i] / caseCount;
        return expect;
    }

    static accurate(a: number[], target: number[][]): number {
        //基于递推法精确解决多目标摸球问题
        const dic: { [index: string]: number } = {}

        function getKey(a: number[], target: number[][]): string {
            return a.join(',') + ':' + target.slice().sort().map(x => x.join(',')).join(';')
        }

        function go(a: number[], target: number[][]) {
            const key = getKey(a, target);
            if (dic[key]) {
                return dic[key];
            }
            //如果存在已经为空的，那么直接返回
            for (let ta of target) {
                let all0 = true;
                for (let i of ta) {
                    if (i) {
                        all0 = false;
                        break;
                    }
                }
                if (all0) {
                    dic[key] = 0;
                    return 0;
                }
            }
            let total = a.reduce((o, n) => o + n, 0)
            let ans = 1;
            for (let i = 0; i < a.length; i++) {
                if (a[i]) {
                    const p = a[i] / total;
                    a[i]--;
                    const updated: number[] = [];
                    for (let ti = 0; ti < target.length; ti++) {
                        if (target[ti][i]) {
                            updated.push(ti);
                            target[ti][i]--;
                        }
                    }
                    ans += p * go(a, target);
                    for (let ti of updated) {
                        target[ti][i]++;
                    }
                    a[i]++;
                }
            }
            dic[key] = ans;
            return ans;
        }

        return go(a, target);
    }

    static atMost(a: number[], target: number[][],): number {
        //摸球问题上界
        let minSteps = MAX_STEPS;
        let total = a.reduce((o, n) => o + n, 0);
        for (let ta of target) {
            let now = 0;
            for (let i = 0; i < ta.length; i++) {
                if (ta[i] > a[i]) {
                    //不可能完成
                    now = MAX_STEPS;
                    break;
                }
                const white = a[i], black = total - a[i];
                const want = ta[i];
                now += (white + black + 1) * want / (white + 1);
            }
            minSteps = Math.min(now, minSteps);
        }
        return minSteps;
    }
}


export function iteratePatterns(a: Map<number, number[][]>[], maxCardCount: number, patternHandler: PatternCallback) {
    /**
     * 计算a中的笛卡尔积
     * 元素的个数不能超过maxCardCount
     * 调用patternHandler来处理每个pattern
     * 只返回可能3n+2的pattern
     * */
    const pattern: number[][] = li(a.length, []);

    function go(ind: number, cardCount: number) {
        if (cardCount > maxCardCount) return;
        if (ind === a.length) {
            if (cardCount % 3 == 2) {
                //只submit胡牌牌型
                patternHandler(cardCount, pattern);
            }
            return;
        }
        const countPatterns = a[ind].entries();
        while (1) {
            const res = countPatterns.next();
            if (res.done) break;
            const [partCardCount, patterns] = res.value;
            //如果已经有了将，那么不能再有将了
            if (cardCount % 3 == 2) {
                if (partCardCount % 3 == 2) continue;
            }
            for (let p of patterns) {
                pattern[ind] = p;
                go(ind + 1, cardCount + partCardCount)
            }
        }
    }

    go(0, 0);
}

export class PartSumJudger implements Judger {
    /**
     * 把各个子区间到完善局面的最小距离加起来作为当前局面到胡牌局面的距离
     * */
    judge(state: State, hand: string[]): JudgeResult {
        const handParts = splitVector(vectorize(hand));
        const pileParts = splitVector(state.a);
        /**
         * 每个区域中按照count划分目标pattern，
         * 每个count下面只取最相似的那些pattern。因为不同区域具有独立性，所以一个区域中最好的结果必然是全局最好的结果。
         * 所以这是一个二维pattern列表。
         * */
        let s = 0;
        for (let partId = 0; partId < BIG.length; partId++) {
            const handPart = handParts[partId];
            const partHandCount = handPart.reduce((o, n) => o + n, 0)
            //如果这个区域手牌为0，那么直接跳过该区域
            if (partHandCount === 0) continue;
            let minL1 = MAX_STEPS;
            const countPatterns = BIG[partId].entries();
            while (1) {
                const res = countPatterns.next();
                if (res.done) break;
                const [cardCount, patterns] = res.value;
                if (Math.abs(cardCount - partHandCount) >= minL1) {
                    //如果这个cardCount区域牌数差太多，直接跳过
                    continue;
                }
                for (let patternId = 0; patternId < patterns.length; patternId++) {
                    const p = patterns[patternId];
                    //计算L1距离
                    let l1 = 0;
                    for (let i = 0; i < p.length; i++) {
                        const lack = p[i] - handPart[i];
                        if (lack > pileParts[partId][i]) {
                            //如果缺的牌牌堆里也不够，那么这个就不能看
                            l1 = MAX_STEPS;
                            break;
                        }
                        l1 += Math.abs(lack);
                    }
                    if (l1 < minL1) {
                        minL1 = l1;
                    }
                }
            }
            s += minL1;
        }
        return {score: -s, meta: {}}
    }

    getName(): string {
        return PartSumJudger.name;
    }
}

export class MyJudger implements Judger {
    /**
     * 最初的想法是遍历全部胡牌局面，把手牌跟胡牌局面进行比较。
     *
     * 大库检索，返回与某状态最接近的胡牌状态
     * 因为麻将各个区域之间具有独立性，所以这个问题可以分治解决。
     * 这个问题的实质是：给定一个手牌向量，在胡牌向量库中寻找与之距离最近的胡牌局面
     */
    visitNeibors(hand: number[], maxCardCount: number, state: State, patternCallback: PatternCallback) {
        const handParts = splitVector(hand);
        const pileParts = splitVector(state.a);
        const MAX_PATTERN_COUNT = 10;//每个count记录的最大pattern数

        /**
         * 每个区域中按照count划分目标pattern，
         * 每个count下面只取最相似的那些pattern。因为不同区域具有独立性，所以一个区域中最好的结果必然是全局最好的结果。
         * 所以这是一个二维pattern列表。
         * */
        const slot: Map<number, number[][]>[] = [];
        for (let partId = 0; partId < BIG.length; partId++) {
            const count2pattern = new Map<number, number[][]>();
            const countPatterns = BIG[partId].entries();
            while (1) {
                const res = countPatterns.next();
                if (res.done) break;
                const [cardCount, patterns] = res.value;
                let minSteps = MAX_STEPS;
                let goodPatterns: number[][] = [];
                for (let patternId = 0; patternId < patterns.length; patternId++) {
                    const p = patterns[patternId];
                    //handParts到p的距离
                    const d = diff(p, handParts[partId]);
                    const steps = FetchBall.atLeast(pileParts[partId], [d]);
                    if (steps < minSteps) {
                        goodPatterns = [p];
                        minSteps = steps;
                    } else if (steps === minSteps) {
                        if (goodPatterns.length < MAX_PATTERN_COUNT) {
                            goodPatterns.push(p);
                        }
                    }
                }
                count2pattern.set(cardCount, goodPatterns);
            }
            slot.push(count2pattern);
        }
        //第二阶段，寻找整体最优解
        iteratePatterns(slot, maxCardCount, patternCallback);
    }

    judge(state: State, hand: string[]): JudgeResult {
        if (hand.length % 3 !== 1) throw new Error(`手牌个数应该模三余一 ${hand.join(',')}`);
        const handVector = vectorize(hand);
        let bestPatterns: number[][] = [];
        let minSteps = MAX_STEPS;//最差的情况是把牌全部替换掉
        let total = 0;
        const MAX_CARD_COUNT = hand.length + 1;//胡牌时手中的牌数
        if ([0, 2].indexOf(MAX_CARD_COUNT % 3) === -1) {
            throw  new Error(`目标牌数错误${MAX_CARD_COUNT}`);
        }
        this.visitNeibors(handVector, MAX_CARD_COUNT, state, ((cardCount, pattern) => {
            total++;
            if (cardCount > MAX_CARD_COUNT) {
                throw  new Error(`error ${cardCount}>${MAX_CARD_COUNT}`);
            }
            if (cardCount < MAX_CARD_COUNT) return;
            const huPattern = flat(pattern);//目标牌型
            const d = diff(huPattern, handVector);
            const steps = FetchBall.atLeast(state.a, [d,]);
            //蒙特卡罗算法太慢，没法用
            // const steps = FetchBall.montecarlo(state.a, [d], 50);
            if (steps < minSteps) {
                minSteps = steps;
                bestPatterns = [huPattern];
            } else if (steps === minSteps) {
                bestPatterns.push(huPattern);
            }
        }));
        const diffList = bestPatterns.map(pattern => diff(pattern, handVector));
        const atLeast = FetchBall.atLeast(state.a, diffList);
        const targetString = PRINT.SHOW_TARGET ?
            bestPatterns.map(x => stringify(x).join(',')) : '';
        // diffList.forEach(d => {
        //     const now = FetchBall.montecarlo(state.a, [d], 50)
        //     minSteps = Math.min(minSteps, now);
        // })
        return {
            score: -minSteps,
            meta: {
                手牌: sortCards(hand).join(','),
                目标个数: bestPatterns.length,
                遍历个数: total,
                最少步数: atLeast,
                目标列表: targetString,
            }
        };
    }

    getName(): string {
        return MyJudger.name;
    }
}