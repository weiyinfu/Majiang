import {Judger, MIN_SCORE, State} from "../Judger";
import {li, remove} from "../../util/Utils";
import {PartSumJudger, PRINT} from "../judger/MyJudger";
import {C} from "../../core/Card";

function getState(hand: string[]): State {
    let a: number[] = li(34, 4)
    for (let i of hand) {
        a[C.byName(i).index]--;
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

PRINT.SHOW_TARGET = true;
const handString = "2万,3万,4万,2筒,2筒,2筒,5筒,6筒,7筒,8筒,8筒,9筒,9筒,东";
const hand = handString.split(',');
const j = new PartSumJudger();
// const jj = new SearchJudger(j, 3);
// releaseWhich(hand, j);
const had = hand.slice(13)
const res = j.judge(getState(hand), had);
console.log(res)
console.log('==========')
// releaseWhich(hand, jj);
