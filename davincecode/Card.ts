import {range} from "../majiang/util/Utils";
import {compareKey} from "../majiang/util/Topk";


export function isUnknown(x: string) {
    return x === '黑未知' || x === '白未知';
}

export const MAX_ORDINAL = 23;//最大ordinal

export class Card {
    name: string = '';
    ordinal: number = -1;
    image: string = "";//utf8图画
}

class Cards {
    cardMap: { [index: string]: Card } = {};
    ordinalMap: { [index: number]: Card } = {};

    constructor() {
        const NAMES = range(12).map(x => `黑${x + 1}`)
            .concat(['黑百搭', '黑未知'])
            .concat(range(12).map(x => `白${x + 1}`))
            .concat(['白百搭', '白未知']);
        const CARDS = Array.from("🂡🂢🂣🂤🂥🂦🂧🂨🂩🂪🂫🂭🂮🂠🂱🂲🂳🂴🂵🂶🂷🂸🂹🂺🂻🂽🂾🂠");
        const cardMap: { [index: string]: Card } = {};
        const ordinalMap: { [index: number]: Card } = {};
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
            }
            cardMap[NAMES[i]] = card;
            ordinalMap[ordinal] = card;
        }
        this.cardMap = cardMap;
        this.ordinalMap = ordinalMap;
    }

    byName(name: string) {
        const card = this.cardMap[name];
        if (!card) throw new Error(`cannot find ${name}`);
        return card;
    }

    byOrdinal(index: number) {
        const card = this.ordinalMap[index];
        if (!card) throw new Error(`cannot find ${index}`);
        return card;
    }
}

//CardMap为名称映射，ordinalMap为序数映射
export const C = new Cards();

export function sortCards(cards: string[]) {
    for (let i of cards) {
        if (C.byName(i).ordinal >= 24) {
            throw new Error(`cannot sort cards ${cards.join(',')}`)
        }
    }
    cards.sort(compareKey(x => C.byName(x).ordinal));
}

export function hide(card: string) {
    //只显示颜色
    return ((C.byName(card).ordinal & 1) === 0 ? '黑' : '白') + '未知';
}

export function getCards() {
    //返回去掉百搭和未知的牌
    return Object.values(C.cardMap).map(x => x.name).filter(x => x.indexOf('百搭') === -1 && x.indexOf('未知') === -1)
}
