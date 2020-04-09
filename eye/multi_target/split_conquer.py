"""
分治法处理摸球期望
把每个target的期望摸球次数列出分布
把各个target的次数向量累加起来

对于a=[2,2],target=[[1,0],[0,1]]问题,摸1次必然成功，摸2次，3次，4次才成功的概率为0。

此方法的另一个缺点是：计算是Fraction会溢出，因此此函数有一个useFraction参数

"""
import numpy as np
from eye.multi_target.ntimes_distribution import ntimes_distribution
from eye.multi_target.util import check_param, expect
from eye.multi_target.recursive_formula import f


def split_conquer(a, target, use_fraction=True):
    a = np.array(a)
    max_times = np.sum(a) + 1
    target = np.array(target)
    check_param(a, target)
    # 每个target的次数分布
    ntimes = [ntimes_distribution(a, [t], use_fraction) for t in target]
    ntimes = np.array(ntimes)
    # ntimes有len(target)行，每行np.sum(a)+1列
    assert ntimes.shape == (len(target), max_times)
    success = np.zeros_like(ntimes, dtype=object)
    fail = np.zeros_like(ntimes, dtype=object)
    for t in range(len(target)):
        for i in range(max_times):
            fail[t, i] = np.sum(ntimes[t, i:])
    for i in range(max_times):
        for t in range(len(target)):
            # t target成功，其它target全部失败
            other_fail = np.prod(fail[:t, i]) * np.prod(fail[t + 1:, i])
            success[t, i] = other_fail * ntimes[t, i]
            print((t, i), other_fail, success[t, i])
    return np.sum(success, axis=0)


if __name__ == '__main__':
    a = [2, 2]
    target = [[0, 1], [1, 0]]
    c = split_conquer(a, target, use_fraction=True)
    together = ntimes_distribution(a, target, False)
    print('合起来的次数分布', together)
    print('分治法次数概率向量', c)
    print('标准答案', f(a, target, False),
          '分治法期望摸球次数', expect(c), float(expect(c)),
          '合起来期望摸球次数', expect(together))
