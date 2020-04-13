import {C, getCards, hide, sortCards} from "./Card";
import {deepcopy, init, ll, randInt, shuffle} from "../majiang/util/Utils";
import {v4 as uuid} from "uuid";
import {
    Call,
    CallRequest,
    CallResponse,
    FetchRequest,
    FetchResponse,
    MessageType,
    Request,
    Response,
    StartRequest,
    StartResponse
} from "./DavinceCodeProtocol";
import {Handler} from "../majiang/core/Handler";

export class DavinceCodeServer {
    userCount: number = 0;
    pile: string[] = [];//牌堆
    hand: string[][] = [];//手牌，手牌应该有状态，倒或者没倒
    users: Handler[] = [];//用户
    shown: Set<string> = new Set<string>();//所有已经倒下的牌，因为每个牌的名字是唯一的，所以可以使用set
    diedSet: Set<number> = new Set<number>();//死亡的用户集合
    isDied(userId: number) {
        //判断用户是否死亡
        if (this.diedSet.has(userId)) return true;
        for (let i of this.hand[userId]) {
            if (!this.shown.has(i)) {
                return false;
            }
        }
        this.diedSet.add(userId);
        return true;
    }

    broadcast(requestGetter: (turn: number) => Request): Promise<Response[]> {
        return new Promise(resolve => {
            const responses: Response [] = new Array(this.userCount);
            const got = new Set<number>();
            for (let userId = 0; userId < this.userCount; userId++) {
                const token = uuid();
                const req = requestGetter(userId);
                req.token = token;
                this.users[userId].onMessage = (resp: Response) => {
                    if (resp.token !== token) throw new Error("token不对");
                    if (resp.type !== req.type) throw new Error("type不对")
                    got.add(userId)
                    responses[userId] = resp;
                    if (got.size === this.userCount) {
                        resolve(responses)
                    }
                }
                this.users[userId].postMessage(req);
            }
        })
    }

    async newGame(users: Handler[], seed: string) {
        init(seed.toString());
        this.userCount = users.length;
        this.users = users;
        this.pile = getCards();
        shuffle(this.pile);
        this.shown = new Set<string>();
        this.diedSet = new Set<number>();
        if (this.userCount < 2) throw new Error('too few users');
        if (this.userCount > 4) throw new Error('too many users');
        let handCount = this.userCount === 4 ? 3 : 4;
        this.hand = ll(this.userCount);
        for (let i = 0; i < this.userCount; i++) {
            this.hand[i] = this.pile.splice(0, handCount);
            sortCards(this.hand[i]);
        }
        const responses = await this.broadcast(turn => {
            const hand = deepcopy(this.hand);
            for (let i = 0; i < this.userCount; i++) {
                if (i !== turn) {
                    for (let j = 0; j < hand[i].length; j++) {
                        hand[i][j] = hide(hand[i][j]);
                    }
                }
            }
            const req: StartRequest = {
                type: MessageType.START,
                turn: turn,
                hand,
                token: "",
            }
            return req;
        }) as StartResponse[]
        return await this.doFetch(0);
    }

    async doFetch(fetcher: number): Promise<number> {
        //执行摸牌
        if (this.isDied(fetcher)) return this.doFetch((fetcher + 1) % this.userCount);
        let fetched = '';
        if (this.pile.length > 0) {
            const ind = randInt(0, this.pile.length);
            fetched = this.pile.splice(ind, 1)[0];
            this.hand[fetcher].push(fetched);
            sortCards(this.hand[fetcher]);
        }
        let responses = await this.broadcast(turn => {
            let what = fetched;
            if (what) {
                what = turn === fetcher ? fetched : hide(fetched);
            }
            const req: FetchRequest = {
                what,
                who: fetcher,
                which: this.hand[fetcher].indexOf(fetched),
                token: '',
                type: MessageType.FETCH,
            }
            return req;
        }) as FetchResponse[]
        this.validateFetchResponse(responses, fetcher);
        const resp = responses[fetcher];
        //重写fetched，fetched表示最小的那张牌
        if (!fetched) {
            //如果没牌了，那么下次猜错了倒下最左边没有倒下的牌
            fetched = this.hand[fetcher].filter(x => !this.shown.has(x))[0];
        }
        return this.doCall(fetcher, fetched, resp.call as Call);
    }

    async doCall(caller: number, lastFetch: string, call: Call): Promise<number> {
        if (this.isDied(caller)) throw new Error(`user ${caller} has died,cannot call anymore`);
        const result = this.getCallResult(call);
        const mine = {
            who: caller,
            what: result ? '' : lastFetch,
            which: this.hand[caller].indexOf(lastFetch),
        }
        const validCall = result ? call : mine;
        this.shown.add(validCall.what);
        //把结果通知给各个用户
        const responses = await this.broadcast(userId => {
            const req: CallRequest = {
                call,
                result,
                mine: mine,
                token: "",
                type: MessageType.CALL,
            }
            return req;
        }) as CallResponse[];
        if (this.isDied(validCall.who)) {
            this.diedSet.add(validCall.who);
            if (this.diedSet.size === this.userCount - 1) {
                //场上只剩下一个人了
                let winner = -1;
                for (let userId = 0; userId < this.userCount; userId++)
                    if (!this.isDied(userId))
                        winner = userId;
                return winner;
            }
        }
        //成功了，则应该继续call
        this.validateCallResponse(caller, result, responses);
        const resp = responses[caller];
        if (resp.call) {
            //如果call对的用户继续call
            return this.doCall(caller, lastFetch, resp.call);
        } else {
            return this.doFetch((caller + 1) % this.userCount);
        }
    }

    validateCallResponse(caller: number, result: boolean, responses: CallResponse[]) {
        for (let i = 0; i < this.userCount; i++) {
            if (this.isDied(i)) continue;
            const resp = responses[i];
            if (i === caller) {
                if (resp.call) {
                    if (result) {
                        //上次猜测成功了
                        this.validateCall(caller, resp.call);
                    } else {
                        throw new Error(`last time you failed so you cannot continue call`);
                    }
                } else {
                    // caller不再继续call了
                }
            } else {
                if (resp.call) {
                    throw new Error(`不该着你call你call什么`);
                }
            }
        }
    }

    getCallResult(call: Call): boolean {
        //判断叫牌结果是否正确
        if (call.who < 0 || call.who >= this.userCount) return false;
        if (this.isDied(call.who)) return false;
        if (this.shown.has(call.what)) return false;
        if (this.hand[call.who][call.which] === call.what) return true;
        return false;
    }

    validateCall(userId: number, call: Call) {
        if (call.who < 0 || call.who > this.userCount) {
            throw new Error(`call.who error ${call.who}`)
        }
        if (this.isDied(call.who)) {
            throw new Error(`${call.who} has already died`);
        }
        if (userId === call.who) {
            throw new Error(`cannot call your self's card`);
        }
        if (call.which < 0 || call.which >= this.hand[call.who].length) {
            throw new Error(`call.which error ${call.which}`)
        }
        if (!C.byName(call.what)) {
            throw new Error(`call 的牌错误 ${call.what}`);
        }
    }

    validateFetchResponse(responses: FetchResponse[], fetcher: number) {
        for (let userId = 0; userId < this.userCount; userId++) {
            if (this.isDied(userId)) {//不检验死者的回复
                continue;
            }
            const resp = responses[userId];
            if (userId === fetcher) {
                if (resp.call === null) throw new Error(`You should call`);
                this.validateCall(fetcher, resp.call as Call);
            } else {
                //如果不是我，那么理应pass
                if (resp.call !== null) throw new Error(`You shouldn't call`);
            }
        }
    }
}