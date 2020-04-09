/**
 * 工具函数集合
 * */
import seedrandom from "seedrandom";
//默认随机数产生器的seed是固定的，如果是生产环境，需要设置随机数种子随机
let $ = seedrandom('天下大事，为我所控');

export function init(x: string) {
    $ = seedrandom(x)
}

export function random() {
    return $.quick();
}

export function randInt(beg: number, end: number) {
    //获取[beg,end)之间的随机整数
    const sz = end - beg;
    let v = $.int32() % sz;
    if (v < 0) v += sz;
    return v + beg;
}

export function swap<T>(a: T[], x: number, y: number) {
    //交换数组a中x处和y处的元素
    const temp: T = a[x];
    a[x] = a[y];
    a[y] = temp;
}

export function shuffle<T>(a: T[]): void {
    for (let i = 0; i < a.length; i++) swap(a, i, randInt(i, a.length));
}

export function remove<T>(a: T[], removing: T[]): void {
    //移除数组a中的removing
    for (const i of removing) {
        if (!i) throw new Error('removing what');
        const ind = a.indexOf(i);
        if (ind === -1) throw new Error(`removing non-exist element ${i}`);
        a.splice(ind, 1)
    }
}

export function getCount<T>(a: T[], ele: T) {
    //获取数组a中元素ele的个数
    return a.reduce((o, n) => o + (n === ele ? 1 : 0), 0);
}

export function ll(n: number) {
    //创建一个二维列表，第一维有n个元素
    const a = new Array(n);
    for (let i = 0; i < n; i++) a[i] = [];
    return a;
}

export function li<T>(n: number, value: T): T[] {
    //创建一个含n个元素的一维数组，用value填充
    const a = new Array(n);
    for (let i = 0; i < n; i++) a[i] = value;
    return a;
}

export function randChoose(a: any[]) {
    //从数组a中随机选取一个元素
    return a[randInt(0, a.length)];
}

export function flat(...a: any[]) {
    //把数组a展平
    let b: any[] = [];
    for (let i of a) {
        if (i instanceof Array) {
            b = b.concat(flat(...i));
        } else {
            b.push(i);
        }
    }
    return b;
}

export function range(n: number) {
    return {
        forEach(callback: (x: number) => void) {
            for (let i = 0; i < n; i++)
                callback(i);
        },
        map<T>(callback: (x: number) => T) {
            const ans = []
            for (let i = 0; i < n; i++) {
                ans.push(callback(i));
            }
            return ans;
        }
    }
}

export function deepcopy<T>(o: T): T {
    return JSON.parse(JSON.stringify(o))
}