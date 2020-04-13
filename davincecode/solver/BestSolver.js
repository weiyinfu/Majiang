"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DeepSolver_1 = require("./DeepSolver");
const SimpleSolver_1 = require("./SimpleSolver");
exports.simpleSolver = new SimpleSolver_1.SimpleSolver();
exports.deepSolver = new DeepSolver_1.DeepSolver();
exports.bestSolver = exports.simpleSolver;
