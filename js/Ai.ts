import {Handler} from "./Handler";
import {
    AnGangReply,
    AnGangRequest,
    EatReply,
    EatRequest,
    FetchReply,
    FetchReplyMode,
    FetchRequest,
    MessageType,
    MingGangReply,
    MingGangRequest,
    OverReply,
    OverRequest,
    PengReply,
    PengRequest,
    ReleaseReply,
    ReleaseReplyMode,
    ReleaseRequest,
    StartReply,
    StartRequest
} from "./MajiangProtocol";
import {CardMap, UNKNOWN} from "./Card";
import {MajiangClient} from "./MajiangClient";
import {deepcopy, flat, li, randChoose, remove} from "./Utils";
import {Judger, MIN_SCORE, State} from "./Judger";

const PRINT = {
    RELEASE_ACTION: true,
}

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
    flat([li(4, myAnGang), myHand, shown, rubbish]).forEach(i => {
        a[CardMap[i].index]--;
    });
    return {a, anGangCount};
}

function only(actions: any[]) {
    //带有一个assert的函数
    if (actions.length !== 1) throw `这不是个好AI`;
    return randChoose(actions);
}


export class Ai implements Handler {
    client: MajiangClient = new MajiangClient();
    judger: Judger;
    postMessage: (message: any) => void;

    constructor(judger: Judger, postMessage: (message: any) => void) {
        this.judger = judger;
        this.postMessage = postMessage;
    }

    releaseWhich(): [string, number] {
        const cli = this.client;
        let best = {
            card: '',
            score: MIN_SCORE
        }
        new Set(cli.hand[cli.me]).forEach(release => {
            const hand = cli.hand[cli.me].slice();
            remove(hand, [release]);
            const rubbish = cli.rubbish.slice();
            rubbish.push(release);
            const state = getState(cli.anGang, hand, cli.shown, cli.rubbish);
            const result = this.judger.judge(state, hand);
            if (result.score > best.score) {
                best.score = result.score;
                best.card = release;
            }
            if (PRINT.RELEASE_ACTION) {
                console.log(`${this.client.me}号用户手牌：${hand.join(',')}
如果弃牌"${release}"，则${JSON.stringify(result)}`)
            }
        });
        if (PRINT.RELEASE_ACTION) {
            console.log(`最佳弃牌"${best.card} 步数${best.score}"`)
        }
        return [best.card, best.score];
    }

    swallow(food: string[]): number {
        //吞：表示“吃+碰+明杠”三种操作，food的最后一个元素是被吃掉的牌，前面的元素是我应该亮明的牌
        const cli = this.client;
        const hand = cli.hand[cli.me].slice();
        remove(hand, food.slice(0, food.length - 1));
        const shown = deepcopy(cli.shown)
        shown[cli.me].push(food)
        const state = getState(cli.anGang, hand, shown, cli.rubbish);
        return this.judger.judge(state, hand).score;
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

    onStart(req: StartRequest): StartReply {
        return only(this.client.onStart(req));
    }

    onFetch(req: FetchRequest): FetchReply {
        let actions = this.client.onFetch(req);
        if (req.turn !== this.client.me) return only(actions);
        //如果轮到我，我就要选择最佳决策
        const [releaseCard, releaseScore] = this.releaseWhich();
        const best = {
            action: actions.filter(act => act.mode === FetchReplyMode.RELEASE && act.release === releaseCard)[0],
            score: releaseScore
        }
        for (const resp of actions) {
            let now = MIN_SCORE;
            switch (resp.mode) {
                case FetchReplyMode.HU_SELF: {
                    //如果能胡牌，直接胡
                    return resp;
                }
                case FetchReplyMode.PASS: {
                    throw `自己摸牌了不能pass,MajiangClient生成决策错误`;
                }
                case FetchReplyMode.RELEASE: {
                    //release在上面已经处理过了，此处可以直接跳过
                    continue;
                }
                case FetchReplyMode.AN_GANG: {
                    //只有暗杠比较特殊，需要特殊处理
                    now = this.anGang(req.card);
                    break;
                }
                default: {
                    throw `unknown reply mode ${resp.mode}`;
                }
            }
            if (now > best.score) {
                best.score = now;
                best.action = resp;
            }
        }
        return best.action;
    }

    onRelease(req: ReleaseRequest): ReleaseReply {
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
                case ReleaseReplyMode.PASS: {
                    const cli = this.client;
                    const state = getState(cli.anGang, cli.hand[cli.me], cli.shown, cli.rubbish);
                    now = this.judger.judge(state, cli.hand[cli.me]).score;
                    break;
                }
                case ReleaseReplyMode.EAT: {
                    now = this.swallow(act.show.concat([req.card]));
                    break;
                }
                case ReleaseReplyMode.PENG: {
                    now = this.swallow(li(3, req.card));
                    break;
                }
                case ReleaseReplyMode.MING_GANG: {
                    now = this.swallow(li(4, req.card));
                    break;
                }
                case ReleaseReplyMode.HU: {
                    return act;
                }
                default: {
                    throw `error mode ${act.mode}`
                }
            }
            //如果两个操作相同，优先不选择pass，因为这样可以多获得一次摸牌的权利
            if (now > best.score || (now == best.score && best.action.mode == ReleaseReplyMode.PASS)) {
                best.score = now;
                best.action = act;
            }
        }
        return best.action;
    }

    onEat(req: EatRequest): EatReply {
        const actions = this.client.onEat(req);
        if (req.turn !== this.client.me)
            return only(actions)
        const [releaseCard, releaseScore] = this.releaseWhich();
        return actions.filter(resp => resp.release === releaseCard)[0];
    }

    onPeng(req: PengRequest): PengReply {
        const actions = this.client.onPeng(req)
        if (req.turn !== this.client.me)
            return only(actions);
        const [releaseCard, releaseScore] = this.releaseWhich();
        return actions.filter(resp => resp.release === releaseCard)[0];
    }

    onOver(req: OverRequest): OverReply {
        return only(this.client.onOver(req));
    }

    onMingGang(req: MingGangRequest): MingGangReply {
        return only(this.client.onMingGang(req));
    }

    onAnGang(req: AnGangRequest): AnGangReply {
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
                throw `未知的请求类型${message.type}`;
            }
        }
        return resp;
    }

    onMessage(message: any): void {
        this.postMessage(this.handleMessage(message));
    }
}