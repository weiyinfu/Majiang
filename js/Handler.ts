/**
 * 一切皆Handler，服务器和客户端都可以抽象成Handler，
 * onMessage负责处理输入，postMessage负责输出
 */

export type MessageFunction = (message: any) => void;

export function emptyHandler(message: any): void {
    throw new Error(`NULL message handler on ${JSON.stringify(message, null, 2)}`);
}

export interface Handler {
    //我接受别人的消息
    onMessage(message: any): void;

    //我向别人发送消息的操作
    postMessage(message: any): void;
}

export class ReverseHandler implements Handler {
    /**
     * Handler反向器
     * 原来发消息的接口现在用于收消息
     * 原来收消息的接口，现在用于发消息
     * 它的用途是把各个Handler拼接起来，一切皆Handler。
     */
    handler: Handler;
    onMessage: MessageFunction = emptyHandler;

    constructor(handler: Handler) {
        this.handler = handler;
        this.handler.postMessage = (message) => {
            //注意，此处不能直接写成this.handler.postMessage=this.onMessage，因为this.onMessage是会变化的
            this.onMessage(message)
        };
    }

    postMessage(message: any): void {
        this.handler.onMessage(message);
    };
}
