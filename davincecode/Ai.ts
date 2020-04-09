import {emptyHandler, Handler, MessageFunction} from "../majiang/core/Handler";
import {
    Call,
    CallRequest,
    CallResponse,
    EmptyCall,
    FetchRequest,
    FetchResponse,
    MessageType,
    Request,
    Response,
    StartRequest,
    StartResponse
} from "./DavinceCodeProtocol";
import {DavinceCodeClient} from "./DavinceCodeClient";
import {CardMap, isUnknown, MAX_ORDINAL, ordinalMap} from "./Card";
import {deepcopy, ll} from "../majiang/util/Utils";

/***
 * AI算法的核心就是利用：现在信息+历史上叫错牌的信息，推断未知牌
 * */
function isBadCall(badCalls: Call[], who: number, which: number, ordinal: number) {
    //检查badCall列表里面是否包含某个断言
    for (let call of badCalls) {
        if (call.who === who && call.which === which && call.what === ordinalMap[ordinal].name) {
            return true;
        }
    }
    return false;
}

export function getOptions(hand: string[][], shown: Set<number>, who: number, which: number, badCalls: Call[]): number[] {
    //获取who,which处元素可取值
    const h = hand[who];
    //首先寻找上界和下界
    let up = which;
    while (up < h.length && isUnknown(h[up])) up++;
    let down = which;
    while (down >= 0 && isUnknown(h[down])) down--;
    //一切都是闭区间，让down，downValue和up，upValue都变成闭区间
    let downValue = down >= 0 ? CardMap[h[down]].ordinal + 1 : 0;
    let upValue = up < h.length ? CardMap[h[up]].ordinal - 1 : MAX_ORDINAL;
    down++;
    up--;
    //根据颜色进一步调整downValue和upValue，down处的颜色与downValue应该匹配，up处的颜色与upValue应该匹配
    if ((CardMap[h[up]].ordinal & 1) !== (upValue & 1)) upValue--;
    if ((CardMap[h[down]].ordinal & 1) !== (downValue & 1)) downValue++;
    //现在down处对应downValue，up处对应upValue，进一步收紧范围
    while (shown.has(upValue) || isBadCall(badCalls, who, up, upValue)) {
        upValue -= 2;
    }
    while (up > which) {
        const now = CardMap[h[up]].ordinal & 1;
        const next = CardMap[h[up - 1]].ordinal & 1;
        if (now === next) {
            //如果奇偶性相同，则减2
            upValue -= 2;
        } else {
            //如果奇偶性不同，则减1
            upValue--;
        }
        while (shown.has(upValue) || isBadCall(badCalls, who, up, upValue)) {
            upValue -= 2;
        }
        up--;
    }
    while (shown.has(downValue) || isBadCall(badCalls, who, down, downValue)) {
        downValue += 2;
    }
    while (down < which) {
        const now = CardMap[h[down]].ordinal & 1;
        const next = CardMap[h[down + 1]].ordinal & 1;
        if (now === next) {
            //如果奇偶性相同，则加2
            downValue += 2;
        } else {
            //如果奇偶性不同，则加1
            downValue += 1;
        }
        while (shown.has(downValue) || isBadCall(badCalls, who, down, downValue)) {
            downValue += 2;
        }
        down++;
    }
    const available = [];
    const nowCard = CardMap[h[which]].ordinal & 1;
    for (let i = downValue; i <= upValue; i++) {
        if (!shown.has(i) && !isBadCall(badCalls, who, which, i)) {
            if (nowCard === (i & 1)) {//如果当前牌与which牌颜色相同
                available.push(i);
            }
        }
    }
    return available;
}

export function getAdvice(hand: string[][], badCalls: Call[]): string[][][] {
    const h = deepcopy(hand);
    const shown = new Set<number>();
    for (let i = 0; i < hand.length; i++) {
        for (let j = 0; j < hand[i].length; j++) {
            if (!isUnknown(hand[i][j])) {
                if (!CardMap[hand[i][j]]) throw new Error(`cannot find ${hand[i][j]}`);
                shown.add(CardMap[hand[i][j]].ordinal);
            }
        }
    }
    const ans = ll(hand.length)
    while (1) {
        let updated = false;
        for (let i = 0; i < h.length; i++) {
            for (let j = 0; j < h[i].length; j++) {
                if (isUnknown(h[i][j])) {
                    const ops = getOptions(h, shown, i, j, badCalls);
                    if (ops.length === 1) {
                        updated = true;
                        const card = ordinalMap[ops[0]]
                        if (!card) throw new Error(`cannot find ${ops[0]}`);
                        shown.add(card.ordinal);
                        h[i][j] = card.name;
                    }
                    if (ops.length === 0) throw new Error(`不可能为空`);
                    ans[i][j] = ops.map(x => ordinalMap[x].name);
                } else {
                    ans[i][j] = [h[i][j]];
                }
            }
        }
        if (!updated) {
            break;
        }
    }
    return ans;
}

function solve(hand: string[][], badCalls: Call[]): [Call, number] {
    /**
     * 根据hand和shown返回可以猜的call以及猜对的概率
     * 此处代码存在优化空间，但是这个游戏过于简单，没有优化的必要
     * */
    let call: Call = EmptyCall();
    const advice = getAdvice(hand, badCalls);
    let best: string[] = [];
    for (let i = 0; i < hand.length; i++) {
        for (let j = 0; j < hand[i].length; j++) {
            if (isUnknown(hand[i][j])) {
                //如果是未知，才会放进去
                const now = advice[i][j];
                if (best.length === 0 || best.length > now.length) {
                    best = now;
                    call = {
                        who: i,
                        which: j,
                        what: now[0],
                    }
                }
            }
        }
    }
    if (!call.what) {
        throw new Error(`不可能为空`);
    }
    if (call === EmptyCall()) {
        throw new Error(`没什么可call的了，游戏该结束了`);
    }
    return [call, 1 / best.length];
}

export class Ai implements Handler {
    postMessage: MessageFunction = emptyHandler;
    cli: DavinceCodeClient = new DavinceCodeClient();

    only<T>(responses: T[]) {
        if (responses.length !== 1) {
            throw new Error(`too many responses`);
        }
        return responses[0];
    }

    onStart(req: StartRequest): StartResponse {
        return this.only(this.cli.onStart(req));
    }

    onFetch(req: FetchRequest): FetchResponse {
        const responses = this.cli.onFetch(req);
        if (req.who === this.cli.me) {
            const [call, _] = solve(this.cli.hand, this.cli.badCalls);
            if (responses.length !== 1) throw new Error(`too many responses here`);
            const resp = responses[0];
            resp.call = call;
            return resp;
        } else {
            return this.only(responses);
        }
    }

    onCall(req: CallRequest): CallResponse {
        const responses = this.cli.onCall(req);
        if (this.cli.over()) {
            return this.only(responses);
        }
        if (req.result && req.mine.who === this.cli.me) {
            //如果是我自己并且我猜对了，那么我可以选择继续猜
            //理应返回两个response，一个是过，一个是call
            if (responses.length !== 2) throw new Error('unexpected responses');
            const [call, p] = solve(this.cli.hand, this.cli.badCalls);
            let passResp = responses[0], callResp = responses[1];
            //贪心法，如果有必胜的把握一定会call，能call则call；如果没有必胜的把握，能不call则不call
            //如果只剩下最后一张牌了，那么一定要勇敢地call
            if (p > 0.999 || this.cli.shown.size >= 23) {
                callResp.call = call;
                return callResp;
            } else {
                return passResp;
            }
        } else {
            return this.only(responses);
        }
    }

    onMessage(message: Request): void {
        let response: Response;
        switch (message.type) {
            case MessageType.START: {
                response = this.onStart(message as StartRequest);
                break;
            }
            case MessageType.FETCH: {
                response = this.onFetch(message as FetchRequest);
                break;
            }
            case MessageType.CALL: {
                response = this.onCall(message as CallRequest);
                break;
            }
            default: {
                throw new Error(`cannot handle message ${JSON.stringify(message)}`);
            }
        }
        this.postMessage(response);
    }
}