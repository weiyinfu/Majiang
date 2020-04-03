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
import {Judger, MIN_SCORE, State} from "./Judger";
import {getCards, hu, sortCards} from "./Card";
import {deepcopy, range, remove, shuffle} from "./Utils";
import {vectorize} from "./ai/MyJudger";
import {RandomJudger} from "./ai/RandomJudger";
import {GreedyJudger} from "./ai/GreedyJudger";
import {SearchJudger} from "./ai/SearchJudger";
import {MajiangServer} from "./MajiangServer";
import {Ai} from "./Ai";
import {ReverseHandler} from "./Handler";
import {compareKey} from "./Topk";

const PRINT = {
    SHOW_PROCESS: true,//显示打牌过程
    SHOW_RELEASE: false,//显示弃牌及对应的分数
}

function generateProblems(n: number): string[][] {
    return range(n).map(i => {
        const cards = getCards();
        shuffle(cards);
        return cards;
    })
}

function judgeJudger(judger: Judger, problems: string[][], HandCardCount: number) {
    //对judger执行caseCount次评估，计算平均需要多少步才能结束游戏
    if (HandCardCount % 3 !== 1) {
        throw new Error(`手牌数必须模三余1`);
    }
    const times: number[] = []
    for (let cas = 0; cas < problems.length; cas++) {
        const pile = problems[cas];
        const hand = pile.splice(0, HandCardCount);
        sortCards(hand);
        let fetchCount = 0;
        while (pile.length) {
            //一直摸牌，直到牌堆中没牌或者胡牌为止
            if (PRINT.SHOW_PROCESS) {
                console.log(`实验${cas} 摸${fetchCount} 手${hand.length} 堆${pile.length} ${hand.join(',')}`);
            }
            const card = <string>pile.pop();
            hand.push(card);
            sortCards(hand);
            fetchCount++;
            if (hu(hand)) {
                if (PRINT.SHOW_PROCESS) {
                    console.log(`摸到:${card},胡牌了`);
                }
                break;
            }
            const state: State = {
                a: vectorize(pile),
                anGangCount: 0
            }
            const best = {
                score: MIN_SCORE,
                release: '',
            }
            new Set(hand).forEach(release => {
                const han = hand.slice();
                han.splice(hand.indexOf(release), 1);
                const result = judger.judge(state, han);
                if (result.score > best.score) {
                    best.score = result.score;
                    best.release = release;
                }
                if (PRINT.SHOW_RELEASE) {
                    console.log(`if release ${release},then ${result.score}`);
                }
            });
            if (PRINT.SHOW_PROCESS) {
                console.log(`摸到:${card} 弃牌:${best.release}`);
            }
            remove(hand, [best.release]);
        }
        times.push(fetchCount);
        console.log(`第${cas}次实验，摸了${fetchCount}次游戏结束\n==============`);
    }
    //计算期望步数
    return times.reduce((o, n) => o + n) / times.length;
}

function compareJudgers() {
    //比较各个Judger
    PRINT.SHOW_RELEASE = false;
    PRINT.SHOW_PROCESS = false;
    const judgerList = [
        new RandomJudger(),
        new GreedyJudger(),
        // new MyJudger(),
        new SearchJudger(new GreedyJudger(), 2),
        new SearchJudger(new GreedyJudger(), 3),
    ];
    const table: any[] = []
    PRINT.SHOW_PROCESS = false;
    const problems = generateProblems(10);
    judgerList.forEach(j => {
        const begTime = new Date().getTime();
        const res = judgeJudger(j, deepcopy(problems), 10);
        const endTime = new Date().getTime();
        table.push({
            judger: j.constructor.name,
            期望胡牌步数: res.toFixed(3),
            用时: endTime - begTime,
        })
    })
    console.table(table)
}

function competeJudgers(caseCount: number) {
    //让多个Judger同台竞技，比较各个judger的胜率
    PRINT.SHOW_PROCESS = false;
    PRINT.SHOW_RELEASE = false;

    async function f() {
        //让若干个Judger组个局
        const judgers = [
            new RandomJudger(),
            new GreedyJudger(),
            new SearchJudger(new GreedyJudger(), 2),
            new SearchJudger(new GreedyJudger(), 3),
        ];
        const ais = judgers.map(j => new ReverseHandler(new Ai(j)));
        const server = new MajiangServer();
        const winnerMap: Map<number, number> = new Map<number, number>();
        for (let cas = 0; cas < caseCount; cas++) {
            const winner = await server.newGame(ais);
            const winned = winnerMap.get(winner);
            winnerMap.set(winner, winned ? winned + 1 : 1);
            console.log(`第${cas}局，胜者${winner}`);
        }
        const winTable = Array.from(winnerMap.entries()).sort(compareKey(x => -x[1])).map((p) => {
            return {
                JudgerId: p[0],
                JudgerName: p[0] === -1 ? '无' : judgers[p[0]].constructor.name,
                胜利次数: p[1],
            }
        });
        console.log(`一共进行了${caseCount}场游戏`);
        console.table(winTable);
    }

    f().then(() => {
        console.log('over')
    })
}

function TestOne() {
    const jj = new SearchJudger(new GreedyJudger(), 2);
    // const jj = new GreedyJudger();
    PRINT.SHOW_RELEASE = false;
    PRINT.SHOW_PROCESS = true;
    const res = judgeJudger(jj, generateProblems(10), 13);
    console.log(`期望摸牌次数${res}`)
}

// TestOne();
// compareJudgers();
competeJudgers(30)
