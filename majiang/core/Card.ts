import {range} from "../util/Utils";
import {compareKey} from "../util/Topk";

//所有的麻将字符
export const Majiang: string[] = Array.from('🀀🀁🀂🀃🀄🀅🀆🀇🀈🀉🀊🀋🀌🀍🀎🀏🀐🀑🀒🀓🀔🀕🀖🀗🀘🀙🀚🀛🀜🀝🀞🀟🀠🀡🀢🀣🀤🀥🀦🀧🀨🀩🀪🀫');


function buildNames() {
    //构建麻将名称列表
    let names: string[] = Array.from("东南西北中发白");
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 9; j++) {
            names.push((j + 1) + "万条筒"[i]);
        }
    }
    names = names.concat("梅 兰 竹 菊 春 夏 秋 冬 百搭 未知".split(/\s+/));
    return names;
}

export const NAMES = buildNames();
export let Sounds: string[] = NAMES.slice(0, 7 + 3 * 9);//花牌没有声音
export const UNKNOWN: string = NAMES[NAMES.length - 1];//未知的那张牌

export class Card {
    color: string = "";//麻将的颜色，只用于UI显示
    image: string = "";//麻将的UTF8字符，只用于UI显示
    sound: string = "";//麻将的声音，只用于UI显示
    name: string = "";//麻将的名称
    part: number = 0;//麻将所属于的区域编号
    ordinal: number = 0;//麻将牌在其区域内的序号
    index: number = 0;//麻将的下标，在MAJIANG这个字符串中的下标
    sparseIndex: number = 0;//稀疏下标，取值为part*100+ordinal，稀疏下标的作用是快速判断连子，它是part和ordinal的组合
}

class GetCard {
    sparseIndex: Map<number, Card>;
    nameMap: Map<string, Card>;
    cardList: Card[];
    indexMap: Map<number, Card>;

    constructor() {
        this.sparseIndex = new Map<number, Card>();
        this.indexMap = new Map<number, Card>();
        [this.cardList, this.nameMap] = this.getCards();
        this.cardList.forEach(card => {
            this.sparseIndex.set(card.sparseIndex, card);
            this.indexMap.set(card.index, card);
        })
    }

    private getCards(): [Card[], Map<string, Card>] {
        const cards: Card[] = [];
        const nameMap = new Map<string, Card>();
        for (let i = 0; i < Majiang.length; i++) {
            cards.push({
                color: 'black',
                image: Majiang[i],
                name: NAMES[i],
                index: i,
                part: -1,
                ordinal: -1,
                sound: NAMES[i],
                sparseIndex: -1,
            });
            nameMap.set(cards[i].name, cards[i]);
        }
        //一共十个分区：东西南北中发白，万筒条。分区用于判断顺子
        for (let i = 0; i < 7; i++) {
            cards[i].part = i;
            cards[i].ordinal = 0;
        }
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 9; j++) {
                cards[i * 9 + j + 7].part = i + 7;
                cards[i * 9 + j + 7].ordinal = j;
            }
        }
        //利用sparseIndex可以避免区分区域而直接判断连子，不同区域不可能形成连子
        for (let i = 0; i < 7 + 3 * 9; i++) {
            cards[i].sparseIndex = cards[i].part * 100 + cards[i].ordinal;
        }
        //麻将字符和麻将颜色的映射，每种麻将都有特定的颜色
        const colorMap: { [index: string]: string[] } = {
            blue: Array.from('东南西北白').concat(range(9).map(x => `${x + 1}万`)),
            red: Array.from('中').concat(range(9).map(x => `${x + 1}筒`)),
            green: Array.from('发').concat(range(9).map(x => `${x + 1}条`)),
        };
        for (let color in colorMap) {
            for (let name of colorMap[color]) {
                (nameMap.get(name) as Card).color = color;
            }
        }
        return [cards, nameMap];
    }

    bySparseIndex(sparseIndex: number): Card {
        const card = this.sparseIndex.get(sparseIndex);
        if (!card) throw new Error(`cannot find card with sparseIndex=${sparseIndex}`);
        return card;
    }

    byName(name: string): Card {
        const res = this.nameMap.get(name);
        if (!res) throw new Error(`cannot find card with name= ${name}`);
        return res as Card;
    }

    byIndex(index: number): Card {
        const res = this.indexMap.get(index);
        if (!res) throw new Error(`cannot find Card with index=${index}`);
        return res as Card;
    }

    byPartOrdinal(part: number, ordinal: number): Card {
        //根据区域和序数获取麻将
        if (part < 7) {
            if (ordinal != 0) {
                throw new Error(`error card ordinal error ordinal=${ordinal} part=${part}`);
            }
            return this.byIndex(part);
        } else {
            if (!(ordinal >= 0 && ordinal < 9)) {
                throw  new Error(`error ordinal error :ordinal=${ordinal} part=${part}`);
            }
            const ind = (part - 7) * 9 + 7 + ordinal;
            return this.byIndex(ind);
        }
    }
}

export const C = new GetCard();

export function sortCards(a: string[]) {
    //对麻将按照index进行排序
    return a.sort(compareKey(x => C.byName(x).index));
}

export function getCards() {
    //获取麻将的全部牌，不考虑春夏秋冬和百搭
    let a: string[] = [];
    for (let i = 0; i < 34; i++)
        for (let j = 0; j < 4; j++)
            a.push(NAMES[i]);
    return a;
}
