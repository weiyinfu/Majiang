import {init, shuffle} from "../util/Utils";
import {getCards} from "./Card";

export interface Pile {
    getCard(): Promise<string>;

    getMany(count: number): Promise<string[]>;
}

export class RandomPile implements Pile {
    pile: string[];
    index: number;
    seed: string;

    constructor(seed: string) {
        //每次开局都设置一个随机数，用于记录整个游戏状态，便于别人反馈bug。一个游戏就是一个int
        this.seed = seed;
        init(seed);
        this.pile = getCards();
        shuffle(this.pile);
        this.index = 0;
    }

    private getOne() {
        if (this.index === this.pile.length) return "";
        return this.pile[this.index++];
    }

    getCard(): Promise<string> {
        return new Promise(resolve => {
            resolve(this.getOne());
        })

    }

    getMany(count: number): Promise<string[]> {
        return new Promise(resolve => {
            const ans = []
            for (let i = 0; i < count; i++) {
                ans.push(this.getOne());
            }
            resolve(ans);
        });
    }
}
