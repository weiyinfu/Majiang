/*
每一种回复都应该定义一种类型，这样能够使得不同回复便于更改
每个Reply都有一个token字段用于标志此回复的正确性
 */
export enum MessageType {
    START = "start",
    FETCH = "fetch",
    AN_GANG = "an_gang",
    RELEASE = "release",
    EAT = "eat",
    PENG = "peng",
    MING_GANG = "ming_gang",
    OVER = "over",
}


export enum ReleaseReplyMode {
    //对用户弃牌的反应
    EAT = "eat",
    PENG = "peng",
    PASS = "pass",
    HU = "hu",
    MING_GANG = "ming_gang",//明杠
}

export enum FetchReplyMode {
    //摸牌的用户的反应
    RELEASE = "release",//弃牌
    AN_GANG = "an_gang",//暗杠
    HU_SELF = "hu_self",//自摸胡，需要与hu区分开
    PASS = "pass",//与我无关
}

export enum OverMode {
    //游戏结束的三种原因，胡牌，自摸胡，没牌了
    HU = "hu",//胡
    HU_SELF = "hu_self",//自摸胡
    NO_CARD = "no_card",//没牌了
}

export class ReleaseReply {
    mode: ReleaseReplyMode = ReleaseReplyMode.PASS;
    show: string[] = [];//需要显示的牌，只有吃牌的时候才要求显示show，因为碰牌和杠牌显然都是与弃牌相同
    token: string = "";
    type = MessageType.RELEASE;
}

export class FetchReply {
    release: string = "";
    token: string = "";
    type = MessageType.FETCH;
    mode: FetchReplyMode = FetchReplyMode.RELEASE;
}

export class EatReply {
    //收到吃牌消息后的回复，只有正在吃牌的人需要弃牌
    release: string = "";//吃完牌之后弃掉的牌
    token: string = "";
    type = MessageType.EAT;
}

export class PengReply {
    //收到碰牌消息后的回复，只有正在碰牌的人需要弃牌
    release: string = "";//碰完牌之后需要弃掉一张牌
    token: string = "";
    type = MessageType.PENG;
}

export class OverReply {
    token: string = "";
    type = MessageType.OVER;
}

export class StartReply {
    token: string = "";
    type = MessageType.START;
}

export class AnGangReply {
    token: string = "";
    type = MessageType.AN_GANG;
}

export class MingGangReply {
    token: string = "";
    type = MessageType.MING_GANG;
}

export class ReleaseRequest {
    //有用户弃牌:turn用户弃了card，返回弃牌
    turn: number = -1;
    card: string = "";
    type = MessageType.RELEASE;
    token: string = "";
}

export class FetchRequest {
    //摸牌，如果当前AI的turn等于传入的turn，那么card应该为空
    turn: number = -1;
    card: string = "";
    type = MessageType.FETCH;
    token: string = "";
}

export class EatRequest {
    //有用户吃牌：turn用户亮出了cards，最后一张牌表示吃掉的那张牌
    turn: number = -1;
    cards: string[] = [];
    type = MessageType.EAT;
    token: string = "";
}

export class PengRequest {
    //碰的牌为上次ReleaseRequest的那张牌
    turn: number = -1;
    type = MessageType.PENG;
    token: string = "";
}

export class StartRequest {
    //游戏开始，userCount表示本局玩家个数
    cards: string[] = [];
    turn: number = -1;
    userCount: number = -1;
    type: MessageType = MessageType.START;
    token: string = "";
}

export class OverRequest {
    //游戏结束
    winner: number = -1;
    mode: OverMode = OverMode.HU;
    type = MessageType.OVER;
    token: string = "";
}

export class AnGangRequest {
    type = MessageType.AN_GANG;
    token: string = "";
    turn: number = -1;
}

export class MingGangRequest {
    type = MessageType.MING_GANG;
    token: string = "";
    turn: number = -1;
}
