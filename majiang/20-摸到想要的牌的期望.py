import numpy as np
from typing import List
from scipy.special import comb as c
from tqdm import tqdm

"""
n种小球，每种小球的个数为a[i]个，将它们放在一个袋子里面，每次随机摸，求摸k次才摸到球型A的概率。
球型指的是一个n维向量,向量的第i维表示第i个球的个数。

更精确的表述如下:  
n种小球，每种小球的个数为a[i]个，每次随机摸，现在希望摸到的第i个球的个数不小于b[i]，问平均摸多少次才能达成目标。  
球型指的是一个n维向量。


问题来源：
评价一个麻将局面的好坏，这个局面到达胜利局面所需要的期望摸牌次数。
胜利局面有很多个，每个胜利局面都有一个期望摸牌次数。把这些摸牌次数求均值就得到一个局面到达胜利的期望距离。
"""


def bruteforce(b: List, a: np.ndarray):
    """
    a:袋子中每种球的个数
    b:期望摸到的每种球的个数
    """
    # 暴力摸几次才能
    cases = 10000
    # 最多摸sum(a)次，ans是摸球次数到实验次数的映射
    ans = np.zeros(np.sum(a) + 1)
    assert np.all(b < a), 'never'
    for i in tqdm(range(cases)):
        now = np.zeros_like(b)
        # 构造一个pocket
        pocket = []
        for c, j in enumerate(a):
            pocket += [c] * j
        fufill_count = len(b) - np.count_nonzero(b)
        # 已经满足了的次数，只有当全部小球种类都得到满足时才停止摸球
        fetch_count = 0
        while fufill_count < len(b):
            fetch_count += 1
            card = np.random.choice(pocket)
            pocket.remove(card)
            now[card] += 1
            if now[card] == b[card]:  # 等于只会发生一次，所以fufill_count并不会多加
                fufill_count += 1
        ans[fetch_count] += 1
    return ans / cases


def how(target: List, card_count: np.ndarray):
    # n张牌，每张牌有card_count[i]张
    # 达成target所需要的摸牌步数的概率
    # 此为拟合的结果，是猜测的式子，显然是一点都不对
    assert len(target) == len(card_count)
    total = np.sum(card_count)
    target_sum = np.sum(target)
    ans = np.empty(total + 1, dtype=np.float32)
    up = np.prod([c(card_count[i], target[i]) for i in range(len(card_count))])
    for step in range(total + 1):
        s = up * c(total - target_sum, step - target_sum) / c(total, step)
        ans[step] = s
    ans[1:] -= ans[:-1]
    return ans


def expect(steps):
    return np.dot(np.arange(len(steps)), steps)


def go(target, card_count):
    x = how(target, card_count)
    y = bruteforce(target, card_count)
    print('========')
    print('mine', x, np.sum(x))
    print('his', y, np.sum(y))
    print('mine期望步数', expect(x))
    print('his期望步数', expect(y))


go([1, 0, 0, 0], [1, 2, 3, 1])
go([1, 1, 0, 0], [1, 1, 1, 1])
go([1, 1, 0, 0], [2, 1, 2, 1])
