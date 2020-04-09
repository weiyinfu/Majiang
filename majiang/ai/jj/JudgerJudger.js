"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Judger评判器，评价一个Judger的好坏，用于迭代麻将judge算法
 *
 * 本程序设计了两类评判Judger的方法：
 * 1. 把初始牌放在judger手中，重复调用摸牌+弃牌过程直到胡牌，期望胡牌步数越少，
 * judger越强。这种方法的好处在于，可以对每个Judger打出一个分数，多个Judger可以
 * 并行打分。缺点在于，这种方法评分与实际有脱节，实际中有吃碰杠等操作，是多个人参与的
 * 游戏。
 * 2. 把若干个Judger聚在一起，让它们一起打麻将，最后比较胜率。这种方法每次参与比赛的Judger
 * 个数不能太多。这种方法的好处在于它能够模拟真实对局，评估时考虑了“吃碰杠”等多种操作。
 * */
const Judger_1 = require("../Judger");
const Card_1 = require("../../core/Card");
const Utils_1 = require("../../util/Utils");
const MyJudger_1 = require("../judger/MyJudger");
const MajiangServer_1 = require("../../core/MajiangServer");
const Ai_1 = require("../Ai");
const Handler_1 = require("../../core/Handler");
const Topk_1 = require("../../util/Topk");
const Pile_1 = require("../../core/Pile");
const BestHu_1 = require("../../hu/BestHu");
exports.PRINT = {
    SHOW_PROCESS: true,
    SHOW_RELEASE: false,
};
function generateProblems(n) {
    return Utils_1.range(n).map(i => {
        const cards = Card_1.getCards();
        Utils_1.shuffle(cards);
        return cards;
    });
}
exports.generateProblems = generateProblems;
function judgeJudger(judger, problems, HandCardCount) {
    //对judger执行caseCount次评估，计算平均需要多少步才能结束游戏
    if (HandCardCount % 3 !== 1) {
        throw new Error(`手牌数必须模三余1`);
    }
    const times = [];
    const name = judger.getName();
    for (let cas = 0; cas < problems.length; cas++) {
        const pile = problems[cas];
        const hand = pile.splice(0, HandCardCount);
        Card_1.sortCards(hand);
        let fetchCount = 0;
        while (pile.length) {
            //一直摸牌，直到牌堆中没牌或者胡牌为止
            if (exports.PRINT.SHOW_PROCESS) {
                console.log(`实验${cas} 摸${fetchCount} 手${hand.length} 堆${pile.length} ${hand.join(',')}`);
            }
            const card = pile.pop();
            hand.push(card);
            Card_1.sortCards(hand);
            fetchCount++;
            if (BestHu_1.BestHu.hu(hand)) {
                if (exports.PRINT.SHOW_PROCESS) {
                    console.log(`摸到:${card},胡牌了`);
                }
                break;
            }
            const state = {
                a: MyJudger_1.vectorize(pile),
                anGangCount: 0
            };
            const best = {
                score: Judger_1.MIN_SCORE,
                release: '',
            };
            new Set(hand).forEach(release => {
                const han = hand.slice();
                han.splice(hand.indexOf(release), 1);
                const result = judger.judge(state, han);
                if (result.score > best.score) {
                    best.score = result.score;
                    best.release = release;
                }
                if (exports.PRINT.SHOW_RELEASE) {
                    console.log(`if release ${release},then ${result.score}`);
                    console.log(result.meta);
                }
            });
            if (exports.PRINT.SHOW_PROCESS) {
                console.log(`摸到:${card} 弃牌:${best.release}`);
            }
            Utils_1.remove(hand, [best.release]);
        }
        times.push(fetchCount);
        console.log(`${name}的第${cas}次实验，摸了${fetchCount}次游戏结束\n==============`);
    }
    //计算期望步数
    return times.reduce((o, n) => o + n) / times.length;
}
exports.judgeJudger = judgeJudger;
function playSelf(judgers, caseCount) {
    //比较各个Judger
    exports.PRINT.SHOW_RELEASE = false;
    exports.PRINT.SHOW_PROCESS = false;
    const table = [];
    exports.PRINT.SHOW_PROCESS = false;
    const problems = generateProblems(caseCount);
    for (let i = 0; i < judgers.length; i++) {
        const j = judgers[i];
        const begTime = new Date().getTime();
        const res = judgeJudger(j, Utils_1.deepcopy(problems), 10);
        const endTime = new Date().getTime();
        table.push({
            judger: j.getName(),
            期望胡牌步数: parseFloat(res.toFixed(3)),
            用时: endTime - begTime,
        });
    }
    table.sort(Topk_1.compareKey(x => x['期望胡牌步数'] * 1e7 + x['用时']));
    console.table(table);
}
exports.playSelf = playSelf;
function playTogether(judgers, caseCount) {
    //让多个Judger同台竞技，比较各个judger的胜率
    exports.PRINT.SHOW_PROCESS = false;
    exports.PRINT.SHOW_RELEASE = false;
    function f() {
        return __awaiter(this, void 0, void 0, function* () {
            //让若干个Judger组个局
            const ais = judgers.map(j => new Handler_1.ReverseHandler(new Ai_1.Ai(j)));
            const server = new MajiangServer_1.MajiangServer(new Pile_1.RandomPile(new Date().toString()), ais, BestHu_1.BestHu);
            const winnerMap = new Map();
            for (let cas = 0; cas < caseCount; cas++) {
                const winner = yield server.doStart();
                const winned = winnerMap.get(winner);
                winnerMap.set(winner, winned ? winned + 1 : 1);
                console.log(`第${cas}局，胜者${judgers[winner].getName()}`);
            }
            const winTable = Array.from(winnerMap.entries()).sort(Topk_1.compareKey(x => -x[1])).map((p) => {
                return {
                    Id: p[0],
                    Name: p[0] === -1 ? '无' : judgers[p[0]].getName(),
                    胜利次数: p[1],
                };
            });
            console.log(`一共进行了${caseCount}场游戏`);
            console.table(winTable);
        });
    }
    f().then(() => {
        console.log('over');
    });
}
exports.playTogether = playTogether;
