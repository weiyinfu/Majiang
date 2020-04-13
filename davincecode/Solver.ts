/**
 * 达芬奇密码求解器接口
 * */
import {Call} from "./DavinceCodeProtocol";

export interface Solver {
    getAdvice(hand: string[][], badCalls: Call[]): string[][][];
}
