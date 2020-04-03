"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MajiangProtocol_1 = require("./MajiangProtocol");
const Card_1 = require("./Card");
const Utils_1 = require("./Utils");
/**
 * MajiangClient是一套通用的麻将客户端，基于它可以进行定制，它是Ui和Ai的基础
 * */
function howToEat(hand, card) {
    //如何吃掉card这张牌，生成全部的吃牌方案。如果card不是数字牌，那么它的sparseIndex附近肯定形不成连子
    const c = Card_1.CardMap[card];
    //把手牌映射为稀疏ID列表
    const handCards = hand.map(name => Card_1.CardMap[name].sparseIndex);
    function have(beg, end) {
        //判断hand[]中是否有区域part中从beg到end的牌
        const serie = [];
        for (let sparseId = beg; sparseId < end; sparseId++) {
            if (sparseId === c.sparseIndex)
                continue;
            try {
                const ind = handCards.indexOf(sparseId);
                if (ind === -1)
                    return null;
                serie.push(Card_1.CardMap[hand[ind]].name);
            }
            catch (e) {
                return null;
            }
        }
        return serie;
    }
    const n = 3; //是否是连续n张的连子
    const eatMethods = [];
    for (let i = c.sparseIndex - n + 1; i <= c.sparseIndex; i++) {
        //连续三张
        const serie = have(i, i + n);
        if (serie !== null) {
            eatMethods.push(serie);
        }
    }
    return eatMethods;
}
class MajiangClient {
    constructor() {
        //常量
        this.USER_COUNT = -1; //当前游戏的用户数
        this.CARD_COUNT = -1; //每个人的手牌数
        //牌堆
        this.shown = []; //碰，吃，明杠之后显示出来的牌
        this.anGang = []; //用户暗杠之后的牌，杠牌四张相同，所以只显示一张即可
        this.hand = []; //手牌
        this.release = []; //每个用户的弃牌历史
        this.rubbish = []; //弃掉的没人要的牌
        this.pile = 0; //牌堆中的剩余牌数
        //上次的牌
        this.lastFetch = ""; //上次摸到的牌
        this.lastRelease = ""; //上次的弃牌
        //变量
        this.me = 0; //我是第几个人
        this.turn = 0; //当前轮到谁
    }
    onEat(req) {
        this.turn = req.turn;
        const { cards, turn } = req;
        const actions = [];
        if (turn === this.me) {
            //如果吃牌成功的人是我，那么我需要从我的牌里面去掉一些牌
            Utils_1.remove(this.hand[this.me], cards.slice(0, cards.length - 1));
            this.shown[this.me].push(cards);
            //生成弃牌action列表
            new Set(this.hand[this.me]).forEach(card => {
                const resp = {
                    release: card,
                    token: req.token,
                    type: req.type
                };
                actions.push(resp);
            });
        }
        else {
            //如果不是我，那么别人会亮出若干张牌
            this.hand[turn].splice(0, cards.length - 1); //最后一张是它新吃掉的牌
            this.shown[turn].push(cards);
            const resp = {
                release: "",
                token: req.token,
                type: req.type
            };
            actions.push(resp);
        }
        this.lastRelease = ''; //有人吃了牌，把上次的弃牌清除掉
        return actions;
    }
    onFetch(req) {
        //有人摸了一张牌
        this.turn = req.turn;
        this.pile--; //牌堆中牌数减少1
        if (this.lastRelease) {
            //如果上次弃牌之后没有新消息，那么把弃牌放进垃圾堆
            this.rubbish.push(this.lastRelease);
            this.lastRelease = '';
        }
        const actions = [];
        if (req.turn === this.me) {
            //如果是我，那么把这张牌放入我的手牌
            this.hand[this.me].push(req.card);
            Card_1.sortCards(this.hand[this.me]);
            this.lastFetch = req.card;
            //此处需要对手牌去重，因为弃牌只能弃一张
            new Set(this.hand[this.me]).forEach(card => {
                actions.push({
                    release: card,
                    token: req.token,
                    type: req.type,
                    mode: MajiangProtocol_1.FetchResponseMode.RELEASE
                });
            });
            if (Card_1.hu(this.hand[this.me])) {
                actions.push({
                    release: "",
                    token: req.token,
                    type: req.type,
                    mode: MajiangProtocol_1.FetchResponseMode.HU_SELF
                });
            }
            if (Utils_1.getCount(this.hand[this.me], req.card) === 4) {
                actions.push({
                    release: "",
                    token: req.token,
                    type: req.type,
                    mode: MajiangProtocol_1.FetchResponseMode.AN_GANG,
                });
            }
        }
        else {
            //如果不是我
            if (req.card)
                throw new Error(`server是不是傻了，告诉我别人的牌`);
            this.hand[req.turn].push(Card_1.UNKNOWN);
            actions.push({
                release: "",
                token: req.token,
                type: req.type,
                mode: MajiangProtocol_1.FetchResponseMode.PASS
            });
        }
        return actions;
    }
    onOver(req) {
        if (req.mode === MajiangProtocol_1.OverMode.HU) {
            //如果是因为别人弃牌而胡牌
            this.hand[req.winner].push(this.lastRelease);
            this.lastRelease = '';
        }
        else if (req.mode === MajiangProtocol_1.OverMode.NO_CARD) {
            if (this.pile !== 0) {
                throw new Error(`client的牌没有变成0 ${this.pile}`);
            }
        }
        //校验牌的个数是否符合预期
        return [{
                token: req.token,
                type: req.type,
            }];
    }
    onPeng(req) {
        this.turn = req.turn;
        this.shown[req.turn].push(Utils_1.li(3, this.lastRelease));
        const actions = [];
        if (req.turn === this.me) {
            Utils_1.remove(this.hand[req.turn], Utils_1.li(2, this.lastRelease));
            new Set(this.hand[this.me]).forEach(card => {
                actions.push({
                    release: card,
                    type: req.type,
                    token: req.token,
                });
            });
        }
        else {
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
    onRelease(req) {
        this.turn = req.turn;
        this.lastRelease = req.card;
        this.release[req.turn].push(req.card);
        const actions = [];
        if (req.turn === this.me) {
            //自己弃的牌自己不能管
            const ind = this.hand[this.me].indexOf(req.card);
            this.hand[this.me].splice(ind, 1);
            this.lastFetch = ""; //弃牌之后把上次摸到的牌的标志清空
        }
        else {
            this.hand[req.turn].splice(0, 1); //删掉该用户的一张手牌
            if (req.turn === (this.me - 1 + this.USER_COUNT) % this.USER_COUNT) {
                //如果是我的上家，考虑是否可以吃牌
                howToEat(this.hand[this.me], req.card).forEach(i => {
                    const resp = {
                        token: req.token,
                        type: req.type,
                        mode: MajiangProtocol_1.ReleaseResponseMode.EAT,
                        show: i,
                    };
                    actions.push(resp);
                });
            }
            const cards = this.hand[this.me].slice();
            cards.push(req.card);
            Card_1.sortCards(cards);
            if (Card_1.hu(cards)) {
                //如果胡牌
                const resp = {
                    token: req.token,
                    type: req.type,
                    mode: MajiangProtocol_1.ReleaseResponseMode.HU,
                    show: [],
                };
                actions.push(resp);
            }
            if (Utils_1.getCount(this.hand[this.me], req.card) >= 2) {
                //如果可以碰
                const resp = {
                    token: req.token,
                    type: req.type,
                    mode: MajiangProtocol_1.ReleaseResponseMode.PENG,
                    show: [],
                };
                actions.push(resp);
            }
            if (Utils_1.getCount(this.hand[this.me], req.card) >= 3) {
                //如果可以杠
                const resp = {
                    token: req.token,
                    type: req.type,
                    mode: MajiangProtocol_1.ReleaseResponseMode.MING_GANG,
                    show: [],
                };
                actions.push(resp);
            }
        }
        //无论有多少种action，都可以pass
        const resp = {
            token: req.token,
            type: req.type,
            mode: MajiangProtocol_1.ReleaseResponseMode.PASS,
            show: [],
        };
        actions.push(resp);
        return actions;
    }
    onStart(req) {
        this.USER_COUNT = req.userCount;
        this.CARD_COUNT = req.cards.length;
        this.shown = Utils_1.ll(this.USER_COUNT);
        this.release = Utils_1.ll(this.USER_COUNT);
        this.anGang = Utils_1.ll(this.USER_COUNT);
        this.rubbish = [];
        this.me = req.turn;
        this.hand[this.me] = req.cards;
        this.turn = 0; //开局时轮到0号用户
        this.pile = 136 - this.USER_COUNT * this.CARD_COUNT;
        this.lastRelease = '';
        this.lastFetch = '';
        //初始化其它人的手牌
        for (let i = 0; i < this.USER_COUNT; i++) {
            if (i !== this.me) {
                this.hand[i] = Utils_1.li(this.CARD_COUNT, Card_1.UNKNOWN);
            }
        }
        const resp = {
            token: req.token,
            type: MajiangProtocol_1.MessageType.START
        };
        return [resp];
    }
    onMingGang(req) {
        this.turn = req.turn;
        this.shown[req.turn].push(Utils_1.li(4, this.lastRelease));
        if (req.turn === this.me) {
            Utils_1.remove(this.hand[req.turn], Utils_1.li(3, this.lastRelease));
        }
        else {
            this.hand[req.turn].splice(0, 4);
        }
        const resp = {
            token: req.token,
            type: req.type,
        };
        this.lastRelease = '';
        return [resp];
    }
    onAnGang(req) {
        this.turn = req.turn;
        if (req.turn === this.me) {
            this.anGang[req.turn].push(this.lastFetch);
            Utils_1.remove(this.hand[this.me], Utils_1.li(4, this.lastFetch));
        }
        else {
            this.anGang[req.turn].push(Card_1.UNKNOWN);
            this.hand[req.turn].splice(0, 4);
        }
        const resp = {
            token: req.token,
            type: req.type,
        };
        return [resp];
    }
}
exports.MajiangClient = MajiangClient;
