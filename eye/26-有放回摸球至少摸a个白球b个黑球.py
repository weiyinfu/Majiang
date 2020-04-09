from fractions import Fraction
import random
import numpy as np


def bruteforce(m, n, a, b):
    """
    暴力求解
    两种球分别有m，n个，想要摸到a，b个
    有放回
    """
    cas = 10000
    # 因为不放回，所以摸的次数可能会很大
    fetch_count_dict = np.zeros(1000)
    for i in range(cas):
        pocket = [0] * m + [1] * n
        aa, bb = 0, 0
        fetch_count = 0
        while aa < a or bb < b:
            x = random.choice(pocket)
            fetch_count += 1
            if x == 0:
                aa += 1
            elif x == 1:
                bb += 1
        fetch_count_dict[fetch_count] += 1
    return np.dot(np.arange(len(fetch_count_dict)), fetch_count_dict / cas)


f_dict = {}


def f(m, n, a, b):
    """
    m个白球，n个黑球，想要摸到a个白球，b个黑球
    用递推式的方式计算准确结果，结果使用分数表示
    """
    param = (m, n, a, b)
    if param in f_dict:
        return f_dict[param]
    assert m >= 0 and n >= 0 and a >= 0 and b >= 0
    assert a <= m and b <= n
    if a == 0 and b == 0:
        return 0
    if a == 0 or b == 0:
        if b == 0:
            return Fraction(a, Fraction(m, m + n))
        if a == 0:
            return Fraction(b, Fraction(n, m + n))
    x = Fraction(m, m + n)
    y = Fraction(n, m + n)
    ans = 1 + x * f(m, n, a - 1, b) + y * f(m, n, a, b - 1)
    f_dict[param] = ans
    return ans


def test_f():
    for m in range(1, 6):
        for n in range(1, 6):
            for a in range(1, m + 1):
                for b in range(1, n + 1):
                    ans = f(m, n, a, b)
                    print((m, n, a, b),
                          '暴力', '%.3f' % bruteforce(m, n, a, b),
                          '准确', ans, '%.3f' % float(ans))


test_f()
