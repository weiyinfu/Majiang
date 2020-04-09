"""
从一个装有m个白球，n个黑球的袋中摸球，直到摸到k个白球为止，每次从中任取一球，求取出黑球数的数学期望
考虑有放回和无放回两种情况

暴力打表，把小数转成分数，找规律，也能解决这个问题
"""
import numpy as np

from scipy.special import comb as c


def bruteforce(m, n, k):
    a = [0] * m + [1] * n
    b = np.zeros(n + k + 1)
    case = 10000
    for i in range(case):
        al = a[:]
        fetch_count = 0
        white_count = 0
        while True:
            fetch_count += 1
            ball = np.random.choice(al)
            al.remove(ball)
            if ball == 0:
                white_count += 1
                if white_count == k:
                    break
        b[fetch_count] += 1
    b /= case
    return np.dot(np.arange(len(b)), b)


def good(m, n, k):
    return (m + n + 1) * k / (m + 1)


def test():
    for m in range(1, 5):
        for n in range(1, 5):
            for k in range(1, m + 1):  # 至少摸k个白球
                print(m, n, k, '暴力', bruteforce(m, n, k), '好方法', good(m, n, k))


test()
