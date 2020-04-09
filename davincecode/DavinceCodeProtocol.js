"use strict";
/**
 * 达芬奇密码接口
 * */
Object.defineProperty(exports, "__esModule", { value: true });
var MessageType;
(function (MessageType) {
    MessageType["START"] = "start";
    MessageType["FETCH"] = "fetch";
    MessageType["CALL"] = "call";
    MessageType["OVER"] = "over";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
class StartRequest {
    constructor() {
        this.hand = []; //开局时的手牌
        this.turn = -1; //我是第几个出牌的
        this.token = '';
        this.type = MessageType.START;
    }
}
exports.StartRequest = StartRequest;
class StartResponse {
    constructor() {
        this.type = MessageType.START;
        this.token = "";
    }
}
exports.StartResponse = StartResponse;
class FetchRequest {
    constructor() {
        this.what = ''; //用户摸到的牌
        this.who = -1;
        this.which = -1; //摸到的这张牌是该用户排序之后的第几张牌
        this.token = '';
        this.type = MessageType.FETCH;
    }
}
exports.FetchRequest = FetchRequest;
class Call {
    constructor() {
        this.who = -1;
        this.which = -1; //第几张牌
        this.what = ""; //它的牌是什么
    }
}
exports.Call = Call;
function EmptyCall() {
    return {
        who: -1,
        which: -1,
        what: '',
    };
}
exports.EmptyCall = EmptyCall;
class FetchResponse {
    constructor() {
        //摸牌之后，必须叫别人的牌
        this.call = null;
        this.token = '';
        this.type = MessageType.FETCH;
    }
}
exports.FetchResponse = FetchResponse;
class CallRequest {
    constructor() {
        //叫牌请求，有人叫牌之后，把这个消息发送给大家，附带着消息的正误
        this.call = EmptyCall();
        this.mine = EmptyCall(); //call的本金
        //猜牌是否正确，如果猜牌正确，mine为空，如果猜牌错误，mine不为空
        this.result = false;
        this.token = "";
        this.type = MessageType.CALL;
    }
}
exports.CallRequest = CallRequest;
class CallResponse {
    constructor() {
        //猜牌的回复
        //只有当前用户可以继续call，其它用户只能过，当前用户也可以过
        this.call = EmptyCall();
        this.token = "";
        this.type = MessageType.CALL;
    }
}
exports.CallResponse = CallResponse;
