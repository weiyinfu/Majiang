"""
从一个装有m个白球，n个黑球的袋中摸球，直到摸到白球为止，每次从中任取一球，求取出黑球数的数学期望
考虑有放回和无放回两种情况

有放回的话：每次摸到白球的概率都是p=m/(m+n)，所以期望摸1/p次
无放回的话：摸k次才行的概率为n/(m+n)*(n-1)/(m+n-1)...*m/(m+n-(k-1)),直接累加求和。最终答案就是
(m+1)/(m+n+1)

暴力打表，把小数转成分数，找规律，也能解决这个问题
"""
import numpy as np

from scipy.special import comb as c


def bruteforce(m, n):
    a = [0] * m + [1] * n
    b = np.zeros(n + 2)
    case = 10000
    for i in range(case):
        al = a[:]
        cnt = 0
        while True:
            cnt += 1
            ball = np.random.choice(al)
            al.remove(ball)
            if ball == 0:
                break
        b[cnt] += 1
    b /= case
    return np.dot(np.arange(len(b)), b)


def good(m, n):
    s = np.zeros(n + 2)
    for i in range(1, n + 2):
        # 摸i次
        now = 1
        for k in range(1, i):
            # 第k次摸
            now *= (n - (k - 1)) / (m + n - (k - 1))
        # 最后一次摸
        now *= m / (m + n - (i - 1))
        s[i] = now
    return np.dot(s, np.arange(len(s)))


def test():
    for m in range(1, 5):
        for n in range(1, 5):
            print(m, n, '暴力', bruteforce(m, n), '好方法', good(m, n))


test()
