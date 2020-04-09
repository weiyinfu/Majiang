"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GreedyJudger_1 = require("./GreedyJudger");
const SearchJudger_1 = require("./SearchJudger");
/**
 * Ai总是调用这个文件
 * */
const judger = new SearchJudger_1.SearchJudger(new GreedyJudger_1.PartGreedyJudger(), 3, 1);
class BestJudger {
    judge(state, hand) {
        return judger.judge(state, hand);
    }
    getName() {
        return BestJudger.name;
    }
}
exports.BestJudger = BestJudger;
