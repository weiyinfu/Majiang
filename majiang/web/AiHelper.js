"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Ui_1 = require("./Ui");
const MajiangProtocol_1 = require("../core/MajiangProtocol");
const ai_worker_1 = __importDefault(require("./ai.worker"));
const Card_1 = require("../core/Card");
const Utils_1 = require("../util/Utils");
const Handler_1 = require("../core/Handler");
const Topk_1 = require("../util/Topk");
const Sound_1 = __importStar(require("./Sound"));
function getAvailableCards(cli, unique) {
    const a = Utils_1.li(34, 4);
    for (let card of Utils_1.flat(cli.hand, cli.anGang, cli.rubbish, cli.shown)) {
        if (card === Card_1.UNKNOWN)
            continue;
        a[Card_1.C.byName(card).index]--;
        if (a[Card_1.C.byName(card).index] < 0) {
            throw new Error(`impossible to be negative`);
        }
    }
    const cards = [];
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a[i]; j++) {
            cards.push(Card_1.C.byIndex(i).name);
            if (unique)
                break;
        }
    }
    return cards;
}
function howToEat(lastRelease, cli) {
    //别人可能会如何吃掉lastRelease这张上次弃掉的牌
    const card = Card_1.C.byName(lastRelease);
    const available = getAvailableCards(cli, true); //获取全部未曾出现过的牌
    const ans = [];
    const n = 3;
    const availableSet = new Set(available.map(x => Card_1.C.byName(x).sparseIndex));
    function get(beg, end) {
        const ans = [];
        for (let i = beg; i < end; i++) {
            if (!availableSet.has(i))
                return null; //如果未知牌中不存在这样的牌，那么直接返回
            if (i !== card.sparseIndex) {
                ans.push(i);
            }
        }
        return ans;
    }
    for (let i = 0; i < n; i++) {
        const li = get(card.sparseIndex - i, card.sparseIndex - i + n);
        if (li === null)
            continue;
        ans.push(li.map(x => Card_1.C.bySparseIndex(x).name));
    }
    return ans;
}
class AiHelper {
    constructor() {
        //输入相关：主谓宾
        this.user = 0; //当前用户选中的主语
        this.act = MajiangProtocol_1.MessageType.FETCH; //当前用户选中的谓语
        this.cards = []; //宾语，它最多是一个二维数组，也可能为空数组
        this.userEnabled = []; //用户按钮是否允许
        this.actEnabled = {}; //谓语按钮是否允许
        this.ActionNames = {};
        this.actionTable = {}; //主谓宾三级树形结构
        //Ai给出的建议，表示AI返回的最佳决策，第一个是谓语，第二个是宾语
        this.bestAction = ['', []];
        this.message = '';
        this.ai = new ai_worker_1.default();
        this.ui = new Ui_1.Ui();
        this.cli = this.ui.client;
        //忽略UI发送过来的消息，但是UI应该使用这个回调刷新界面，所以此处等待AI填充这个handler
        this.ui.postMessage = Handler_1.emptyHandler;
        this.ai.onmessage = (event) => {
            const message = event.data;
            this.onAiResponse(message);
        };
        Object.values(MajiangProtocol_1.MessageType).forEach(messageType => {
            if (messageType === MajiangProtocol_1.MessageType.OVER || messageType === MajiangProtocol_1.MessageType.START)
                return;
            this.actEnabled[messageType] = true;
        });
        const messageNames = [
            [MajiangProtocol_1.MessageType.FETCH, '摸牌'],
            [MajiangProtocol_1.MessageType.RELEASE, '弃牌'],
            [MajiangProtocol_1.MessageType.EAT, '吃牌'],
            [MajiangProtocol_1.MessageType.PENG, '碰牌'],
            [MajiangProtocol_1.MessageType.AN_GANG, '暗杠'],
            [MajiangProtocol_1.MessageType.MING_GANG, '明杠']
        ];
        messageNames.forEach(([k, v]) => {
            this.ActionNames[k] = v;
        });
    }
    onAiResponse(message) {
        //对Ai回复的消息做一些处理，处理成主谓宾的形式
        console.log(`got ai message `, message);
        switch (message.type) {
            case MajiangProtocol_1.MessageType.RELEASE: {
                const releaseResp = message;
                this.bestAction = [releaseResp.mode, releaseResp.show];
                break;
            }
            case MajiangProtocol_1.MessageType.FETCH: {
                const fetchResp = message;
                this.bestAction = [fetchResp.mode, [fetchResp.release]];
            }
            case MajiangProtocol_1.MessageType.EAT:
            case MajiangProtocol_1.MessageType.PENG: {
                //吃碰之后也需要弃牌
                const resp = message;
                this.bestAction = [MajiangProtocol_1.MessageType.RELEASE, [resp.release]];
                break;
            }
            default: {
                console.log(`ignore ai message ${JSON.stringify(message)}`);
            }
        }
    }
    isBestAction(act) {
        return this.user === this.cli.me && this.bestAction[0] === act;
    }
    isBestCard(cards) {
        //把最好的决策所对应的牌用对应的标志标记出来
        if (this.isBestAction(this.act)) {
            //要想是最佳宾语，必须是最佳谓语
            const res = this.actionTable[this.user][this.act];
            if (res.length === 0) {
                //如果不需要宾语
                throw new Error(`action ${this.user} ${this.act} dont need object`);
            }
            else {
                //直接比较宾语是否相等
                return cards.join('|') === this.bestAction[1].join('|');
            }
        }
        return false;
    }
    shutdown() {
        if (this.ai) {
            this.ai.terminate();
            this.ai = null;
        }
    }
    enableAct(...acts) {
        //接受多个参数，其中第一个参数表示设置act
        this.act = acts[0];
        for (let i in this.actEnabled) {
            this.actEnabled[i] = acts.indexOf(i) !== -1;
        }
    }
    enableUser(...users) {
        //接受多个参数，其中第一个参数表示设置user
        this.user = users[0];
        this.userEnabled = Utils_1.li(this.cli.USER_COUNT, false);
        for (let i of users) {
            this.userEnabled[i] = true;
        }
    }
    changeAct() {
        this.cards = this.actionTable[this.user][this.act];
    }
    changeUser() {
        //如果是我，允许的act为我的action列表
        this.enableAct(...Object.keys(this.actionTable[this.user]));
        this.changeAct();
    }
    initAction() {
        //根据actionTable更新userEnabled和actEnabled
        //对actionTable做压缩
        for (let userId of Object.keys(this.actionTable).map(parseInt)) {
            const actionOption = this.actionTable[userId];
            if (!actionOption || Object.keys(actionOption).length === 0) {
                //如果什么都没有，删除之
                delete this.actionTable[userId];
            }
        }
        const users = Object.keys(this.actionTable).map(parseInt);
        /**
         * 给用户推荐操作时，如果我有可执行的操作，则把我放在第一个；
         * 否则，如果当前用户依然有可执行的操作，则把当前用户放在第一个；
         * 否则，如果当前用户的下一个用户有可执行的操作，把当前用户的下一个用户放在第一个。
         * */
        if (users.length) {
            users.sort(Topk_1.compareKey(userId => {
                if (userId === this.cli.me)
                    return 10;
                if (userId === this.user)
                    return 6;
                if (userId === (this.user + 1) % this.cli.USER_COUNT)
                    return 5;
                return 1;
            })).reverse();
            this.enableUser(...users);
            //设置act
            const firstUserActs = Object.keys(this.actionTable[users[0]]);
            this.enableAct(...firstUserActs);
            this.cards = this.actionTable[this.user][this.act];
        }
    }
    onFetch(card) {
        const req = {
            turn: this.user,
            card: card,
            type: MajiangProtocol_1.MessageType.FETCH,
            token: 'good',
        };
        this.tellSons(req);
        //摸牌之后应该弃牌
        this.actionTable = {};
        this.actionTable[this.user] = {};
        const responses = this.ui.actions;
        if (responses.filter(x => x.mode === MajiangProtocol_1.FetchResponseMode.HU_SELF).length) {
            //如果胡牌了
            this.onOver();
            return;
        }
        if (this.user === this.cli.me) {
            //如果是我自己，那么我能弃什么牌我是清楚的
            if (responses.filter(resp => resp.mode === MajiangProtocol_1.FetchResponseMode.AN_GANG).length) {
                this.actionTable[this.user][MajiangProtocol_1.MessageType.AN_GANG] = [];
            }
            this.actionTable[this.user][MajiangProtocol_1.MessageType.RELEASE] = this.cli.hand[this.cli.me].slice();
        }
        else {
            this.actionTable[this.user][MajiangProtocol_1.MessageType.RELEASE] = getAvailableCards(this.cli, true);
            this.actionTable[this.user][MajiangProtocol_1.MessageType.AN_GANG] = [];
        }
    }
    onRelease(released) {
        const req = {
            turn: this.user,
            card: released,
            type: MajiangProtocol_1.MessageType.RELEASE,
            token: "good",
        };
        this.tellSons(req);
        const responses = this.ui.actions;
        this.actionTable = {};
        if (responses.filter(resp => resp.mode === MajiangProtocol_1.ReleaseResponseMode.HU).length > 0) {
            //如果胡牌了，那就什么都别做了。游戏必然结束
            this.onOver();
            return;
        }
        const nextUser = (this.user + 1) % this.cli.USER_COUNT;
        for (let userId = 0; userId < this.cli.USER_COUNT; userId++) {
            if (userId === this.user)
                continue;
            this.actionTable[userId] = {};
            if (userId !== this.cli.me) {
                if (userId === nextUser) {
                    //别人摸牌我是看不见的
                    this.actionTable[userId][MajiangProtocol_1.MessageType.FETCH] = [];
                    //吃牌
                    let eatMethod = howToEat(this.cli.lastRelease, this.cli);
                    if (eatMethod.length) {
                        //如果有吃的方法才可以吃
                        this.actionTable[userId][MajiangProtocol_1.MessageType.EAT] = eatMethod;
                    }
                }
                const available = getAvailableCards(this.cli, false);
                if (Utils_1.getCount(available, released) >= 2) {
                    //如果别人手里有超过两张的同样的牌，那么可以选择碰牌
                    this.actionTable[userId][MajiangProtocol_1.MessageType.PENG] = [];
                }
                if (Utils_1.getCount(available, released) >= 3) {
                    this.actionTable[userId][MajiangProtocol_1.MessageType.MING_GANG] = [];
                }
            }
            else {
                //如果我是下一个用户，那么我可以直接摸牌
                if (nextUser === this.cli.me) {
                    this.actionTable[userId][MajiangProtocol_1.MessageType.FETCH] = getAvailableCards(this.cli, true);
                }
                //如果是我，直接从UI的actions里面找核发状态
                for (const resp of responses) {
                    switch (resp.mode) {
                        case MajiangProtocol_1.ReleaseResponseMode.EAT: {
                            if (this.actionTable[userId][MajiangProtocol_1.MessageType.EAT]) {
                                const ar = this.actionTable[userId][MajiangProtocol_1.MessageType.EAT];
                                ar.push(resp.show);
                            }
                            else {
                                this.actionTable[userId][MajiangProtocol_1.MessageType.EAT] = [resp.show];
                            }
                            break;
                        }
                        case MajiangProtocol_1.ReleaseResponseMode.MING_GANG: {
                            this.actionTable[userId][MajiangProtocol_1.MessageType.MING_GANG] = [];
                            break;
                        }
                        case MajiangProtocol_1.ReleaseResponseMode.PENG: {
                            this.actionTable[userId][MajiangProtocol_1.MessageType.PENG] = [];
                            break;
                        }
                        default: {
                            throw new Error("impossible state");
                        }
                    }
                }
            }
        }
    }
    onOver() {
        //游戏结束了
        this.actionTable = {};
        this.initAction();
        this.shutdown(); //关闭AI
        Sound_1.playSound(Sound_1.default.win);
        this.message = `恭喜胜利！`;
    }
    onEat(food) {
        const req = {
            turn: this.user,
            token: '',
            type: MajiangProtocol_1.MessageType.EAT,
            cards: food
        };
        this.tellSons(req);
        this.actionTable = {};
        this.actionTable[this.user] = {};
        //吃牌之后应该弃牌
        this.actionTable[this.user][MajiangProtocol_1.MessageType.RELEASE] = getAvailableCards(this.cli, true);
    }
    onPeng() {
        const req = {
            turn: this.user,
            token: "good",
            type: MajiangProtocol_1.MessageType.PENG,
        };
        this.tellSons(req);
        this.actionTable = {};
        this.actionTable[this.user] = {};
        //碰牌之后应该弃牌
        this.actionTable[this.user][MajiangProtocol_1.MessageType.RELEASE] = getAvailableCards(this.cli, true);
    }
    onAnGang() {
        const req = {
            token: "",
            type: MajiangProtocol_1.MessageType.AN_GANG,
            turn: this.user,
        };
        this.tellSons(req);
        this.actionTable = {};
        this.actionTable[this.user] = {};
        this.actionTable[this.user][MajiangProtocol_1.MessageType.FETCH] = getAvailableCards(this.cli, true);
    }
    onMingGang() {
        const req = {
            turn: this.user,
            token: "",
            type: MajiangProtocol_1.MessageType.MING_GANG,
        };
        this.tellSons(req);
        this.actionTable = {};
        this.actionTable[this.user] = {};
        this.actionTable[this.user][MajiangProtocol_1.MessageType.FETCH] = getAvailableCards(this.cli, true);
    }
    onStart(hand, me) {
        const req = {
            cards: hand,
            turn: me,
            token: 'good',
            userCount: 4,
            type: MajiangProtocol_1.MessageType.START,
        };
        this.message = '';
        this.tellSons(req);
        //开局之后，接下来只能是摸牌
        this.actionTable = {};
        this.actionTable[0] = {};
        this.actionTable[0][MajiangProtocol_1.MessageType.FETCH] = getAvailableCards(this.cli, true);
        this.initAction();
    }
    tellSons(message) {
        this.ai.postMessage(message); //AI发送消息是为了获取策略
        this.ui.onMessage(message); //UI发送消息是为了更新UI数据
    }
    doAct(what) {
        this.actionTable = {}; //清空actionTable
        switch (this.act) {
            case MajiangProtocol_1.MessageType.FETCH: {
                this.onFetch(what);
                break;
            }
            case MajiangProtocol_1.MessageType.AN_GANG: {
                this.onAnGang();
                break;
            }
            case MajiangProtocol_1.MessageType.MING_GANG: {
                this.onMingGang();
                break;
            }
            case MajiangProtocol_1.MessageType.PENG: {
                this.onPeng();
                break;
            }
            case MajiangProtocol_1.MessageType.EAT: {
                this.onEat(what);
                break;
            }
            case MajiangProtocol_1.MessageType.RELEASE: {
                this.onRelease(what);
                break;
            }
            default: {
                throw new Error(`cannot hand act ${this.act}`);
            }
        }
        this.initAction();
    }
}
exports.AiHelper = AiHelper;
