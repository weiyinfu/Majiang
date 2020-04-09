import numpy as np
from eye.multi_target.recursive_formula import f
from fractions import Fraction
from eye.multi_target.util import expect

ntimes_distribution_dict = {}


def ntimes_distribution(a, target, use_fraction=True):
    """
    基于推导法求摸n次成功的分布
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
    param = (str(a), str(target), use_fraction)
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
            pp = Fraction(a[i], s) if use_fraction else a[i] / s
            a[i] -= 1
            now = ntimes_distribution(a, next_target)
            a[i] += 1
            for i in range(1, len(ntimes)):
                ntimes[i] += pp * now[i - 1]
    ntimes_distribution_dict[param] = ntimes
    return ntimes


if __name__ == '__main__':
    a = [3, 4, 3, 4, 4]
    target = [[0, 1, 2, 1, 0], [1, 1, 0, 1, 0], [0, 2, 1, 0, 0]]
    ans = f(a, target)
    print('standard answer', ans)
    b = ntimes_distribution(a, target)
    print(b, )
    print(expect(b))
