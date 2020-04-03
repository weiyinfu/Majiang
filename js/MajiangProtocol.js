"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 每一种回复都应该定义一种类型，这样能够使得不同回复便于更改
 * 每个Response都有一个token字段用于标志此回复的正确性
 * 接口的设计应该就是设计一堆Request和Response，接口的设计应该以对象为主体，
 * 而不是以函数为主体。每个函数只接受一个Request对象，返回一个Response对象。
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
var ReleaseResponseMode;
(function (ReleaseResponseMode) {
    //对用户弃牌的反应
    ReleaseResponseMode["EAT"] = "eat";
    ReleaseResponseMode["PENG"] = "peng";
    ReleaseResponseMode["PASS"] = "pass";
    ReleaseResponseMode["HU"] = "hu";
    ReleaseResponseMode["MING_GANG"] = "ming_gang";
})(ReleaseResponseMode = exports.ReleaseResponseMode || (exports.ReleaseResponseMode = {}));
var FetchResponseMode;
(function (FetchResponseMode) {
    //摸牌的用户的反应
    FetchResponseMode["RELEASE"] = "release";
    FetchResponseMode["AN_GANG"] = "an_gang";
    FetchResponseMode["HU_SELF"] = "hu_self";
    FetchResponseMode["PASS"] = "pass";
})(FetchResponseMode = exports.FetchResponseMode || (exports.FetchResponseMode = {}));
var OverMode;
(function (OverMode) {
    //游戏结束的三种原因，胡牌，自摸胡，没牌了
    OverMode["HU"] = "hu";
    OverMode["HU_SELF"] = "hu_self";
    OverMode["NO_CARD"] = "no_card";
})(OverMode = exports.OverMode || (exports.OverMode = {}));
class ReleaseResponse {
    constructor() {
        this.mode = ReleaseResponseMode.PASS;
        this.show = []; //需要显示的牌，只有吃牌的时候才要求显示show，因为碰牌和杠牌显然都是与弃牌相同
        this.token = "";
        this.type = MessageType.RELEASE;
    }
}
exports.ReleaseResponse = ReleaseResponse;
class FetchResponse {
    constructor() {
        this.release = "";
        this.token = "";
        this.type = MessageType.FETCH;
        this.mode = FetchResponseMode.RELEASE;
    }
}
exports.FetchResponse = FetchResponse;
class EatResponse {
    constructor() {
        //收到吃牌消息后的回复，只有正在吃牌的人需要弃牌
        this.release = ""; //吃完牌之后弃掉的牌
        this.token = "";
        this.type = MessageType.EAT;
    }
}
exports.EatResponse = EatResponse;
class PengResponse {
    constructor() {
        //收到碰牌消息后的回复，只有正在碰牌的人需要弃牌
        this.release = ""; //碰完牌之后需要弃掉一张牌
        this.token = "";
        this.type = MessageType.PENG;
    }
}
exports.PengResponse = PengResponse;
class OverResponse {
    constructor() {
        this.token = "";
        this.type = MessageType.OVER;
    }
}
exports.OverResponse = OverResponse;
class StartResponse {
    constructor() {
        this.token = "";
        this.type = MessageType.START;
    }
}
exports.StartResponse = StartResponse;
class AnGangResponse {
    constructor() {
        this.token = "";
        this.type = MessageType.AN_GANG;
    }
}
exports.AnGangResponse = AnGangResponse;
class MingGangResponse {
    constructor() {
        this.token = "";
        this.type = MessageType.MING_GANG;
    }
}
exports.MingGangResponse = MingGangResponse;
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
