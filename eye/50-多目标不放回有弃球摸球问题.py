"""
从袋子里面不放回摸球，袋子里面球的个数向量为a，手里的球数最多有n个
只要手牌形成targets中的任意一个游戏就结束
上帝（绝对理智的人）玩这个游戏，胜率是多少？

玩麻将就像掷骰子，即便是最理智的人也无法控制牌的未来，他只能选择最好的策略，但是能不能赢还是需要看运气。

麻将如何对局面进行评分：给定一个局面，可以知道这个局面的胜率是多少。
"""
import numpy as np
from fractions import Fraction
from eye.multi_target import util


def f(n, a, targets, hand):
    """
    n:手牌数上限
    a：牌堆中的剩余牌
    targets：多个目标
    hand：目前的手牌

    返回成功的概率
    """
    a = np.array(a)
    targets = [i for i in targets if np.all(i <= a)]
    if len(targets) == 0:
        # 不可能胜利
        return 0
    targets = np.array(targets)
    util.check_param(a, targets)
    assert len(a) == len(hand)
    if np.sum(hand) == n:
        # 如果胡牌
        for t in targets:
            if np.all(hand >= t):
                return 1
        # 如果弃牌
        max_score = -1e9
        for i in range(len(hand)):
            hand[i] -= 1
            son = f(n, a, targets, hand)
            max_score = max(son, max_score)
            hand[i] += 1
        return max_score
    else:
        # 摸牌
        total = np.sum(a)
        if total == 0:
            # 无牌可摸，必败
            return 0
        s = 0
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


ans = f(3, [2, 2, 3], [[1, 1, 0], [0, 2, 0]], [0, 0, 0])
print(ans, float(ans))
ans = f(1, [2, 2], [[1, 0], [0, 1]], [0, 0])
print('必胜', ans)
print('不加优化的麻将复杂度')
majiang_total = complexity(14, 34, 136 - 4 * 13)
print(majiang_total, float(majiang_total))
