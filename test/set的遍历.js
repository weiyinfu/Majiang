const x = new Set();
x.add(3)
x.add(4)
for (let i in x) {
    console.log(i)
}
console.log('=====')
for (let i of x) {
    console.log(i, typeof i)
}
console.log('========')
const ma = new Map()
ma[1] = 2
ma[2] = 3
console.log('for in 遍历map')
for (let i in ma) {
    console.log(i, typeof i)
}
console.log('for of iterate map')
for (let i of ma) {
    console.log(i, typeof i)
}
console.log('use iterator')
const ks=ma.keys()
while(ks){
    console.log(next(ks))
}