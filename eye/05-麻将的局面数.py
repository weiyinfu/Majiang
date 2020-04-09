"""
从所有麻将中选取13张牌有多少种可能

为了研究较小空间的麻将，可以不用14张牌，而改成11张牌或者8张牌

如果考虑等价性，那么局面数会少很多。等价性是指：
* 万筒条三者等价
* 东西南北中发白7者等价

所以：”中中“与”发发“，”白白“是等价的
"一桶二桶一条"跟”一条二条一桶“跟”一条二条一万“是等价的
"一桶二桶东"跟”一条二条西“跟”一条二条中“是等价的

麻将14张牌总共有3265亿个局面,去重之后有87亿个局面.
"""
import matplotlib.pyplot as plt
import tabulate

from eye import lib

chess_count = 136
print("棋子个数", 3 * 9 * 4 + 7 * 4)

maxn = 15


def 东西南北中发白():
    # 7种牌等价，返回一个a[maxn]数组
    a = [1] * maxn  # 牌的张数到牌型的映射
    for n in range(1, len(a)):
        s = 0
        for i in lib.split_all(n):
            # 最多的牌数不能大于4
            if max(i) > 4:
                continue
            s += 1
        a[n] = s
    return a


def 万筒条():
    a = [1] * maxn
    for n in range(1, len(a)):
        s = 0
        for k in range(1, 4):  # 万筒条一共三类牌
            # k表示分成几份，1份，2份，3份，每份的牌的个数各是多少
            for i in lib.split(n, k):
                # i表示一种分法
                now = 1
                for j in range(k):
                    # 从一种数字牌中选择i[j]张牌有多少种选法
                    now *= lib.choose([4] * 9, i[j])
                s += now
        a[n] = s
    return a


def unique():
    # 去重之后有多少种牌型
    a = 东西南北中发白()
    b = 万筒条()
    c = [0] * (maxn)
    for i in range(maxn):
        for j in range(maxn - i):
            c[i + j] += a[i] * b[j]
    return c


# 从34种牌(每种4张)中选择i张牌有多少种选法
al = [lib.choose([4] * (3 * 9 + 7), i) for i in range(maxn)]
ans = unique()
plt.plot(ans)
plt.plot(al)
plt.show()
data = []
for i in range(maxn):
    data.append((i, al[i], ans[i], al[i] / ans[i]))
print(tabulate.tabulate(data, ["n", "不去重", "去重", "倍数"]))
"""
去重之后13张牌有87亿张牌型
7张牌有1436414种牌型
"""
