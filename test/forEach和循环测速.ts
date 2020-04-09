import {randInt, range} from "../majiang/util/Utils";

/**
 * for循环的速度是最快的，比forEach，forOf，forIn都要快，所以尽量使用for循环，不要使用奇技淫巧
 | 0    │   'useFor'   │  424  │
 │    1    │ 'useForEach' │ 16621 │
 │    2    │  'useForOf'  │ 2183  |
 * */
const n = 1000000;
const a = range(n).map(x => randInt(0, n));

function go(f: () => void, cases: number) {
    const beg = new Date()
    for (let cas = 0; cas < cases; cas++) {
        f();
    }
    const end = new Date()
    return end.getTime() - beg.getTime();
}

function useForEach() {
    a.forEach(x => {
        const y = 2 * x;
    });
}

function useFor() {
    for (let i = 0; i < a.length; i++) {
        const y = 2 * a[i];
    }
}

function useForOf() {
    for (let i of a) {
        const y = 2 * i;
    }
}

const caseCount = 1000;
const funcs = [useFor, useForEach, useForOf];
const ans = []
for (const f of funcs) {
    ans.push({
        name: f.name,
        time: go(f, caseCount)
    })
}
console.table(ans)