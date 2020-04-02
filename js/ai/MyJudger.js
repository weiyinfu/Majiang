"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
const Card_1 = require("../Card");
const TableHu_1 = require("../TableHu");
const MAX_STEPS = 100000; //到达胜利的步数
function buildReverseIndex() {
    //10个分区，每个分区都有可能有解的局面
    //为每个分区建立 牌的张数=>patterns倒排索引
    //字牌pattern列表
    function buildIndex(patterns) {
        let cardCount2pattern = new Map();
        patterns.forEach(i => {
            const s = i.reduce((o, n) => o + n, 0);
            let now = cardCount2pattern.get(s);
            now ? now.push(i) : cardCount2pattern.set(s, [i]);
        });
        return cardCount2pattern;
    }
    const zi = buildIndex([[0], [2], [3]]);
    const shuzi = buildIndex(TableHu_1.shuziPai);
    return Utils_1.li(7, zi).concat(Utils_1.li(3, shuzi));
}
exports.buildReverseIndex = buildReverseIndex;
exports.BIG = buildReverseIndex();
//日志相关的开关
exports.PRINT = {
    SHOW_TARGET: false,
}; //是否打印judge结果
function vectorize(a) {
    //把牌列表转换成34维的向量
    const v = Utils_1.li(34, 0);
    a.forEach(x => {
        const card = Card_1.CardMap[x];
        if (!card)
            throw `no card ${x}`;
        if (card.index < 0 || card.index >= 34) {
            throw `error card ${x}`;
        }
        v[card.index]++;
    });
    return v;
}
exports.vectorize = vectorize;
function stringify(a) {
    //把牌向量转换成字符串数组
    if (a.length !== 34)
        throw 'error';
    let cards = [];
    for (let i = 0; i < a.length; i++) {
        cards = cards.concat(Utils_1.li(a[i], Card_1.NAMES[i]));
    }
    return cards;
}
exports.stringify = stringify;
function diff(target, now) {
    //计算差牌，从now到target需要新摸到哪些牌
    if (target.length !== now.length)
        throw 'error';
    const c = new Array(target.length);
    for (let i = 0; i < target.length; i++) {
        c[i] = Math.max(target[i] - now[i], 0);
    }
    return c;
}
class FetchBall {
    //多目标不放回不弃牌摸球问题
    static atLeast(a, target) {
        //最少摸球次数，直接返回target中元素个数
        let minSteps = MAX_STEPS;
        for (let t of target) {
            let s = 0;
            for (let i = 0; i < a.length; i++) {
                if (t[i] > a[i]) {
                    s = MAX_STEPS;
                    break;
                } //不可能完成
                s += t[i];
            }
            minSteps = Math.min(minSteps, s);
        }
        return minSteps;
    }
    static montecarlo(a, target, caseCount) {
        //蒙特卡罗法解决摸球问题，这个算法必须足够高效
        const ballCount = a.reduce((o, n) => o + n, 0);
        const times = Utils_1.li(ballCount + 1, 0); //摸球的次数应该比ballCount大1
        let box = [];
        for (let i = 0; i < a.length; i++)
            box = box.concat(Utils_1.li(a[i], i));
        const TARGET_LEFT = target.map(pattern => a.length - Utils_1.getCount(pattern, 0));
        for (let i of TARGET_LEFT)
            if (i === 0)
                return 0;
        for (let cas = 0; cas < caseCount; cas++) {
            const targetLeft = TARGET_LEFT.slice();
            const ta = Utils_1.deepcopy(target);
            over: for (let i = 0; i < box.length; i++) {
                //随机选择一个球
                Utils_1.swap(box, i, Utils_1.randInt(i, box.length));
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
        for (let i = 0; i < times.length; i++)
            expect += i * times[i] / caseCount;
        return expect;
    }
    static accurate(a, target) {
        //基于递推法精确解决多目标摸球问题
        const dic = {};
        function getKey(a, target) {
            return a.join(',') + ':' + target.slice().sort().map(x => x.join(',')).join(';');
        }
        function go(a, target) {
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
            let total = a.reduce((o, n) => o + n, 0);
            let ans = 1;
            for (let i = 0; i < a.length; i++) {
                if (a[i]) {
                    const p = a[i] / total;
                    a[i]--;
                    const updated = [];
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
    static atMost(a, target) {
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
exports.FetchBall = FetchBall;
function iteratePatterns(a, maxCardCount, patternHandler) {
    /**
     * 计算a中的笛卡尔积
     * 元素的个数不能超过maxCardCount
     * 调用patternHandler来处理每个pattern
     * */
    const pattern = Utils_1.li(a.length, []);
    function go(ind, cardCount) {
        if (cardCount > maxCardCount)
            return;
        if (ind === a.length) {
            patternHandler(cardCount, pattern);
            return;
        }
        a[ind].forEach((patterns, partCardCount) => {
            //如果已经有了将，那么不能再有将了
            if (cardCount % 3 == 2) {
                if (partCardCount % 3 == 2)
                    return;
            }
            for (let p of patterns) {
                pattern[ind] = p;
                go(ind + 1, cardCount + partCardCount);
            }
        });
    }
    go(0, 0);
}
exports.iteratePatterns = iteratePatterns;
class PatternSearcher {
    /*
    * 大库检索，返回与某状态最接近的胡牌状态
    * 因为麻将各个区域之间具有独立性，所以这个问题可以分治解决。
    * 这个问题的实质是：给定一个手牌向量，在胡牌向量库中寻找与之距离最近的胡牌局面
     */
    static visitNeibors(hand, maxCardCount, state, patternCallback) {
        const handParts = [];
        const pileParts = [];
        for (let i = 0; i < 7; i++) {
            //字牌
            handParts.push([hand[i]]);
            pileParts.push([state.a[i]]);
        }
        for (let i = 0; i < 3; i++) {
            //数字牌
            const beg = 7 + i * 9, end = 7 + (i + 1) * 9;
            handParts.push(hand.slice(beg, end));
            pileParts.push(state.a.slice(beg, end));
        }
        const MAX_PATTERN_COUNT = 10; //每个count记录的最大pattern数
        /**
         * 每个区域中按照count划分目标pattern，
         * 每个count下面只取最相似的那些pattern。因为不同区域具有独立性，所以一个区域中最好的结果必然是全局最好的结果。
         * 所以这是一个二维pattern列表。
         * */
        //前7个每个只有一种，所以直接不用搜索了
        const slot = [];
        for (let i = 0; i < exports.BIG.length; i++) {
            const count2pattern = new Map();
            exports.BIG[i].forEach((patterns, cardCount) => {
                let minSteps = MAX_STEPS;
                let goodPatterns = [];
                patterns.forEach(p => {
                    const d = diff(p, handParts[i]);
                    const steps = FetchBall.atLeast(pileParts[i], [d]);
                    if (steps < minSteps) {
                        goodPatterns = [p];
                        minSteps = steps;
                    }
                    else if (steps === minSteps) {
                        if (goodPatterns.length < MAX_PATTERN_COUNT) {
                            goodPatterns.push(p);
                        }
                    }
                });
                count2pattern.set(cardCount, goodPatterns);
            });
            slot.push(count2pattern);
        }
        //第二阶段，寻找整体最优解
        iteratePatterns(slot, maxCardCount, patternCallback);
    }
}
exports.PatternSearcher = PatternSearcher;
class MyJudger {
    judge(state, hand) {
        //暗杠会造成局面数爆炸，所以暂时不考虑暗杠，暗杠需要猜牌
        //TODO：此处可以优化，别人暗杠的牌可以进行猜测别人暗杠的是什么牌
        //首先把牌按照10个区域放好，逐个区域处理
        const handVector = vectorize(hand);
        let bestPatterns = [];
        let minSteps = MAX_STEPS; //最差的情况是把牌全部替换掉
        let total = 0;
        const MAX_CARD_COUNT = hand.length + 1; //胡牌时手中的牌数
        if ([0, 2].indexOf(MAX_CARD_COUNT % 3) === -1) {
            throw `目标牌数错误${MAX_CARD_COUNT}`;
        }
        PatternSearcher.visitNeibors(handVector, MAX_CARD_COUNT, state, ((cardCount, pattern) => {
            total++;
            if (cardCount > MAX_CARD_COUNT) {
                throw 'error';
            }
            if (cardCount < MAX_CARD_COUNT)
                return;
            const huPattern = Utils_1.flat(pattern); //目标牌型
            const d = diff(huPattern, handVector);
            const steps = FetchBall.atLeast(state.a, [d,]);
            //蒙特卡罗算法太慢
            // const steps = FetchBall.montecarlo(state.a, [d], 50);
            if (steps < minSteps) {
                minSteps = steps;
                bestPatterns = [huPattern];
            }
            else if (steps === minSteps) {
                bestPatterns.push(huPattern);
            }
        }));
        const diffList = bestPatterns.map(pattern => diff(pattern, handVector));
        const atLeast = FetchBall.atLeast(state.a, diffList);
        const targetString = exports.PRINT.SHOW_TARGET ?
            bestPatterns.map(x => stringify(x).join(',')) : '';
        // diffList.forEach(d => {
        //     const now = FetchBall.montecarlo(state.a, [d], 50)
        //     minSteps = Math.min(minSteps, now);
        // })
        return {
            score: -minSteps,
            meta: {
                手牌: Card_1.sortCards(hand).join(','),
                目标个数: bestPatterns.length,
                遍历个数: total,
                最少步数: atLeast,
                目标列表: targetString,
            }
        };
    }
}
exports.MyJudger = MyJudger;
