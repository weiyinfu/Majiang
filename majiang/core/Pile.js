"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../util/Utils");
const Card_1 = require("./Card");
class RandomPile {
    constructor(seed) {
        //每次开局都设置一个随机数，用于记录整个游戏状态，便于别人反馈bug。一个游戏就是一个int
        this.seed = seed;
        Utils_1.init(seed);
        this.pile = Card_1.getCards();
        Utils_1.shuffle(this.pile);
        this.index = 0;
    }
    getOne() {
        if (this.index === this.pile.length)
            return "";
        return this.pile[this.index++];
    }
    getCard() {
        return new Promise(resolve => {
            resolve(this.getOne());
        });
    }
    getMany(count) {
        return new Promise(resolve => {
            const ans = [];
            for (let i = 0; i < count; i++) {
                ans.push(this.getOne());
            }
            resolve(ans);
        });
    }
}
exports.RandomPile = RandomPile;
