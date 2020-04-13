import {Call} from "../DavinceCodeProtocol";
import {ll} from "../../majiang/util/Utils";
import {compareKey} from "../../majiang/util/Topk";
import {Solver} from "../Solver";
import {SimpleSolver} from "./SimpleSolver";
import {C} from "../Card";

/**
 * 达芬奇密码问题实际上是一道填空题，是一种数独的变形
 * 给定一个数独，这个数独中每行都是递增的，填出每个位置的数字
 * 在SimpleSolver的基础上进一步迭代，暴力解决这个问题
 * */
const simple = new SimpleSolver();

export class DeepSolver implements Solver {
    getAdvice(hand: string[][], badCalls: Call[]): string[][][] {
        const matrix = simple.getAdvice(hand, badCalls);
        const ma: number[][][] = ll(matrix.length);//把matrix转成数字格式
        const index: number[][] = [];//下标
        const a: number[][] = ll(matrix.length);//创建一个空表格，用于接下来的递归
        const validOptions: Set<number>[][] = ll(matrix.length);//在搜索过程中搜索到的可能值
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                index.push([i, j]);
                ma[i][j] = matrix[i][j].map(x => C.byName(x).ordinal);
                a[i][j] = -1;
                validOptions[i][j] = new Set<number>();
            }
        }
        index.sort(compareKey(([x, y]) => matrix[x][y].length))
        const used = new Set<number>();

        function can(x: number, y: number, value: number) {
            //x,y处是否可以填写value
            for (let i = y; i < a[x].length; i++) {
                if (a[x][y] !== -1) {
                    if (a[x][y] < value) {
                        return false;
                    } else {
                        break;
                    }
                }
            }
            for (let i = y; i >= 0; i--) {
                if (a[x][y] !== -1) {
                    if (a[x][y] > value) {
                        return false;
                    } else {
                        break;
                    }
                }
            }
            return true;
        }

        function go(ind: number) {
            if (ind === index.length) {
                return true;
            }
            const [x, y] = index[ind];
            let solvable = false
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

        const solvable = go(0);//在递归过程中优化option
        if (!solvable) {
            throw new Error(`no solution!`);
        }
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                matrix[i][j] = Array.from(validOptions[i][j]).map(x => C.byOrdinal(x).name);
            }
        }
        return matrix;
    }
}