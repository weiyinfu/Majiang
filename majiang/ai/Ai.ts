import {emptyHandler, Handler, MessageFunction} from "../core/Handler";
import {
    AnGangRequest,
    AnGangResponse,
    EatRequest,
    EatResponse,
    FetchRequest,
    FetchResponse,
    FetchResponseMode,
    MessageType,
    MingGangRequest,
    MingGangResponse,
    OverRequest,
    OverResponse,
    PengRequest,
    PengResponse,
    ReleaseRequest,
    ReleaseResponse,
    ReleaseResponseMode,
    StartRequest,
    StartResponse
} from "../core/MajiangProtocol";
import {C, UNKNOWN} from "../core/Card";
import {MajiangClient} from "../core/MajiangClient";
import {deepcopy, flat, li, randChoose, remove} from "../util/Utils";
import {Judger, MIN_SCORE, State} from "./Judger";
import {BestHu} from "../hu/BestHu";

function getState(anGang: string[][],
                  myHand: string[],
                  shown: string[][][],
                  rubbish: string[]): State {
    const a = li(34, 4);//一个34维的向量
    let anGangCount = 0;
    let myAnGang: string[] = []
    for (let i of anGang) {
        if (i[0] === UNKNOWN) anGangCount += i.length;
        else myAnGang = i;
    }
    const appeared = flat(li(4, myAnGang), myHand, shown, rubbish);
    for (let i = 0; i < appeared.length; i++) {
        const cardIndex = C.byName(appeared[i]).index;
        a[cardIndex]--;
        if (a[cardIndex] < 0) {
            throw new Error(`牌数不可能是0`);
        }
    }
    return {a, anGangCount};
}

function only(actions: any[]) {
    //带有一个assert的函数
    if (actions.length !== 1) throw new Error(`这不是个好AI`);
    return randChoose(actions);
}

export class ReleaseResult {
    release: string = "";
    score: number = 0;
}

export function releaseWhich(judger: Judger, hand: string[], state: State): ReleaseResult {
    let best: ReleaseResult = {
        release: '',
        score: MIN_SCORE
    }
    const handSet = new Set(hand).values();
    while (1) {
        const res = handSet.next()
        if (res.done) break;
        const release = res.value;
        const han = hand.slice();
        han.splice(hand.indexOf(release), 1);
        const result = judger.judge(state, han);
        if (result.score > best.score) {
            best.score = result.score;
            best.release = release;
        }
    }
    return best;
}

export class Ai implements Handler {
    /**
     * 基于judger的AI
     * */
    client: MajiangClient = new MajiangClient(BestHu);
    judger: Judger;
    postMessage: MessageFunction = emptyHandler;

    constructor(judger: Judger) {
        this.judger = judger;
    }

    releaseWhich(): ReleaseResult {
        const cli = this.client;
        const state = getState(cli.anGang, cli.hand[cli.me], cli.shown, cli.rubbish);
        return releaseWhich(this.judger, cli.hand[cli.me], state);
    }

    swallow(food: string[]): number {
        //吞：表示“吃+碰+明杠”三种操作，food的最后一个元素是被吃掉的牌，前面的元素是我应该亮明的牌
        const cli = this.client;
        const hand = cli.hand[cli.me].slice();
        remove(hand, food.slice(0, food.length - 1));
        const shown = deepcopy(cli.shown)
        shown[cli.me].push(food)
        const state = getState(cli.anGang, hand, shown, cli.rubbish);
        if (food.length === 4) {
            //如果是杠牌，则直接判断当前局面
            return this.judger.judge(state, hand).score;
        } else {
            //吃碰之后必须弃牌
            return releaseWhich(this.judger, hand, state).score;
        }
    }

    anGang(fetched: string) {
        const cli = this.client;
        const hand = cli.hand[cli.me].slice()
        remove(hand, li(4, fetched));
        const anGang = deepcopy(cli.anGang);
        anGang[cli.me].push(fetched);
        const state = getState(cli.anGang, hand, cli.shown, cli.rubbish);
        return this.judger.judge(state, hand).score;
    }

    onStart(req: StartRequest): StartResponse {
        return only(this.client.onStart(req));
    }

    onFetch(req: FetchRequest): FetchResponse {
        let actions = this.client.onFetch(req);
        if (req.turn !== this.client.me) return only(actions);
        //如果轮到我，我就要选择最佳决策
        const releaseResult = this.releaseWhich();
        const best = {
            action: actions.filter(act => act.mode === FetchResponseMode.RELEASE && act.release === releaseResult.release)[0],
            score: releaseResult.score
        }
        for (const resp of actions) {
            let now = MIN_SCORE;
            switch (resp.mode) {
                case FetchResponseMode.HU_SELF: {
                    //如果能胡牌，直接胡
                    return resp;
                }
                case FetchResponseMode.PASS: {
                    throw new Error(`自己摸牌了不能pass,MajiangClient生成决策错误`);
                }
                case FetchResponseMode.RELEASE: {
                    //release在上面已经处理过了，此处可以直接跳过
                    continue;
                }
                case FetchResponseMode.AN_GANG: {
                    //只有暗杠比较特殊，需要特殊处理
                    now = this.anGang(req.card);
                    break;
                }
                default: {
                    throw new Error(`unknown reply mode ${resp.mode}`);
                }
            }
            if (now > best.score) {
                best.score = now;
                best.action = resp;
            }
        }
        return best.action;
    }

    onRelease(req: ReleaseRequest): ReleaseResponse {
        const actions = this.client.onRelease(req);
        if (req.turn === this.client.me)
            //如果是我弃的牌，那么我只能返回pass
            return only(actions);
        //别人弃牌，我可以“吃碰杠胡过”
        let best = {
            action: actions[0],
            score: MIN_SCORE
        }
        for (let act of actions) {
            let now = MIN_SCORE;
            switch (act.mode) {
                case ReleaseResponseMode.PASS: {
                    const cli = this.client;
                    const state = getState(cli.anGang, cli.hand[cli.me], cli.shown, cli.rubbish);
                    now = this.judger.judge(state, cli.hand[cli.me]).score;
                    break;
                }
                case ReleaseResponseMode.EAT: {
                    now = this.swallow(act.show.concat([req.card]));
                    break;
                }
                case ReleaseResponseMode.PENG: {
                    now = this.swallow(li(3, req.card));
                    break;
                }
                case ReleaseResponseMode.MING_GANG: {
                    now = this.swallow(li(4, req.card));
                    break;
                }
                case ReleaseResponseMode.HU: {
                    return act;
                }
                default: {
                    throw new Error(`error mode ${act.mode}`);
                }
            }
            //如果两个操作相同，优先不选择pass，因为这样可以多获得一次摸牌的权利
            if (now > best.score || (now == best.score && best.action.mode == ReleaseResponseMode.PASS)) {
                best.score = now;
                best.action = act;
            }
        }
        return best.action;
    }

    onEat(req: EatRequest): EatResponse {
        const actions = this.client.onEat(req);
        if (req.turn !== this.client.me)
            return only(actions)
        const {release} = this.releaseWhich();
        return actions.filter(resp => resp.release === release)[0];
    }

    onPeng(req: PengRequest): PengResponse {
        const actions = this.client.onPeng(req)
        if (req.turn !== this.client.me)
            return only(actions);
        const {release} = this.releaseWhich();
        return actions.filter(resp => resp.release === release)[0];
    }

    onOver(req: OverRequest): OverResponse {
        return only(this.client.onOver(req));
    }

    onMingGang(req: MingGangRequest): MingGangResponse {
        return only(this.client.onMingGang(req));
    }

    onAnGang(req: AnGangRequest): AnGangResponse {
        return only(this.client.onAnGang(req));
    }

    handleMessage(message: any): any {
        //此函数用于辅助决策，提供AI的同步调用接口，不用跟onMessage和postMessage打交道
        let resp: any = {};
        switch (message.type) {
            case MessageType.FETCH: {
                resp = this.onFetch(message);
                break;
            }
            case MessageType.OVER: {
                resp = this.onOver(message);
                break;
            }
            case MessageType.EAT: {
                resp = this.onEat(message);
                break;
            }
            case MessageType.PENG: {
                resp = this.onPeng(message);
                break;
            }
            case MessageType.RELEASE: {
                resp = this.onRelease(message);
                break;
            }
            case MessageType.START: {
                resp = this.onStart(message);
                break;
            }
            case MessageType.MING_GANG: {
                resp = this.onMingGang(message);
                break;
            }
            case MessageType.AN_GANG: {
                resp = this.onAnGang(message);
                break;
            }
            default: {
                throw new Error(`未知的请求类型${message.type}`);
            }
        }
        return resp;
    }

    onMessage(message: any): void {
        this.postMessage(this.handleMessage(message));
    }
}