/*一切皆Handler，服务器和客户端都可以抽象成Handler，
* onMessage负责处理输入，postMessage负责输出
 */
export interface Handler {
    //我接受别人的消息
    onMessage(message: any): void;

    //我向别人发送消息的操作
    postMessage(message: any): void;
}
