"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Judger_1 = require("../Judger");
const Utils_1 = require("../../util/Utils");
const MyJudger_1 = require("../judger/MyJudger");
const Card_1 = require("../../core/Card");
function getState(hand) {
    let a = Utils_1.li(34, 4);
    for (let i of hand) {
        a[Card_1.C.byName(i).index]--;
    }
    return {
        a,
        anGangCount: 0
    };
}
function releaseWhich(hand, judger) {
    if (hand.length % 3 !== 2)
        throw new Error(`error length of hand`);
    let best = {
        score: Judger_1.MIN_SCORE,
        release: '',
    };
    const strategies = [];
    new Set(hand).forEach(h => {
        const han = hand.slice();
        Utils_1.remove(han, [h]);
        console.log(`弃牌${h}`);
        const result = judger.judge(getState(han), han);
        if (result.score > best.score) {
            best.score = result.score;
            best.release = h;
        }
        strategies.push({
            card: h,
            result: result,
        });
    });
    console.log("手牌" + hand);
    console.log('最佳决策' + JSON.stringify(best));
    strategies.sort((x, y) => x.steps - y.steps);
    console.log(JSON.stringify(strategies, null, 1));
}
MyJudger_1.PRINT.SHOW_TARGET = true;
const handString = "2万,3万,4万,2筒,2筒,2筒,5筒,6筒,7筒,8筒,8筒,9筒,9筒,东";
const hand = handString.split(',');
const j = new MyJudger_1.PartSumJudger();
// const jj = new SearchJudger(j, 3);
// releaseWhich(hand, j);
const had = hand.slice(13);
const res = j.judge(getState(hand), had);
console.log(res);
console.log('==========');
// releaseWhich(hand, jj);
