const ma = new Map()
ma.set(1, 2)
ma.set(2, 3)
ma.set(3, 4)
const e = ma.entries()
while (1) {
    const now = e.next()
    if (now.done) break;
    if (now.value[0] === 2) ma.set(4, 5);
    console.log(now)
}