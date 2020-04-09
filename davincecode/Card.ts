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

function buildCardMap() {
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
    return [cardMap, ordinalMap];
}

export const [CardMap, ordinalMap] = buildCardMap()

export function sortCards(cards: string[]) {
    for (let i of cards) {
        if (CardMap[i].ordinal >= 24) {
            throw new Error(`cannot sort cards ${cards.join(',')}`)
        }
    }
    cards.sort(compareKey(x => CardMap[x].ordinal));
}

export function hide(card: string) {
    //只显示颜色
    return ((CardMap[card].ordinal & 1) === 0 ? '黑' : '白') + '未知';
}

export function getCards() {
    //返回去掉百搭和未知的牌
    return Object.values(CardMap).map(x => x.name).filter(x => x.indexOf('百搭') === -1 && x.indexOf('未知') === -1)
}
