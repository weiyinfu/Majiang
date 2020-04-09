"use strict";
/**
 * 一切皆Handler，服务器和客户端都可以抽象成Handler，
 * onMessage负责处理输入，postMessage负责输出
 */
Object.defineProperty(exports, "__esModule", { value: true });
function emptyHandler(message) {
    throw new Error(`NULL message handler on ${JSON.stringify(message, null, 2)}`);
}
exports.emptyHandler = emptyHandler;
class ReverseHandler {
    constructor(handler) {
        this.onMessage = emptyHandler;
        this.handler = handler;
        this.handler.postMessage = (message) => {
            //注意，此处不能直接写成this.handler.postMessage=this.onMessage，因为this.onMessage是会变化的
            this.onMessage(message);
        };
    }
    postMessage(message) {
        this.handler.onMessage(message);
    }
    ;
}
exports.ReverseHandler = ReverseHandler;
