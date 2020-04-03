"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GreedyJudger_1 = require("./GreedyJudger");
const SearchJudger_1 = require("./SearchJudger");
/**
 * Ai总是调用这个文件
 * */
const judger = new SearchJudger_1.SearchJudger(new GreedyJudger_1.GreedyJudger(), 2);
class JudgerForAi {
    judge(state, hand) {
        return judger.judge(state, hand);
    }
}
exports.JudgerForAi = JudgerForAi;
