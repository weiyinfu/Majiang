"""
使用递推式解决多目标摸球问题
"""
import numpy as np
from fractions import Fraction
from eye.multi_target.util import check_param

f_dict = {}


def f(a, target, use_fraction=True):
    a = np.array(a)
    target = np.array(target)
    n = len(a)
    check_param(a, target)
    # numpy中按照行进行排序，lexsort默认是按列排序，返回排序之后的下标
    target = target[np.lexsort(target.T)]
    param = (str(a), str(target), use_fraction)
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
            p = Fraction(a[i], s) if use_fraction else a[i] / s
            a[i] -= 1
            ans += p * f(a, next_target)
            a[i] += 1
    f_dict[param] = ans
    return ans


if __name__ == '__main__':
    print(f([2, 2], [[0, 1], [1, 0]]))
    print(f([2, 2], [[1, 0]]))
    print(f([2, 2], [[0, 1]]))
