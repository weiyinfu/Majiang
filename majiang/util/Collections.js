"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HashMap {
    constructor(a) {
        this.a = a;
        this.total = this.a.reduce((o, n) => o + n, 0);
        this.keys = new Set();
        for (let i = 0; i < this.a.length; i++) {
            if (this.a[i]) {
                this.keys.add(i);
            }
        }
    }
    remove(x) {
        if (this.a[x] <= 0) {
            throw new Error('remove element error');
        }
        this.a[x]--;
        this.total--;
        if (this.a[x] == 0) {
            this.keys.delete(x);
        }
    }
    add(x) {
        this.a[x]++;
        this.total++;
        this.keys.add(x);
    }
}
exports.HashMap = HashMap;
