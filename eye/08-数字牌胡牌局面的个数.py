"""
麻将的数字牌都是9种,每种4张.
麻将9张牌有多少种胡牌局面，把每种胡牌局面记录下来
9张牌胡牌局面，牌的个数必须是模3余2或者模3余0

一共有5**9种情况（每个数字的个数可取0,1,2,3,4五种情况），我们只需要知道每种情况是否有解，所以每种情况只需要一个bit来表示，每种情况用一个bit表示需要238k的空间
"""
from eye import lib
from collections import Counter
from typing import List, Tuple
import numpy as np
from tqdm import tqdm

a = [4] * 9

s = 0
for i in (0, 3, 6, 9, 12, 2, 5, 8, 14):
    s += lib.choose(a, i)
print('1到9随意组合总共有这些种局面', 5 ** 9)
print('用牌的个数过滤之后可能有解的局面个数为', s)
print('用每个二进制位表示是否有解,表的大小为', 5 ** 9 / 8 / 1024)


def valid(ar):
    # 判断一个局面是否是胡牌局面,如果是,则返回一个二元组,二元组表示将的个数和3的个数
    def go(b: List[int], ind: int, two: int, three: int, allow_jiang: bool):
        """
        如果无解，返回None
        如果有解，返回[2的个数，3的个数]
        """
        if ind == len(b):
            return two, three
        if b[ind] == 0:
            return go(b, ind + 1, two, three, allow_jiang)
        if allow_jiang and b[ind] >= 2:
            # 如果可以有将
            b[ind] -= 2
            res = go(b, ind, two + 1, three, False)
            b[ind] += 2
            if res:
                return res
        if b[ind] > 2:
            # 可以成为刻子
            b[ind] -= 3
            res = go(b, ind, two, three + 1, allow_jiang)
            b[ind] += 3
            if res:
                return res
        if ind + 2 < len(b) and b[ind] and b[ind + 1] and b[ind + 2]:
            # 有三张，可以成为顺子
            for i in range(3):
                b[ind + i] -= 1
            res = go(b, ind, two, three + 1, allow_jiang)
            for i in range(3):
                b[ind + i] += 1
            if res:
                return res
        return None

    # 判断数组ar是否合法
    cnt = sum(ar)
    if cnt % 3 not in (0, 2):
        # 元素个数不对肯定不合理
        return

    allow_jiang = cnt % 3 == 2
    return go(ar, 0, two=0, three=0, allow_jiang=allow_jiang)


def generate_cards():
    # 生成全部的牌面
    def go(a, ind, now):
        if ind == len(a):
            yield now
            return
        for i in range(a[ind] + 1):
            now[ind] = i
            for j in go(a, ind + 1, now):
                yield j
            now[ind] = 0

    a = [4] * 9
    for i in go(a, 0, [0] * 9):
        yield i


total = 0  # 全部局面数
ss = 0  # 有解局面个数
solvable = []
two_three = set()  # 2,3的个数的类型
for ar in tqdm(generate_cards(), total=5 ** 9):
    total += 1
    if np.sum(ar) > 14:
        # 只考虑14张牌
        continue
    x = valid(ar)
    two_three.add(x)
    if x:
        ss += 1
        solvable.append(ar[:])
print('2 3 的分布')
print(two_three)
print('局面总数', total)
print('实际有解的', ss, '需要的空间大小为：', ss * 4 / 1024, 'k')
print(solvable[:20])
# 有解的局面牌数的分布
print('有解的局面牌的张数与局面个数的映射:')
card_count = [np.sum(i) for i in solvable]
print(Counter(card_count))


# 对solvable进一步压缩，把数字的个数缩得尽量小，例如7,8,9等价于0,1,2.  34559等价于12335
def get_pattern(a):
    # 对牌型a进行压缩
    b = [i for i in range(len(a)) if a[i]]  # 不为0的那些位
    if not b:
        return ''
    c = [-1] * 9  # 重写的映射
    c[b[0]] = 0
    x = 0
    for i in range(1, len(b)):
        if b[i] == b[i - 1] + 1:  # 如果连续，那么连续
            x += 1
        else:  # 如果不连续，那么+2
            x += 2
        c[b[i]] = x
    s = []
    for n, cnt in enumerate(a):
        s.extend([c[n]] * cnt)
    return ''.join(str(i) for i in s)


pattern2count = {}
for i in solvable:
    p = get_pattern(i)
    # print(i, p)
    pattern2count[p] = 0

print('使用pattern压缩法可以将局面个数压缩到', len(pattern2count))
