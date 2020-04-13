"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../majiang/util/Utils");
const Topk_1 = require("../../majiang/util/Topk");
const SimpleSolver_1 = require("./SimpleSolver");
const Card_1 = require("../Card");
/**
 * 达芬奇密码问题实际上是一道填空题，是一种数独的变形
 * 给定一个数独，这个数独中每行都是递增的，填出每个位置的数字
 * 在SimpleSolver的基础上进一步迭代，暴力解决这个问题
 * */
const simple = new SimpleSolver_1.SimpleSolver();
class DeepSolver {
    getAdvice(hand, badCalls) {
        const matrix = simple.getAdvice(hand, badCalls);
        const ma = Utils_1.ll(matrix.length); //把matrix转成数字格式
        const index = []; //下标
        const a = Utils_1.ll(matrix.length); //创建一个空表格，用于接下来的递归
        const validOptions = Utils_1.ll(matrix.length); //在搜索过程中搜索到的可能值
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                index.push([i, j]);
                ma[i][j] = matrix[i][j].map(x => Card_1.C.byName(x).ordinal);
                a[i][j] = -1;
                validOptions[i][j] = new Set();
            }
        }
        index.sort(Topk_1.compareKey(([x, y]) => matrix[x][y].length));
        const used = new Set();
        function can(x, y, value) {
            //x,y处是否可以填写value
            for (let i = y; i < a[x].length; i++) {
                if (a[x][y] !== -1) {
                    if (a[x][y] < value) {
                        return false;
                    }
                    else {
                        break;
                    }
                }
            }
            for (let i = y; i >= 0; i--) {
                if (a[x][y] !== -1) {
                    if (a[x][y] > value) {
                        return false;
                    }
                    else {
                        break;
                    }
                }
            }
            return true;
        }
        function go(ind) {
            if (ind === index.length) {
                return true;
            }
            const [x, y] = index[ind];
            let solvable = false;
            for (let i of ma[x][y]) {
                //对于每个选项
                if (!used.has(i) && can(x, y, i)) {
                    used.add(i);
                    a[x][y] = i;
                    const res = go(ind + 1);
                    a[x][y] = -1;
                    used.delete(i);
                    if (res) {
                        solvable = true;
                        validOptions[x][y].add(i);
                    }
                }
            }
            return solvable;
        }
        const solvable = go(0); //在递归过程中优化option
        if (!solvable) {
            throw new Error(`no solution!`);
        }
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                matrix[i][j] = Array.from(validOptions[i][j]).map(x => Card_1.C.byOrdinal(x).name);
            }
        }
        return matrix;
    }
}
exports.DeepSolver = DeepSolver;
