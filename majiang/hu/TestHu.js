"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigTableHu_1 = require("./BigTableHu");
/**
 * 用于测试胡牌算法正确性
 * */
// const x = new NumberBigTableHu()//136
// const x=new StringBigTableHu()//
const x = new BigTableHu_1.SetBigTableHu(); //
const hand = '西,西,西,中,中'.split(',');
const ans = x.hu(hand);
console.log(ans);
