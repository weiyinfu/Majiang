let ma = null;

function getProblem(n) {
    ma = new Map()
    for (let i = 0; i < n; i++) {
        ma.set(i, Math.random());
    }
}


function go(f, caseCount) {
    let beg = new Date().getTime();
    while (caseCount > 0) {
        caseCount--;
        f()
    }
    let end = new Date().getTime()
    return end - beg;
}

function forEach() {
    let s = 0;
    ma.forEach(x => {
        s += x[1];
    })
    return s;
}

function useIterator() {
    let s = 0;
    const x = ma.entries();
    while (1) {
        const now = x.next();
        if (now.done) break;
        s += x[1];
    }
    return s;
}

const table = []
const caseCount = 100;
for (let n of [1000, 10000, 100000, 1000000, 10000000]) {
    getProblem(n)
    for (let f of [useIterator, forEach]) {
        table.push({
            n,
            name: f.name,
            time: go(f, caseCount)
        })
        console.log(table[table.length - 1])
    }
}
console.table(table)
