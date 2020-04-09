/**
 * map的key总是字符串，所以应该使用Map
 * */
let ma: { [index: number]: number } = {
    2: 3,
    4: 5
}
console.log(ma)
for (let i in ma) {
    console.log(typeof i)
}
let map: Map<number, number> = new Map<number, number>();
for (let i in ma) {
    map.set(parseInt(i), ma[i])
}
console.log(map)
console.log(map.get(7))
console.log(map.values())
console.log(map.keys())
console.log('======')
//下面这句话什么都不打印
for (let i in map.entries()) console.log(i)
map.forEach((v, k) => {
    console.log(`${k}=${v}`)
})
//只要是for-in循环，必定是字符串
for (let i in map) {
    console.log(typeof i)
}
