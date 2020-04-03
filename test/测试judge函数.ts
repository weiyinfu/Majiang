import {CardMap} from "../js/Card";
import {li, remove} from "../js/Utils";
import {Judger, MIN_SCORE, State} from "../js/Judger";
import {PRINT} from "../js/ai/MyJudger";
import {GreedyJudger} from "../js/ai/GreedyJudger";
import {SearchJudger} from "../js/ai/SearchJudger";


function test0(judger: Judger) {
    PRINT.SHOW_TARGET = true;
    const hand = ["东", "南", "南", "西", "西", "2万", "2万", "3万", "8万", "8条", "9条", "1筒", "3筒", "9筒"]

    let a: number[] = li(34, 4)
    for (let i of hand) {
        a[CardMap[i].index]--;
    }
    a[1] = 0;//让南风变成0
    const state: State = {
        a,
        anGangCount: 0
    }
    console.log('a')
    console.log(a)

    const resp = judger.judge(state, hand)
    console.log(resp)

}

function getState(hand: string[]): State {
    let a: number[] = li(34, 4)
    for (let i of hand) {
        a[CardMap[i].index]--;
    }
    return {
        a,
        anGangCount: 0
    }
}

function releaseWhich(hand: string[], judger: Judger) {
    if (hand.length % 3 !== 2) throw new Error(`error length of hand`);
    let best = {
        score: MIN_SCORE,
        release: '',
    }
    const strategies: any[] = []
    new Set(hand).forEach(h => {
        const han = hand.slice();
        remove(han, [h]);
        console.log(`弃牌${h}`);
        const result = judger.judge(getState(han), han);
        if (result.score > best.score) {
            best.score = result.score;
            best.release = h;
        }
        strategies.push({
            card: h,
            result: result,
        })
    })
    console.log("手牌" + hand)
    console.log('最佳决策' + JSON.stringify(best))
    strategies.sort((x, y) => x.steps - y.steps)
    console.log(JSON.stringify(strategies, null, 1))
}

function test1() {
    PRINT.SHOW_TARGET = true;
    const handString = "2万,3万,4万,2筒,2筒,2筒,5筒,6筒,7筒,8筒,8筒,9筒,9筒,东";
    const hand = handString.split(',');
    const j = new GreedyJudger();
    const jj = new SearchJudger(j, 3);
    releaseWhich(hand, j);
    console.log('==========')
    releaseWhich(hand, jj);
}

test1();