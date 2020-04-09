"""
在单位圆上，随机选择n个点，它们落在角度为theta的扇形内的概率是多少？
"""
import numpy as np

from scipy.special import comb


def ok(p, theta):
    # 给定一堆点，判断这些点之间的环状距离是否小于theta
    turn = (0.5 + p) % 1
    return np.max(p) - np.min(p) < theta or np.max(turn) - np.min(turn) < theta


def bruteforce(n, theta, case_count=10000):
    theta %= np.pi * 2
    theta /= np.pi * 2
    point = np.random.random((case_count, n))
    got = 0
    for p in point:
        if ok(p, theta):
            got += 1
    return got / case_count


def two(theta):
    # 当n等于2时
    return theta / np.pi


def three(theta):
    # 当n等于3时
    return 3 / 4 * (theta / np.pi) ** 2


def f(n, theta):
    """
    原理是：n条线可以扩展成2n条线，从这2n条线里面选出n条线来，要想保证满足要求，那么有2n种选法
    """
    assert theta <= np.pi, '如果theta>=np.pi,结果必定为1'
    return 2 * n / (2 ** n) * (theta / np.pi) ** (n - 1)


def test1():
    theta = 1
    print(bruteforce(2, theta), two(theta))
    print(bruteforce(3, theta, case_count=10000), three(theta))
    print('当theta固定为pi时')
    for i in range(1, 10):
        print(i, bruteforce(i, np.pi), 2 * i / 2 ** i, f(i, np.pi))
    print(bruteforce(10, np.pi * 1.5), f(10, 1.5 * np.pi))


def test2():
    import matplotlib.pyplot as plt
    from tqdm import tqdm
    x = np.linspace(0, np.pi, 50)
    y = [bruteforce(3, i) for i in tqdm(x)]
    yy = [f(3, i) for i in x]
    plt.plot(y)
    plt.plot(yy)
    plt.show()


test2()
