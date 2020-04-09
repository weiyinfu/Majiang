"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RandomJudger_1 = require("../judger/RandomJudger");
const GreedyJudger_1 = require("../judger/GreedyJudger");
const JudgerJudger_1 = require("./JudgerJudger");
const MyJudger_1 = require("../judger/MyJudger");
const Utils_1 = require("../../util/Utils");
const SearchJudger_1 = require("../judger/SearchJudger");
const judgerList = [
    // new RandomJudger(),
    // new ConstantJudger(),
    new RandomJudger_1.ExtremeJudger(false),
    new RandomJudger_1.ExtremeJudger(true),
    new GreedyJudger_1.GreedyJudger(),
    // new PartGreedyJudger(),
    new MyJudger_1.PartSumJudger(),
    // new MyJudger(),
    new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 2, 1),
    new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 4, 1),
    new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 3, 1),
    new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 2, 3),
];
// PRINT.SHOW_RELEASE = true;
JudgerJudger_1.PRINT.SHOW_PROCESS = false;
Utils_1.init(new Date().toString());
const res = JudgerJudger_1.playSelf(judgerList, 10);
console.log(res);
