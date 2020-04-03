"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const seedrandom_1 = __importDefault(require("seedrandom"));
for (let i = 0; i < 2; i++) {
    const x = seedrandom_1.default('hello');
    console.log(x);
    console.log(x.int32());
    console.log(x.quick());
    console.log(x.double());
}
