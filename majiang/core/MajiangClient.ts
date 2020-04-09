import {
    AnGangResponse,
    AnGangRequest,
    EatResponse,
    EatRequest,
    FetchResponse,
    FetchResponseMode,
    FetchRequest,
    MessageType,
    MingGangResponse,
    MingGangRequest,
    OverMode,
    OverResponse,
    OverRequest,
    PengResponse,
    PengRequest,
    ReleaseResponse,
    ReleaseResponseMode,
    ReleaseRequest,
    StartResponse,
    StartRequest
} from "./MajiangProtocol";
import {C, sortCards, UNKNOWN} from "./Card";
import {getCount, li, ll, remove} from "../util/Utils";
import {Hu} from "./Hu";

/**
 * MajiangClient是一套通用的麻将客户端，基于它可以进行定制，它是Ui和Ai的基础
 * */
export function howToEat(hand: string[], card: string): string[][] {
    //如何吃掉card这张牌，生成全部的吃牌方案。如果card不是数字牌，那么它的sparseIndex附近肯定形不成连子
    const c = C.byName(card);
    //把手牌映射为稀疏ID列表
    const handCards = hand.map(name => C.byName(name).sparseIndex)

    function have(beg: number, end: number): null | string[] {
        //判断hand[]中是否有区域part中从beg到end的牌
        const serie: string[] = [];
        for (let sparseId = beg; sparseId < end; sparseId++) {
            if (sparseId === c.sparseIndex) continue;
            try {
                const ind = handCards.indexOf(sparseId)
                if (ind === -1) return null;
                serie.push(C.byName(hand[ind]).name);
            } catch (e) {
                return null;
            }
        }
        return serie;
    }

    const n = 3;//是否是连续n张的连子
    const eatMethods: string[][] = [];
    for (let i = c.sparseIndex - n + 1; i <= c.sparseIndex; i++) {
        //连续三张
        const serie = have(i, i + n);
        if (serie !== null) {
            eatMethods.push(serie);
        }
    }
    return eatMethods;
}

export class MajiangClient {
    //常量
    USER_COUNT: number = -1;//当前游戏的用户数
    CARD_COUNT: number = -1;//每个人的手牌数
    //牌堆
    shown: string[][][] = [];//碰，吃，明杠之后显示出来的牌
    anGang: string[][] = [];//用户暗杠之后的牌，杠牌四张相同，所以只显示一张即可
    hand: string[][] = [];//手牌
    release: string[][] = [];//每个用户的弃牌历史
    rubbish: string[] = [];//弃掉的没人要的牌
    pile: number = 0;//牌堆中的剩余牌数
    //上次的牌
    lastFetch: string = "";//上次摸到的牌
    lastRelease: string = "";//上次的弃牌
    //变量
    me: number = 0;//我是第几个人
    turn: number = 0;//当前轮到谁
    hu: Hu;

    constructor(hu: Hu) {
        this.hu = hu;
    }

    onEat(req: EatRequest): EatResponse[] {
        this.turn = req.turn;
        const {cards, turn} = req;
        const actions: EatResponse[] = []
        if (turn === this.me) {
            //如果吃牌成功的人是我，那么我需要从我的牌里面去掉一些牌
            remove(this.hand[this.me], cards.slice(0, cards.length - 1));
            this.shown[this.me].push(cards);
            //生成弃牌action列表
            new Set(this.hand[this.me]).forEach(card => {
                const resp: EatResponse = {
                    release: card,
                    token: req.token,
                    type: req.type
                };
                actions.push(resp);
            })
        } else {
            //如果不是我，那么别人会亮出若干张牌
            this.hand[turn].splice(0, cards.length - 1);//最后一张是它新吃掉的牌
            this.shown[turn].push(cards);
            const resp: EatResponse = {
                release: "",
                token: req.token,
                type: req.type
            };
            actions.push(resp);
        }
        this.lastRelease = '';//有人吃了牌，把上次的弃牌清除掉
        return actions;
    }

    onFetch(req: FetchRequest): FetchResponse[] {
        //有人摸了一张牌
        this.turn = req.turn;
        this.pile--;//牌堆中牌数减少1
        if (this.lastRelease) {
            //如果上次弃牌之后没有新消息，那么把弃牌放进垃圾堆
            this.rubbish.push(this.lastRelease);
            this.lastRelease = '';
        }
        const actions: FetchResponse[] = []
        if (req.turn === this.me) {
            //如果是我，那么把这张牌放入我的手牌
            this.hand[this.me].push(req.card);
            sortCards(this.hand[this.me]);
            this.lastFetch = req.card;
            //此处需要对手牌去重，因为弃牌只能弃一张
            new Set(this.hand[this.me]).forEach(card => {
                actions.push({
                    release: card,
                    token: req.token,
                    type: req.type,
                    mode: FetchResponseMode.RELEASE
                });
            });
            if (this.hu.hu(this.hand[this.me])) {
                actions.push({
                    release: "",
                    token: req.token,
                    type: req.type,
                    mode: FetchResponseMode.HU_SELF
                });
            }
            if (getCount(this.hand[this.me], req.card) === 4) {
                actions.push({
                    release: "",
                    token: req.token,
                    type: req.type,
                    mode: FetchResponseMode.AN_GANG,
                });
            }
        } else {
            //如果不是我
            if (req.card) throw new Error(`server是不是傻了，告诉我别人的牌`);
            this.hand[req.turn].push(UNKNOWN);
            actions.push({
                release: "",
                token: req.token,
                type: req.type,
                mode: FetchResponseMode.PASS
            });
        }
        return actions;
    }

    onOver(req: OverRequest): OverResponse[] {
        if (req.mode === OverMode.HU) {
            //如果是因为别人弃牌而胡牌
            this.hand[req.winner].push(this.lastRelease);
            this.lastRelease = '';
        } else if (req.mode === OverMode.NO_CARD) {
            if (this.pile !== 0) {
                throw new Error(`client的牌没有变成0 ${this.pile}`);
            }
        }
        //校验我的手牌与游戏结束时服务器发送过来的手牌
        sortCards(this.hand[this.me]);
        sortCards(this.anGang[this.me]);
        for (let [serverCards, clientCards] of [[req.hand, this.hand], [req.anGang, this.anGang]]) {
            if (serverCards.length !== clientCards.length) throw new Error('length should equal')
            //检验长度
            for (let i = 0; i < serverCards.length; i++) {
                sortCards(serverCards[i]);
                if (clientCards[i].length !== serverCards[i].length) {
                    throw new Error(`游戏结束时，客户端手牌与服务不一致
客户端:${clientCards[i].join(',')}
服务端:${serverCards[i].join(',')}
`)
                }
            }
            //检验牌的内容
            if (serverCards[this.me].join(',') !== clientCards[this.me].join(',')) {
                throw new Error(`游戏结束时，我的手牌与服务器发过来的手牌不一致
我的牌:${clientCards[this.me].join(',')}
服务器发过来的牌:${serverCards[this.me].join(',')}
`);
            }
        }
        this.hand = req.hand;
        this.anGang = req.anGang;
        //校验牌的个数是否符合预期
        return [{
            token: req.token,
            type: req.type,
        }]
    }

    onPeng(req: PengRequest): PengResponse [] {
        this.turn = req.turn;
        this.shown[req.turn].push(li(3, this.lastRelease));
        const actions = [];
        if (req.turn === this.me) {
            remove(this.hand[req.turn], li(2, this.lastRelease));
            new Set(this.hand[this.me]).forEach(card => {
                actions.push({
                    release: card,
                    type: req.type,
                    token: req.token,
                });
            });
        } else {
            //碰牌之后删除两张牌
            this.hand[req.turn].splice(0, 2);
            actions.push({
                release: "",
                type: req.type,
                token: req.token,
            });
        }
        this.lastRelease = '';
        return actions;
    }

    onRelease(req: ReleaseRequest): ReleaseResponse[] {
        this.turn = req.turn;
        this.lastRelease = req.card;
        this.release[req.turn].push(req.card);
        const actions: ReleaseResponse[] = []
        if (req.turn === this.me) {
            //自己弃的牌自己不能管
            const ind = this.hand[this.me].indexOf(req.card);
            this.hand[this.me].splice(ind, 1);
            this.lastFetch = "";//弃牌之后把上次摸到的牌的标志清空
        } else {
            this.hand[req.turn].splice(0, 1);//删掉该用户的一张手牌
            if (req.turn === (this.me - 1 + this.USER_COUNT) % this.USER_COUNT) {
                //如果是我的上家，考虑是否可以吃牌
                const eatMethods = howToEat(this.hand[this.me], req.card);
                for (let i = 0; i < eatMethods.length; i++) {
                    const resp: ReleaseResponse = {
                        token: req.token,
                        type: req.type,
                        mode: ReleaseResponseMode.EAT,
                        show: eatMethods[i],
                    }
                    actions.push(resp);
                }
            }
            const cards = this.hand[this.me].slice();
            cards.push(req.card);
            sortCards(cards);
            if (this.hu.hu(cards)) {
                //如果胡牌
                const resp: ReleaseResponse = {
                    token: req.token,
                    type: req.type,
                    mode: ReleaseResponseMode.HU,
                    show: [],
                }
                actions.push(resp);
            }
            if (getCount(this.hand[this.me], req.card) >= 2) {
                //如果可以碰
                const resp: ReleaseResponse = {
                    token: req.token,
                    type: req.type,
                    mode: ReleaseResponseMode.PENG,
                    show: [],
                }
                actions.push(resp);
            }
            if (getCount(this.hand[this.me], req.card) >= 3) {
                //如果可以杠
                const resp: ReleaseResponse = {
                    token: req.token,
                    type: req.type,
                    mode: ReleaseResponseMode.MING_GANG,
                    show: [],
                }
                actions.push(resp);
            }
        }

        //无论有多少种action，都可以pass
        const resp: ReleaseResponse = {
            token: req.token,
            type: req.type,
            mode: ReleaseResponseMode.PASS,
            show: [],
        }
        actions.push(resp);
        return actions;
    }

    onStart(req: StartRequest): StartResponse[] {
        this.USER_COUNT = req.userCount;
        this.CARD_COUNT = req.cards.length;
        this.shown = ll(this.USER_COUNT);
        this.release = ll(this.USER_COUNT);
        this.anGang = ll(this.USER_COUNT);
        this.rubbish = [];
        this.me = req.turn;
        this.hand[this.me] = req.cards;
        this.turn = 0;//开局时轮到0号用户
        this.pile = 136 - this.USER_COUNT * this.CARD_COUNT;
        this.lastRelease = '';
        this.lastFetch = '';
        //初始化其它人的手牌
        for (let i = 0; i < this.USER_COUNT; i++) {
            if (i !== this.me) {
                this.hand[i] = li(this.CARD_COUNT, UNKNOWN);
            }
        }
        const resp: StartResponse = {
            token: req.token,
            type: MessageType.START
        };
        return [resp];
    }

    onMingGang(req: MingGangRequest): MingGangResponse[] {
        this.turn = req.turn;
        this.shown[req.turn].push(li(4, this.lastRelease));
        if (req.turn === this.me) {
            remove(this.hand[req.turn], li(3, this.lastRelease));
        } else {
            //明杠的时候需要弃掉三张手牌，因为第四章牌还没有放到用户手中
            this.hand[req.turn].splice(0, 3);
        }
        const resp: MingGangResponse = {
            token: req.token,
            type: req.type,
        };
        this.lastRelease = '';
        return [resp];
    }

    onAnGang(req: AnGangRequest): AnGangResponse[] {
        this.turn = req.turn;
        if (req.turn === this.me) {
            this.anGang[req.turn].push(this.lastFetch);
            remove(this.hand[this.me], li(4, this.lastFetch));
        } else {
            this.anGang[req.turn].push(UNKNOWN);
            this.hand[req.turn].splice(0, 4);
        }
        const resp: AnGangResponse = {
            token: req.token,
            type: req.type,
        };
        return [resp];
    }
}
