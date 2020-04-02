from fractions import Fraction

import matplotlib.pyplot as plt
import numpy as np

"""
多维，多目标摸球问题

袋子里面有若干个球，每个球的个数为a[i]，期望摸到的球型有多种，放在target这个数组里面。target是一个球型数组。不停摸球，直到手里的球型满足target中的任意一个。问：期望摸球多少次才能成功？

这个问题复杂度很高，蒙特卡罗方法更好
"""
f_dict = {}


def f(a, target):
    a = np.array(a)
    target = np.array(target)
    n = len(a)
    assert np.all(a >= 0)
    for t in target:
        assert len(a) == len(t)
        assert np.all(a >= t) and np.all(t >= 0)
    # numpy中按照行进行排序，lexsort默认是按列排序，返回排序之后的下标
    target = target[np.lexsort(target.T)]
    param = (str(a), str(target))
    if param in f_dict:
        return f_dict[param]
    for t in target:
        if np.all(t == 0):
            f_dict[param] = 0
            return 0
    ans = 1
    s = np.sum(a)
    for i in range(n):
        if a[i]:
            next_target = np.copy(target)
            for t in next_target:
                t[i] = max(t[i] - 1, 0)
            p = Fraction(a[i], s)
            a[i] -= 1
            ans += p * f(a, next_target)
            a[i] += 1
    f_dict[param] = ans
    return ans


def monteCarlo(a, target):
    # 蒙特卡罗方法返回期望摸球次数
    s = np.sum(a)
    times = np.zeros(s + 1, dtype=np.float32)
    case_count = 10000
    box = []
    for card, cnt in enumerate(a):
        box.extend([card] * cnt)
    box = np.array(box)
    for cas in range(case_count):
        np.random.shuffle(box)
        TARGET = np.copy(target)
        over = False
        for ind, card in enumerate(box):
            for t in TARGET:
                if t[card] > 0:
                    t[card] -= 1
                    if np.all(t == 0):
                        over = True
                        # 摸了ind+1次成功
                        times[ind + 1] += 1
                        break
            if over:
                break
    times = times / case_count
    return np.dot(np.arange(len(times)), times)


ntimes_distribution_dict = {}


def ntimes_distribution(a, target):
    """
    摸球问题n次才成功的概率，返回一个数组ntimes，ntimes[i]表示摸i次才成功的概率
    """
    a = np.array(a)
    target = np.array(target)
    assert np.all(a >= 0)
    for t in target:
        assert len(a) == len(t)
        assert np.all(a >= t) and np.all(t >= 0)
        # numpy中按照行进行排序，lexsort默认是按列排序，返回排序之后的下标
    # n次成功的概率
    target = target[np.lexsort(target.T)]
    param = (str(a), str(target))
    if param in ntimes_distribution_dict:
        return ntimes_distribution_dict[param]
    ntimes = [0] * (1 + np.sum(a))
    for t in target:
        if np.all(t == 0):
            ntimes[0] = 1
            return ntimes
    s = np.sum(a)
    for i in range(len(a)):
        if a[i]:
            next_target = np.copy(target)
            for t in next_target:
                t[i] = max(t[i] - 1, 0)
            pp = Fraction(a[i], s)
            a[i] -= 1
            now = ntimes_distribution(a, next_target)
            a[i] += 1
            for i in range(1, len(ntimes)):
                ntimes[i] += pp * now[i - 1]
    ntimes_distribution_dict[param] = ntimes
    return ntimes


def split_conquer(a, target, use_fraction=True):
    """
    分治法处理摸球期望
    把每个target的期望摸球次数列出分布
    把各个target的次数向量累加起来

    这种方法是错误的，因为摸到一个球可能满足了两个target，概率上就会加两次，这就导致结果偏乐观（即期望摸球次数偏少）。这种方法最好不要用
    对于a=[2,2],target=[[1,0],[0,1]]问题,摸1次必然成功，摸2次，3次，4次才成功的概率为0。

    此方法的另一个缺点是：计算是Fraction会溢出，因此此函数有一个useFraction参数
    """
    a = np.array(a)
    target = np.array(target)
    assert np.all(a >= 0)
    for t in target:
        assert len(a) == len(t)
        assert np.all(a >= t) and np.all(t >= 0)
    # 每个target的次数分布
    ntimes = [ntimes_distribution(a, [t]) for t in target]
    ntimes = np.array(ntimes)
    if not use_fraction:
        ntimes = ntimes.astype(float)
    # ntimes有len(target)行，每行np.sum(a)列
    assert ntimes.shape == (len(target), np.sum(a))
    s = [0] * np.sum(a)
    fail = np.empty_like(ntimes, dtype=object)
    # fail[target,j]表示target这个目标需要不少于j次才能成功的概率
    for i in range(len(target)):
        for j in range(len(s)):
            fail[i][j] = sum(ntimes[i][k] for k in range(j, len(s)))
    for i in range(len(s)):
        for t in range(len(target)):
            # t target成功，其它target全部失败
            other_fail = np.prod([fail[other][i] for other in range(len(target)) if other != t])
            s[i] += ntimes[t][i] * other_fail
        if np.sum(s) >= 1:
            break
    return s


def expect(ntimes):
    return np.dot(np.arange(len(ntimes)), ntimes)


def complexity(a):
    """
    袋子中每个球的向量为a，求f_dict的复杂度
    此法算出来的复杂度略高，属于正常现象，因为target通常是远远小于a的。
    """
    a = np.array(a)
    p = np.cumprod(a + 1)
    p = np.hstack(([1], p[:-1]))
    return np.dot(a, p)


def complexity2(a):
    """
    复杂度的另一种表达方式
    """
    a = np.array(a)
    s = np.sum([a[i] * np.prod(a[:i] + 1) for i in range(len(a))])
    return s


def show(dic):
    print(len(dic))
    for k, v in dic.items():
        print(k, v)


def print_times_distribution():
    a = [2, 3, 4, 5]
    target = [[1, 2, 0, 1], [2, 1, 0, 0], [0, 2, 0, 2]]
    times = ntimes_distribution(a, target)
    print(times)
    plt.plot(np.arange(len(times)), times)
    plt.show()


def test1():
    print(f([2, 2], [[0, 1], [1, 0]]))
    print(f([2, 2], [[1, 0]]))
    print(f([2, 2], [[0, 1]]))


def test2():
    a = [3, 4, 3, 4, 4]
    target = [[0, 1, 2, 1, 0], [1, 1, 0, 1, 0], [0, 2, 1, 0, 0]]
    ans = f(a, target)
    print(ans)
    print(a)
    print(len(f_dict), complexity(a), complexity2(a))
    f_dict.clear()
    print('如果全摸', f(a, [a]), sum(a))
    print(len(f_dict))  # 此值等于complexity


def test3():
    a = [3, 4, 3, 4, 4]
    target = [[0, 1, 2, 1, 0], [1, 1, 0, 1, 0], [0, 2, 1, 0, 0]]
    ans = f(a, target)
    print('standard answer', ans)
    b = ntimes_distribution(a, target)
    print(b, )
    print(expect(b), float(expect(b)))


def test4():
    a = [3, 4, 3, 4, 4]
    target = [[0, 1, 2, 1, 0], [1, 1, 0, 1, 0], [0, 2, 1, 0, 0]]
    c = split_conquer(a, target, use_fraction=False)
    print('标准答案', f(a, target), float(f(a, target)))
    print('分治法次数概率向量', c)
    x = expect(c)
    print('期望摸球次数', x, float(x))


def test_montecarlo():
    a = [3, 4, 3, 3, 2]
    target = [[0, 1, 2, 0, 1], [1, 1, 0, 1, 0], [0, 2, 1, 0, 2]]
    print('标准答案', f(a, target), float(f(a, target)))
    mine = monteCarlo(a, target)
    print(mine)


if __name__ == '__main__':
    # test1()
    # test2()
    # test3()
    # test4()
    test_montecarlo()
