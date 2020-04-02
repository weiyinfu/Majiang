/*
* 在网上发现一个很傻的shuffle算法
* 这个算法的复杂度挺高，会交换的次数有点多。而经典的shuffle算法则是O(n)复杂度。
* 排序算法的复杂度O(n^2)或者O(nlogn)，这里的复杂度就是交换次数的复杂度。把这个数字乘以二分之一就是这个傻算法的交换次数。
* 据我估计，这个很傻的shuffle算法复杂度为nlogn
* */
let callCount = 0;

function shuffle(a) {
    return a.sort((x, y) => {
        callCount++
        return Math.random() - 0.5
    })
}

function goodShuffle(a) {
    for (let i = 0; i < a.length; i++) {
        let temp = a[i];
        let ind = Math.floor(Math.random() * (a.length - i)) + i;
        a[i] = a[ind]
        a[ind] = temp;
    }
}

const get = (n) => {
    const a = []
    for (let i = 0; i < n; i++) a.push(i);
    return a
}
const n = 100;
let a = get(n)
shuffle(a)
console.log(a)
let b = get(10)
goodShuffle(b)
console.log(b)
console.log(callCount + "  " + n * Math.log(n))
