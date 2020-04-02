"""
从袋子里面不放回摸球，袋子里面球的个数向量为a，手里的球数最多有n个
只要手牌形成targets中的任意一个游戏就结束
求期望摸球次数
"""
import numpy as np
from fractions import Fraction


def f(n, a, targets, hand):
    """
    n:手牌数上限
    a：牌堆中的剩余牌
    targets：多个目标
    hand：目前的手牌
    """
    a = np.array(a)
    targets = np.array(targets)
    assert np.all(a >= 0)
    assert len(a) == len(hand)
    for t in targets:
        assert len(t) == len(a)
    if np.sum(hand) == n:
        # 如果胡牌
        for t in targets:
            if np.all(hand >= t):
                return 0
        # 如果弃牌
        min_steps = 1e9
        for i in range(len(hand)):
            hand[i] -= 1
            son = f(n, a, targets, hand)
            min_steps = min(son, min_steps)
            hand[i] += 1
        return min_steps
    else:
        # 摸牌
        total = np.sum(a)
        if total == 0:
            return 1
        s = 1
        for i in range(len(a)):
            p = Fraction(a[i], total)  # a[i] / total  # 摸到这个球的概率
            if a[i]:
                a[i] -= 1
                hand[i] += 1
                s += p * f(n, a, targets, hand)
                a[i] += 1
                hand[i] -= 1
        return s


def complexity(max_hand, card_count, pile):
    """
    许多问题虽然解决不了，但是了解一下复杂度也是极好的
    """
    fetch_split = card_count
    release_split = min(card_count, max_hand)
    return release_split ** pile * fetch_split ** pile


ans = f(3, [2, 2, 3], [[1, 1, 1], [0, 2, 0]], [0, 0, 0])
print(ans, float(ans))
print('不加优化的麻将复杂度')
majiang_total = complexity(14, 34, 136 - 4 * 13)
print(majiang_total, float(majiang_total))
