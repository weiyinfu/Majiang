# 数字牌，胡牌时牌的张数与牌的局面个数的映射
shuzi = {
    14: 13259,
    11: 4475,
    12: 2098,
    8: 996,
    9: 627,
    5: 135,
    6: 127,
    3: 16,
    2: 9,
    0: 1
}
zi = {}  # 字牌的牌的张数=>局面数的映射
# 东西南北中发白
for i in range(5):  # 只有0,2,3合法
    if i in (0, 2, 3):
        zi[i] = 1

zi_count = 7  # 字牌有7种
shuzi_count = 3  # 数字牌有3种
a = [zi] * zi_count + [shuzi] * shuzi_count

ma = {}


def go(a, ind, two_count, three_count, prod):
    if two_count > 1:
        return
    s = two_count * 2 + three_count * 3
    if s > 14:
        return
    if ind == len(a):
        ma[s] = ma.get(s, 0) + prod
        return
    s = 0
    for k, v in a[ind].items():
        two = 1 if k % 3 == 2 else 0
        three = k // 3
        assert two * 2 + three * 3 == k, f'error {two} {three}'
        go(a, ind + 1, two_count + two, three_count + three, prod * v)


from pprint import pprint

go(a, 0, 0, 0, 1)
pprint(ma)
"""
麻将胡牌局面数为一千万个：11498658
"""
