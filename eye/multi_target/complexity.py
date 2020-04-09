from eye.multi_target.recursive_formula import f, f_dict
import numpy as np

"""
多目标摸球问题的复杂度

给定a和target，求递推式会产生多少个状态
"""


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


def real_complexity(a, target):
    f_dict.clear()
    f(a, target, False)
    return len(f_dict)


if __name__ == '__main__':
    a = [3, 4, 3, 7, 4]
    target = [[0, 1, 2, 1, 0], [1, 1, 0, 1, 0], [0, 2, 1, 0, 0]]
    print(real_complexity(a, target))
    print(complexity(a), complexity2(a))
    print('如果全摸，需要摸的次数', real_complexity(a, [a]))
