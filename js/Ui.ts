/**
 * Ui存储用户可见的数据，Ui跟Ai本来就是同一类事物，Ui是用户产生决策的工具，Ai是计算机产生决策的工具 。
 * */
import {
    AnGangRequest,
    EatRequest,
    FetchRequest,
    MessageType,
    MingGangRequest,
    OverMode,
    OverRequest,
    PengRequest,
    ReleaseRequest,
    Request,
    Response,
    StartRequest
} from "./MajiangProtocol";
import {CardMap} from "./Card";
import {Handler} from "./Handler";
import {MajiangClient} from "./MajiangClient";
import {range} from "./Utils";

enum Sound {
    START = "start",
    LOSE = "lose",
    WIN = "win",
    EAT = "eat",
    PENG = "peng",
    GANG = "gang",
}

function wrap(s: string) {
    //用大括号把s括起来，便于与普通字符串区分
    return `{${s}}`
}

export class Ui implements Handler {
    messages: string[] = [];//从server发过来的消息
    that: any = null;//vue组件
    userNames: string[] = [];//用户名称
    client: MajiangClient = new MajiangClient();
    actions: Response[] = [];

    constructor(vue: any) {
        this.that = vue;
    }

    printMessage(message: string) {
        this.messages.push(message);
        const ele = this.that.$refs.messageList;
        this.that.$nextTick(() => {
            ele.scrollTop = ele.scrollHeight;
        })
    }

    playCardSound(card: string) {
        this.playSound(CardMap[card].sound);
    }

    playSound(sound: string) {
        this.that.$refs[sound][0].play();
    }

    sendActions(actions: Response[]): void {
        if (actions.length === 0) throw new Error(`无计可施`);
        if (actions.length === 1) {
            //如果用户只有一种决策，不用请示用户直接执行
            this.postMessage(actions[0]);
        } else {
            this.actions = actions;
        }
    }

    postMessage(message: Response): void {
        this.that.server.postMessage(message);
    }

    onEat(req: EatRequest): void {
        this.playSound(Sound.EAT);
        this.printMessage(`${this.userNames[req.turn]}用${req.cards.slice(0, 2).join('')}吃了${wrap(req.cards[req.cards.length - 1])}`);
        this.sendActions(this.client.onEat(req));
    }

    onFetch(req: FetchRequest): void {
        this.printMessage(`${this.userNames[req.turn]}摸了一张${req.card ? wrap(req.card) : '牌'}`)
        this.sendActions(this.client.onFetch(req));
    }

    onOver(req: OverRequest): void {
        if (req.mode === OverMode.NO_CARD) {
            this.printMessage(`没牌了`);
        } else {
            this.printMessage(`${this.userNames[req.winner]}赢了！`);
        }
        this.playSound(req.winner === this.client.me ? Sound.WIN : Sound.LOSE);
        this.sendActions(this.client.onOver(req));
    }

    onPeng(req: PengRequest): void {
        this.printMessage(`${this.userNames[req.turn]}碰了${wrap(this.client.lastRelease)}`);
        this.playSound(Sound.PENG);
        this.sendActions(this.client.onPeng(req));
    }

    onRelease(req: ReleaseRequest): void {
        this.playCardSound(req.card);
        this.printMessage(`${this.userNames[req.turn]}弃了一张${wrap(req.card)}`);
        this.sendActions(this.client.onRelease(req));
    }

    onStart(req: StartRequest): void {
        this.messages = []
        this.userNames = range(req.userCount).map(i => i == req.turn ? '我' : `${i}号`);
        this.playSound(Sound.START);
        this.printMessage(`游戏开始了！我摸到了${req.cards.length}张牌，一共${req.userCount}人参与。`);
        this.sendActions(this.client.onStart(req));
    }

    onMingGang(req: MingGangRequest): void {
        this.playSound(Sound.GANG);
        this.printMessage(`${this.userNames[req.turn]}明杠了${wrap(this.client.lastRelease)}`);
        this.sendActions(this.client.onMingGang(req));
    }

    onAnGang(req: AnGangRequest): void {
        this.playSound(Sound.GANG);
        this.printMessage(`${this.userNames[req.turn]}暗杠了${this.client.lastFetch ? wrap(this.client.lastFetch) : '一种牌'}`);
        this.sendActions(this.client.onAnGang(req));
    }

    onMessage(message: Request): void {
        switch (message.type) {
            case MessageType.START: {
                this.onStart(<StartRequest>message);
                break;
            }
            case MessageType.RELEASE: {
                this.onRelease(<ReleaseRequest>message);
                break;
            }
            case MessageType.PENG: {
                this.onPeng(<PengRequest>message);
                break;
            }
            case MessageType.EAT: {
                this.onEat(<EatRequest>message);
                break;
            }
            case MessageType.OVER: {
                this.onOver(<OverRequest>message);
                break;
            }
            case MessageType.FETCH: {
                this.onFetch(<FetchRequest>message);
                break;
            }
            case MessageType.MING_GANG: {
                this.onMingGang(<MingGangRequest>message);
                break;
            }
            case MessageType.AN_GANG: {
                this.onAnGang(<AnGangRequest>message);
                break;
            }
            default: {
                throw new Error(`未知的消息类型 ${message.type}`);
            }
        }
    }
}