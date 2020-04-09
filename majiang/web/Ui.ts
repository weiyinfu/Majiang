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
} from "../core/MajiangProtocol";
import {emptyHandler, Handler, MessageFunction} from "../core/Handler";
import {MajiangClient} from "../core/MajiangClient";
import {range} from "../util/Utils";
import {BestHu} from "../hu/BestHu";
import {playSound} from "./Sound";
import {C} from "../core/Card";

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
    winner: number = -1;
    messages: string[] = [];
    userNames: string[] = [];//用户名称
    client: MajiangClient = new MajiangClient(BestHu);
    actions: Response[] = [];
    postMessage: MessageFunction = emptyHandler;

    printMessage(message: string) {
        this.messages.push(message)
    }

    playCardSound(card: string) {
        this.playSound(C.byName(card).sound);
    }

    playSound(sound: string) {
        playSound(sound);
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
        this.winner = req.winner;
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
        this.winner = -1;
        this.messages = [];
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