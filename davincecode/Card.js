"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../majiang/util/Utils");
const Topk_1 = require("../majiang/util/Topk");
function isUnknown(x) {
    return x === '黑未知' || x === '白未知';
}
exports.isUnknown = isUnknown;
exports.MAX_ORDINAL = 23; //最大ordinal
class Card {
    constructor() {
        this.name = '';
        this.ordinal = -1;
        this.image = ""; //utf8图画
    }
}
exports.Card = Card;
class Cards {
    constructor() {
        this.cardMap = {};
        this.ordinalMap = {};
        const NAMES = Utils_1.range(12).map(x => `黑${x + 1}`)
            .concat(['黑百搭', '黑未知'])
            .concat(Utils_1.range(12).map(x => `白${x + 1}`))
            .concat(['白百搭', '白未知']);
        const CARDS = Array.from("🂡🂢🂣🂤🂥🂦🂧🂨🂩🂪🂫🂭🂮🂠🂱🂲🂳🂴🂵🂶🂷🂸🂹🂺🂻🂽🂾🂠");
        const cardMap = {};
        const ordinalMap = {};
        const total = 28;
        if (NAMES.length !== CARDS.length || NAMES.length !== total) {
            throw new Error(`error length`);
        }
        for (let i = 0; i < total; i++) {
            const ordinal = i < 14 ? i * 2 : (i - 14) * 2 + 1;
            const card = {
                name: NAMES[i],
                image: CARDS[i],
                ordinal,
            };
            cardMap[NAMES[i]] = card;
            ordinalMap[ordinal] = card;
        }
        this.cardMap = cardMap;
        this.ordinalMap = ordinalMap;
    }
    byName(name) {
        const card = this.cardMap[name];
        if (!card)
            throw new Error(`cannot find ${name}`);
        return card;
    }
    byOrdinal(index) {
        const card = this.ordinalMap[index];
        if (!card)
            throw new Error(`cannot find ${index}`);
        return card;
    }
}
//CardMap为名称映射，ordinalMap为序数映射
exports.C = new Cards();
function sortCards(cards) {
    for (let i of cards) {
        if (exports.C.byName(i).ordinal >= 24) {
            throw new Error(`cannot sort cards ${cards.join(',')}`);
        }
    }
    cards.sort(Topk_1.compareKey(x => exports.C.byName(x).ordinal));
}
exports.sortCards = sortCards;
function hide(card) {
    //只显示颜色
    return ((exports.C.byName(card).ordinal & 1) === 0 ? '黑' : '白') + '未知';
}
exports.hide = hide;
function getCards() {
    //返回去掉百搭和未知的牌
    return Object.values(exports.C.cardMap).map(x => x.name).filter(x => x.indexOf('百搭') === -1 && x.indexOf('未知') === -1);
}
exports.getCards = getCards;
