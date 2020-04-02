export function randInt(beg: number, end: number) {
    //获取[beg,end)之间的随机整数
    return Math.floor(Math.random() * (end - beg)) + beg
}

export function swap<T>(a: T[], x: number, y: number) {
    //交换数组a中x处和y处的元素
    const temp: T = a[x];
    a[x] = a[y];
    a[y] = temp;
}

export function shuffle<T>(a: T[]): void {
    for (var i = 0; i < a.length; i++) swap(a, i, randInt(i, a.length));
}

export function remove<T>(a: T[], removing: T[]): void {
    //移除数组a中的removing
    for (const i of removing) {
        if (!i) throw 'baga';
        const ind = a.indexOf(i);
        if (ind === -1) throw `removing non-exist element ${i}`;
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

export function flat(a: any[]) {
    //把数组a展平
    let b: any[] = [];
    for (let i of a) {
        if (i instanceof Array) {
            b = b.concat(flat(i));
        } else {
            b.push(i);
        }
    }
    return b;
}

export function range(n: number): number[] {
    const a: number[] = []
    for (let i = 0; i < n; i++) a.push(i)
    return a
}


export function deepcopy<T>(o: T): T {
    return JSON.parse(JSON.stringify(o))
}
