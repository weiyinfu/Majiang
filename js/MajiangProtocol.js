"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
每一种回复都应该定义一种类型，这样能够使得不同回复便于更改
每个Reply都有一个token字段用于标志此回复的正确性
 */
var MessageType;
(function (MessageType) {
    MessageType["START"] = "start";
    MessageType["FETCH"] = "fetch";
    MessageType["AN_GANG"] = "an_gang";
    MessageType["RELEASE"] = "release";
    MessageType["EAT"] = "eat";
    MessageType["PENG"] = "peng";
    MessageType["MING_GANG"] = "ming_gang";
    MessageType["OVER"] = "over";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var ReleaseReplyMode;
(function (ReleaseReplyMode) {
    //对用户弃牌的反应
    ReleaseReplyMode["EAT"] = "eat";
    ReleaseReplyMode["PENG"] = "peng";
    ReleaseReplyMode["PASS"] = "pass";
    ReleaseReplyMode["HU"] = "hu";
    ReleaseReplyMode["MING_GANG"] = "ming_gang";
})(ReleaseReplyMode = exports.ReleaseReplyMode || (exports.ReleaseReplyMode = {}));
var FetchReplyMode;
(function (FetchReplyMode) {
    //摸牌的用户的反应
    FetchReplyMode["RELEASE"] = "release";
    FetchReplyMode["AN_GANG"] = "an_gang";
    FetchReplyMode["HU_SELF"] = "hu_self";
    FetchReplyMode["PASS"] = "pass";
})(FetchReplyMode = exports.FetchReplyMode || (exports.FetchReplyMode = {}));
var OverMode;
(function (OverMode) {
    //游戏结束的三种原因，胡牌，自摸胡，没牌了
    OverMode["HU"] = "hu";
    OverMode["HU_SELF"] = "hu_self";
    OverMode["NO_CARD"] = "no_card";
})(OverMode = exports.OverMode || (exports.OverMode = {}));
class ReleaseReply {
    constructor() {
        this.mode = ReleaseReplyMode.PASS;
        this.show = []; //需要显示的牌，只有吃牌的时候才要求显示show，因为碰牌和杠牌显然都是与弃牌相同
        this.token = "";
        this.type = MessageType.RELEASE;
    }
}
exports.ReleaseReply = ReleaseReply;
class FetchReply {
    constructor() {
        this.release = "";
        this.token = "";
        this.type = MessageType.FETCH;
        this.mode = FetchReplyMode.RELEASE;
    }
}
exports.FetchReply = FetchReply;
class EatReply {
    constructor() {
        //收到吃牌消息后的回复，只有正在吃牌的人需要弃牌
        this.release = ""; //吃完牌之后弃掉的牌
        this.token = "";
        this.type = MessageType.EAT;
    }
}
exports.EatReply = EatReply;
class PengReply {
    constructor() {
        //收到碰牌消息后的回复，只有正在碰牌的人需要弃牌
        this.release = ""; //碰完牌之后需要弃掉一张牌
        this.token = "";
        this.type = MessageType.PENG;
    }
}
exports.PengReply = PengReply;
class OverReply {
    constructor() {
        this.token = "";
        this.type = MessageType.OVER;
    }
}
exports.OverReply = OverReply;
class StartReply {
    constructor() {
        this.token = "";
        this.type = MessageType.START;
    }
}
exports.StartReply = StartReply;
class AnGangReply {
    constructor() {
        this.token = "";
        this.type = MessageType.AN_GANG;
    }
}
exports.AnGangReply = AnGangReply;
class MingGangReply {
    constructor() {
        this.token = "";
        this.type = MessageType.MING_GANG;
    }
}
exports.MingGangReply = MingGangReply;
class ReleaseRequest {
    constructor() {
        //有用户弃牌:turn用户弃了card，返回弃牌
        this.turn = -1;
        this.card = "";
        this.type = MessageType.RELEASE;
        this.token = "";
    }
}
exports.ReleaseRequest = ReleaseRequest;
class FetchRequest {
    constructor() {
        //摸牌，如果当前AI的turn等于传入的turn，那么card应该为空
        this.turn = -1;
        this.card = "";
        this.type = MessageType.FETCH;
        this.token = "";
    }
}
exports.FetchRequest = FetchRequest;
class EatRequest {
    constructor() {
        //有用户吃牌：turn用户亮出了cards，最后一张牌表示吃掉的那张牌
        this.turn = -1;
        this.cards = [];
        this.type = MessageType.EAT;
        this.token = "";
    }
}
exports.EatRequest = EatRequest;
class PengRequest {
    constructor() {
        //碰的牌为上次ReleaseRequest的那张牌
        this.turn = -1;
        this.type = MessageType.PENG;
        this.token = "";
    }
}
exports.PengRequest = PengRequest;
class StartRequest {
    constructor() {
        //游戏开始，userCount表示本局玩家个数
        this.cards = [];
        this.turn = -1;
        this.userCount = -1;
        this.type = MessageType.START;
        this.token = "";
    }
}
exports.StartRequest = StartRequest;
class OverRequest {
    constructor() {
        //游戏结束
        this.winner = -1;
        this.mode = OverMode.HU;
        this.type = MessageType.OVER;
        this.token = "";
    }
}
exports.OverRequest = OverRequest;
class AnGangRequest {
    constructor() {
        this.type = MessageType.AN_GANG;
        this.token = "";
        this.turn = -1;
    }
}
exports.AnGangRequest = AnGangRequest;
class MingGangRequest {
    constructor() {
        this.type = MessageType.MING_GANG;
        this.token = "";
        this.turn = -1;
    }
}
exports.MingGangRequest = MingGangRequest;
