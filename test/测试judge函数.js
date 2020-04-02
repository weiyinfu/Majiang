"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Card_1 = require("../js/Card");
const Utils_1 = require("../js/Utils");
const Judger_1 = require("../js/Judger");
const MyJudger_1 = require("../js/ai/MyJudger");
const judger = new MyJudger_1.MyJudger();
function test0() {
    MyJudger_1.PRINT.SHOW_TARGET = true;
    const hand = ["东", "南", "南", "西", "西", "2万", "2万", "3万", "8万", "8条", "9条", "1筒", "3筒", "9筒"];
    let a = Utils_1.li(34, 4);
    for (let i of hand) {
        a[Card_1.CardMap[i].index]--;
    }
    a[1] = 0; //让南风变成0
    const state = {
        a,
        anGangCount: 0
    };
    console.log('a');
    console.log(a);
    const resp = judger.judge(state, hand);
    console.log(resp);
}
function getState(hand) {
    let a = Utils_1.li(34, 4);
    for (let i of hand) {
        a[Card_1.CardMap[i].index]--;
    }
    return {
        a,
        anGangCount: 0
    };
}
function releaseWhich(hand) {
    if (hand.length % 3 !== 2)
        throw `error length of hand`;
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
function test1() {
    MyJudger_1.PRINT.SHOW_TARGET = true;
    const handString = "中,中,中,3万,5万,6万,8万,9万,4条,6条,9条,1筒,1筒,9筒";
    const hand = handString.split(',');
    releaseWhich(hand);
}
test1();
