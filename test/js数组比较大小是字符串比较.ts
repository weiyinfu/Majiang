/**
 * js 数组比较大小 的大坑
 * 当比较两个对象时，如果是基础类型，则直接比较
 * 如果不是基础类型，会把结果变成字符串，然后比较
 * **/
const a = [[1, 2], [131, 3], [22, 3], [13, 1]]
a.sort()
console.log('会发现排序结果是按照字符串排序的', a)
