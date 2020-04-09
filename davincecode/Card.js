"use strict";
var _a;
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
function buildCardMap() {
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
    return [cardMap, ordinalMap];
}
_a = buildCardMap(), exports.CardMap = _a[0], exports.ordinalMap = _a[1];
function sortCards(cards) {
    for (let i of cards) {
        if (exports.CardMap[i].ordinal >= 24) {
            throw new Error(`cannot sort cards ${cards.join(',')}`);
        }
    }
    cards.sort(Topk_1.compareKey(x => exports.CardMap[x].ordinal));
}
exports.sortCards = sortCards;
function hide(card) {
    //只显示颜色
    return ((exports.CardMap[card].ordinal & 1) === 0 ? '黑' : '白') + '未知';
}
exports.hide = hide;
function getCards() {
    //返回去掉百搭和未知的牌
    return Object.values(exports.CardMap).map(x => x.name).filter(x => x.indexOf('百搭') === -1 && x.indexOf('未知') === -1);
}
exports.getCards = getCards;
