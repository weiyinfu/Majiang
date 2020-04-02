/**
 * 如果接口的参数个数大于子类实现的参数个数，不会报错，实际上另一个参数相当于undefined。
 * 如果子类的参数个数大于接口的参数个数，会报错。
 * */
interface Shape {
    area(s: number, ss: number): number;
}

class Rectangle implements Shape {
    area(s: number): number {
        return s;
    }
}

let big: (s: number, ss: number) => number;
big = function (s: number, ss: number) {
    return s + ss;
};
let small: (s: number) => number;
small = function (s: number) {
    return s;
};
// small=big; small=big会报错
big = small;//big=small不会报错