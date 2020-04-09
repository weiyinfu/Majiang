/**
 * 达芬奇密码接口
 * */

export enum MessageType {
    START = "start",
    FETCH = "fetch",
    CALL = "call",
    OVER = "over",
}

export class StartRequest {
    hand: string[][] = [];//开局时的手牌
    turn: number = -1;//我是第几个出牌的
    token: string = '';
    type: MessageType = MessageType.START
}

export class StartResponse {
    type: MessageType = MessageType.START;
    token: string = "";
}

export class FetchRequest {
    what: string = '';//用户摸到的牌
    who: number = -1;
    which: number = -1;//摸到的这张牌是该用户排序之后的第几张牌
    token: string = '';
    type: MessageType = MessageType.FETCH;
}

export class Call {
    who: number = -1;
    which: number = -1;//第几张牌
    what: string = "";//它的牌是什么
}

export function EmptyCall(): Call {
    return {
        who: -1,
        which: -1,
        what: '',
    }
}

export class FetchResponse {
    //摸牌之后，必须叫别人的牌
    call: Call | null = null;
    token: string = '';
    type: MessageType = MessageType.FETCH;
}

export class CallRequest {
    //叫牌请求，有人叫牌之后，把这个消息发送给大家，附带着消息的正误
    call: Call = EmptyCall();
    mine: Call = EmptyCall();//call的本金
    //猜牌是否正确，如果猜牌正确，mine为空，如果猜牌错误，mine不为空
    result: boolean = false;
    token: string = "";
    type: MessageType = MessageType.CALL;
}

export class CallResponse {
    //猜牌的回复
    //只有当前用户可以继续call，其它用户只能过，当前用户也可以过
    call: Call | null = EmptyCall();
    token: string = "";
    type: MessageType = MessageType.CALL;
}


export type Request = FetchRequest | CallRequest | StartRequest ;
export type Response = FetchResponse | CallResponse | StartResponse ;
