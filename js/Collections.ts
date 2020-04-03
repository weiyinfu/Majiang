export class HashMap {
    /**
     * 数组管理器，a相当于一个哈希表，set相当于这个哈希表中的全部key，total表示哈希表中元素个数
     * */
    a: number[];
    keys: Set<number>;
    total: number;//牌堆中的全部牌数

    constructor(a: number[]) {
        this.a = a;
        this.total = this.a.reduce((o, n) => o + n, 0)
        this.keys = new Set<number>();
        for (let i = 0; i < this.a.length; i++) {
            if (this.a[i]) {
                this.keys.add(i);
            }
        }
    }

    remove(x: number) {
        if (this.a[x] <= 0) {
            throw new Error('remove element error');
        }
        this.a[x]--;
        this.total--;
        if (this.a[x] == 0) {
            this.keys.delete(x);
        }
    }

    add(x: number) {
        this.a[x]++;
        this.total++;
        this.keys.add(x);
    }
}
