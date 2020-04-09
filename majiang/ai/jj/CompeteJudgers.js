"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GreedyJudger_1 = require("../judger/GreedyJudger");
const SearchJudger_1 = require("../judger/SearchJudger");
const JudgerJudger_1 = require("./JudgerJudger");
const judgers = [
    // new RandomJudger(),
    // new GreedyJudger(),
    // new PartSumJudger(),
    new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 2, 3),
    new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 2, 1),
    new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 3, 2),
    new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 4, 2),
];
JudgerJudger_1.playTogether(judgers, 20);
