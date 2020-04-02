"""
从一个装有m个白球，n个黑球的袋中摸球，直到摸到a个白球，b个黑球为止，每次从中任取一球，求取出黑球数的数学期望
考虑有放回和无放回两种情况

暴力打表，把小数转成分数，找规律

期望是多少，摸球次数的分布是什么函数。
摸球k次才能成功的概率是多少？
"""
import numpy as np
from fractions import Fraction

from scipy.special import comb as c


def bruteforce(m, n, x, y):
    a = [0] * m + [1] * n
    b = np.zeros(m + n + 1)
    case = 10000
    for i in range(case):
        al = a[:]
        fetch_count = 0
        white_count = 0
        black_count = 0
        while True:
            fetch_count += 1
            ball = np.random.choice(al)
            al.remove(ball)
            if ball == 0:
                white_count += 1
            else:
                black_count += 1
            if white_count >= x and black_count >= y:
                break
        b[fetch_count] += 1
    b /= case
    return np.dot(np.arange(len(b)), b)


f_dict = {}


def f(m, n, a, b):
    """
    m个白球，n个黑球，想要摸到a个白球，b个黑球
    用递推式的方式计算准确结果，结果使用分数表示
    """
    assert a >= 0 and b >= 0 and m >= 0 and n >= 0
    assert a <= m and b <= n
    param = (m, n, a, b)
    if param in f_dict:
        return f_dict[param]
    if a == 0 and b == 0:
        f_dict[param] = 0
        return 0
    if m == 0 or n == 0:
        f_dict[param] = max(a, b)
        return max(a, b)
    x = Fraction(m, m + n)
    y = Fraction(n, m + n)
    ans = 1 + x * f(m - 1, n, max(a - 1, 0), b) + y * f(m, n - 1, a, max(b - 1, 0))
    f_dict[param] = ans
    return ans


def guess(m, n, a, b):
    """
    猜测出来的公式
    先把较少次数的那种球摸够，然后再摸需要较多次数的那种球
    然而，结果并不对
    """

    def h(m, n, a):
        return Fraction((m + n + 1) * a, m + 1)

    def g(m, n, a, b):
        mm = h(m, n, a)  # 把第一种球摸够所需要的次数
        contain2 = mm - a  # 包含第二种球的个数
        left1 = m - a  # 第一种球剩余个数
        left2 = n - contain2  # 第二种球剩余个数
        need2 = b - contain2  # 还需要的第二种球的个数
        still = h(left2, left1, need2)  # 把第二种球摸够所需要的次数
        ans = still + mm
        return ans

    mm = h(m, n, a)
    nn = h(n, m, b)
    if mm < nn:
        return g(m, n, a, b)
    else:
        return g(n, m, b, a)


def print_dict():
    for k, v in f_dict.items():
        print(k, v)


def test_f():
    # 测试递推公式的正确性
    ma = 4
    for m in range(1, ma):
        for n in range(1, ma):
            for a in range(1, m + 1):  # 至少摸a个白球
                for b in range(1, n + 1):  # 至少摸b个黑球
                    ans = f(m, n, a, b)
                    print(m, n, a, b, '暴力', bruteforce(m, n, a, b), '好方法', ans, float(ans))


def print_table():
    """
    打表找规律
    """
    m, n = 3, 2
    for a in range(m + 1):
        print(a, end=':')
        for b in range(n + 1):
            print(f"{f(m, n, a, b) - a - b}", end=' ')
        print()


# test_f()
print_table()
