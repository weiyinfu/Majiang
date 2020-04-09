import {Ui} from "./Ui";
import {
    AnGangRequest,
    EatRequest,
    EatResponse,
    FetchRequest,
    FetchResponse,
    FetchResponseMode,
    MessageType,
    MingGangRequest,
    PengRequest,
    PengResponse,
    ReleaseRequest,
    ReleaseResponse,
    ReleaseResponseMode,
    Request,
    Response,
    StartRequest
} from "../core/MajiangProtocol";
import AiWorker from "./ai.worker";
import {MajiangClient} from "../core/MajiangClient";
import {C, UNKNOWN} from "../core/Card";
import {flat, getCount, li} from "../util/Utils";
import {emptyHandler} from "../core/Handler";
import {compareKey} from "../util/Topk";
import audios, {playSound} from "./Sound";

/**
 * 以主谓宾的形式进行输入
 *
 * 因为AI思考可能比较费时间，所以AI应该作为一个worker存在。
 * 而界面是需要知道一些信息的，所以UI也应该存在，每当有消息时，消息会发送给它俩
 * 真是美妙绝伦的设计。
 * */
type SS = string[] | (string[][]);
type ActionOption = { [index: string]: SS };
type UserAction = { [index: number]: ActionOption };

function getAvailableCards(cli: MajiangClient, unique: boolean) {
    const a = li(34, 4);
    for (let card of flat(cli.hand, cli.anGang, cli.rubbish, cli.shown)) {
        if (card === UNKNOWN) continue;
        a[C.byName(card).index]--;
        if (a[C.byName(card).index] < 0) {
            throw new Error(`impossible to be negative`);
        }
    }
    const cards = [];
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a[i]; j++) {
            cards.push(C.byIndex(i).name);
            if (unique) break;
        }
    }
    return cards;
}

function howToEat(lastRelease: string, cli: MajiangClient): string[][] {
    //别人可能会如何吃掉lastRelease这张上次弃掉的牌
    const card = C.byName(lastRelease);
    const available = getAvailableCards(cli, true);//获取全部未曾出现过的牌
    const ans: string[][] = [];
    const n = 3;
    const availableSet = new Set<number>(available.map(x => C.byName(x).sparseIndex));

    function get(beg: number, end: number) {
        const ans = []
        for (let i = beg; i < end; i++) {
            if (!availableSet.has(i)) return null;//如果未知牌中不存在这样的牌，那么直接返回
            if (i !== card.sparseIndex) {
                ans.push(i);
            }
        }
        return ans;
    }

    for (let i = 0; i < n; i++) {
        const li = get(card.sparseIndex - i, card.sparseIndex - i + n);
        if (li === null) continue;
        ans.push(li.map(x => C.bySparseIndex(x).name));
    }
    return ans;
}

export class AiHelper {
    ai: any;
    ui: Ui;
    cli: MajiangClient;
    //输入相关：主谓宾
    user: number = 0;//当前用户选中的主语
    act: string = MessageType.FETCH;//当前用户选中的谓语
    cards: string[] | string[][] = [];//宾语，它最多是一个二维数组，也可能为空数组
    userEnabled: boolean[] = [];//用户按钮是否允许
    actEnabled: { [index: string]: boolean } = {}//谓语按钮是否允许
    ActionNames: { [index: string]: string } = {};
    actionTable: UserAction = {};//主谓宾三级树形结构
    //Ai给出的建议，表示AI返回的最佳决策，第一个是谓语，第二个是宾语
    bestAction: [string, SS] = ['', []];
    message: string = '';

    constructor() {
        this.ai = new AiWorker() as any;
        this.ui = new Ui();
        this.cli = this.ui.client;
        //忽略UI发送过来的消息，但是UI应该使用这个回调刷新界面，所以此处等待AI填充这个handler
        this.ui.postMessage = emptyHandler;
        this.ai.onmessage = (event: any) => {
            const message = event.data as Response;
            this.onAiResponse(message);
        }
        Object.values(MessageType).forEach(messageType => {
            if (messageType === MessageType.OVER || messageType === MessageType.START) return;
            this.actEnabled[messageType] = true;
        })
        const messageNames = [
            [MessageType.FETCH, '摸牌'],
            [MessageType.RELEASE, '弃牌'],
            [MessageType.EAT, '吃牌'],
            [MessageType.PENG, '碰牌'],
            [MessageType.AN_GANG, '暗杠'],
            [MessageType.MING_GANG, '明杠']];
        messageNames.forEach(([k, v]) => {
            this.ActionNames[k] = v;
        })
    }

    onAiResponse(message: Response) {
        //对Ai回复的消息做一些处理，处理成主谓宾的形式
        console.log(`got ai message `, message);
        switch (message.type) {
            case MessageType.RELEASE: {
                const releaseResp = message as ReleaseResponse;
                this.bestAction = [releaseResp.mode, releaseResp.show];
                break;
            }
            case MessageType.FETCH: {
                const fetchResp = message as FetchResponse;
                this.bestAction = [fetchResp.mode, [fetchResp.release]];
            }
            case MessageType.EAT:
            case MessageType.PENG: {
                //吃碰之后也需要弃牌
                const resp = message as (EatResponse | PengResponse);
                this.bestAction = [MessageType.RELEASE, [resp.release]];
                break;
            }
            default: {
                console.log(`ignore ai message ${JSON.stringify(message)}`);
            }
        }
    }

    isBestAction(act: string) {
        return this.user === this.cli.me && this.bestAction[0] === act;
    }

    isBestCard(cards: SS) {
        //把最好的决策所对应的牌用对应的标志标记出来
        if (this.isBestAction(this.act)) {
            //要想是最佳宾语，必须是最佳谓语
            const res = this.actionTable[this.user][this.act];
            if (res.length === 0) {
                //如果不需要宾语
                throw new Error(`action ${this.user} ${this.act} dont need object`);
            } else {
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

    enableAct(...acts: string[]) {
        //接受多个参数，其中第一个参数表示设置act
        this.act = acts[0];
        for (let i in this.actEnabled) {
            this.actEnabled[i] = acts.indexOf(i) !== -1;
        }
    }

    enableUser(...users: number[]) {
        //接受多个参数，其中第一个参数表示设置user
        this.user = users[0];
        this.userEnabled = li(this.cli.USER_COUNT, false);
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
            users.sort(compareKey(userId => {
                if (userId === this.cli.me) return 10;
                if (userId === this.user) return 6;
                if (userId === (this.user + 1) % this.cli.USER_COUNT) return 5;
                return 1;
            })).reverse();
            this.enableUser(...users);
            //设置act
            const firstUserActs = Object.keys(this.actionTable[users[0]]);
            this.enableAct(...firstUserActs);
            this.cards = this.actionTable[this.user][this.act];
        }
    }

    onFetch(card: string) {
        const req: FetchRequest = {
            turn: this.user,
            card: card,
            type: MessageType.FETCH,
            token: 'good',
        };
        this.tellSons(req);
        //摸牌之后应该弃牌
        this.actionTable = {};
        this.actionTable[this.user] = {};
        const responses = this.ui.actions as FetchResponse[]
        if (responses.filter(x => x.mode === FetchResponseMode.HU_SELF).length) {
            //如果胡牌了
            this.onOver();
            return;
        }
        if (this.user === this.cli.me) {
            //如果是我自己，那么我能弃什么牌我是清楚的
            if (responses.filter(resp => resp.mode === FetchResponseMode.AN_GANG).length) {
                this.actionTable[this.user][MessageType.AN_GANG] = [];
            }
            this.actionTable[this.user][MessageType.RELEASE] = this.cli.hand[this.cli.me].slice();
        } else {
            this.actionTable[this.user][MessageType.RELEASE] = getAvailableCards(this.cli, true);
            this.actionTable[this.user][MessageType.AN_GANG] = [];
        }
    }


    onRelease(released: string) {
        const req: ReleaseRequest = {
            turn: this.user,
            card: released,
            type: MessageType.RELEASE,
            token: "good",
        }
        this.tellSons(req);
        const responses = this.ui.actions as ReleaseResponse[];
        this.actionTable = {}
        if (responses.filter(resp => resp.mode === ReleaseResponseMode.HU).length > 0) {
            //如果胡牌了，那就什么都别做了。游戏必然结束
            this.onOver();
            return;
        }
        const nextUser = (this.user + 1) % this.cli.USER_COUNT;
        for (let userId = 0; userId < this.cli.USER_COUNT; userId++) {
            if (userId === this.user) continue;
            this.actionTable[userId] = {}
            if (userId !== this.cli.me) {
                if (userId === nextUser) {
                    //别人摸牌我是看不见的
                    this.actionTable[userId][MessageType.FETCH] = [];
                    //吃牌
                    let eatMethod = howToEat(this.cli.lastRelease, this.cli);
                    if (eatMethod.length) {
                        //如果有吃的方法才可以吃
                        this.actionTable[userId][MessageType.EAT] = eatMethod;
                    }
                }
                const available = getAvailableCards(this.cli, false);
                if (getCount(available, released) >= 2) {
                    //如果别人手里有超过两张的同样的牌，那么可以选择碰牌
                    this.actionTable[userId][MessageType.PENG] = [];
                }
                if (getCount(available, released) >= 3) {
                    this.actionTable[userId][MessageType.MING_GANG] = [];
                }
            } else {
                //如果我是下一个用户，那么我可以直接摸牌
                if (nextUser === this.cli.me) {
                    this.actionTable[userId][MessageType.FETCH] = getAvailableCards(this.cli, true);
                }
                //如果是我，直接从UI的actions里面找核发状态
                for (const resp of responses) {
                    switch (resp.mode) {
                        case ReleaseResponseMode.EAT: {
                            if (this.actionTable[userId][MessageType.EAT]) {
                                const ar = this.actionTable[userId][MessageType.EAT] as string[][];
                                ar.push(resp.show);
                            } else {
                                this.actionTable[userId][MessageType.EAT] = [resp.show];
                            }
                            break;
                        }
                        case ReleaseResponseMode.MING_GANG: {
                            this.actionTable[userId][MessageType.MING_GANG] = [];
                            break;
                        }
                        case ReleaseResponseMode.PENG: {
                            this.actionTable[userId][MessageType.PENG] = [];
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
        this.shutdown();//关闭AI
        playSound(audios.win);
        this.message = `恭喜胜利！`;
    }

    onEat(food: string[]) {
        const req: EatRequest = {
            turn: this.user,
            token: '',
            type: MessageType.EAT,
            cards: food
        }
        this.tellSons(req);
        this.actionTable = {}
        this.actionTable[this.user] = {};
        //吃牌之后应该弃牌
        this.actionTable[this.user] [MessageType.RELEASE] = getAvailableCards(this.cli, true);
    }

    onPeng() {
        const req: PengRequest = {
            turn: this.user,
            token: "good",
            type: MessageType.PENG,
        }
        this.tellSons(req);
        this.actionTable = {};
        this.actionTable[this.user] = {};
        //碰牌之后应该弃牌
        this.actionTable[this.user][MessageType.RELEASE] = getAvailableCards(this.cli, true);
    }

    onAnGang() {
        const req: AnGangRequest = {
            token: "",
            type: MessageType.AN_GANG,
            turn: this.user,
        }
        this.tellSons(req);
        this.actionTable = {};
        this.actionTable[this.user] = {}
        this.actionTable[this.user][MessageType.FETCH] = getAvailableCards(this.cli, true);
    }

    onMingGang() {
        const req: MingGangRequest = {
            turn: this.user,
            token: "",
            type: MessageType.MING_GANG,
        }
        this.tellSons(req);
        this.actionTable = {}
        this.actionTable[this.user] = {}
        this.actionTable[this.user][MessageType.FETCH] = getAvailableCards(this.cli, true);
    }

    onStart(hand: string[], me: number) {
        const req: StartRequest = {
            cards: hand,
            turn: me,
            token: 'good',
            userCount: 4,
            type: MessageType.START,
        };
        this.message = '';
        this.tellSons(req);
        //开局之后，接下来只能是摸牌
        this.actionTable = {};
        this.actionTable[0] = {}
        this.actionTable[0][MessageType.FETCH] = getAvailableCards(this.cli, true);
        this.initAction();
    }

    private tellSons(message: Request): void {
        this.ai.postMessage(message);//AI发送消息是为了获取策略
        this.ui.onMessage(message);//UI发送消息是为了更新UI数据
    }

    doAct(what: string[] | string) {
        this.actionTable = {};//清空actionTable
        switch (this.act) {
            case MessageType.FETCH: {
                this.onFetch(what as string);
                break;
            }
            case MessageType.AN_GANG: {
                this.onAnGang();
                break;
            }
            case MessageType.MING_GANG: {
                this.onMingGang();
                break;
            }
            case MessageType.PENG: {
                this.onPeng();
                break;
            }
            case MessageType.EAT: {
                this.onEat(what as string[]);
                break;
            }
            case MessageType.RELEASE: {
                this.onRelease(what as string);
                break;
            }
            default: {
                throw new Error(`cannot hand act ${this.act}`);
            }
        }
        this.initAction();
    }
}

