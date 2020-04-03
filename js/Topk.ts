import {swap} from "./Utils";

/**
 * 使用优先队列寻找topk元素
 * 维护一个小顶堆，小顶堆寻找的是最大的top k个元素
 * 它只有插入操作，没有删除操作。
 * 当插入时，如果堆未满，则在堆尾插入，然后上移
 * 如果堆已经满了，则与堆顶（整个堆中的最小元素）比较，如果大于堆顶，则替换堆顶元素并将堆顶元素尝试下移
 * */
export type Comparer<T> = (x: T, y: T) => number;
export type KeyComparer<T> = (x: T) => number;

export function compareKey<T>(toInt: KeyComparer<T>): Comparer<T> {
    return (x, y) => {
        return toInt(x) - toInt(y);
    };
}

export class Topk<T> {
    //基于堆实现优先队列，保留最大的那些元素，所以需要构建一个小顶堆
    size: number;//堆的总空间
    count: number;//堆中元素个数
    private readonly a: T[];
    private readonly comparer: Comparer<T>;

    constructor(size: number, comparer: Comparer<T>) {
        this.size = size;
        this.a = new Array(this.size + 1);
        this.count = 0;
        this.comparer = comparer;
    }

    private up(i: number) {
        //把节点往上移动
        while (1) {
            const f = i >> 1;
            if (f == 0) return;
            if (this.comparer(this.a[i], this.a[f]) < 0) {
                swap(this.a, i, f);
            }
            i = f;
        }
    }

    private down(i: number) {
        //把节点往下移动
        while (1) {
            let l = i << 1, r = i << 1 | 1;
            if (l > this.count) return;
            if (r <= this.count)
                l = this.comparer(this.a[l], this.a[r]) > 0 ? r : l;
            if (this.comparer(this.a[i], this.a[l]) > 0) {
                swap(this.a, l, i);
            }
            i = l;
        }
    }

    push(x: T) {
        if (this.count < this.size) {
            this.a[++this.count] = x;
            this.up(this.count);
        } else {
            if (this.comparer(x, this.a[1]) > 0) {
                this.a[1] = x;
                this.down(1);
            }
        }
    }

    toList(): T[] {
        return this.a.slice(1, this.count + 1);
    }
}
