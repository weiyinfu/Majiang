import math
from typing import List
import numpy as np

"""
一些工具函数
"""


def split(n, k):
    # 数字n可以分成k份有几种分法
    if k > n:
        return
    a = [1] * (k - 1) + [n - (k - 1)]
    mi, ma = math.floor(n / k), math.ceil(n / k)
    while 1:
        yield tuple(a)
        if a[0] == mi and a[-1] == ma:
            return
        # 寻找倒数第一个小于a[-1]-1的元素
        i = len(a) - 1
        while a[i] >= a[-1] - 1:
            i -= 1
        a[i] += 1
        for j in range(i + 1, len(a) - 1):
            a[j] = a[j - 1]
        a[-1] = n - sum(a[:-1])


def split_all(n):
    # 数字n可以分成任意份，返回所有的情况
    for k in range(1, n + 1):
        for j in split(n, k):
            yield j


def choose(a: List[int], b: int):
    # a[i]表示第i种牌的个数，b表示要从a中选择b张牌，返回有多少种选法
    rem = {}

    def go(a: List[int], ind: int, b: int):
        k = (ind, b)
        if k in rem:
            return rem[k]
        if ind >= len(a):
            return 1 if b == 0 else 0
        mi = min(a[ind], b)
        s = 0
        for i in range(0, mi + 1):
            now = go(a, ind + 1, b - i)
            s += now
        rem[k] = s
        return s

    ans = go(a, 0, b)
    return ans

