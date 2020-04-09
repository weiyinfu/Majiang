"""
当前局面到胡牌局面的差
D={d1,d2,d3......}

问题等价于：从一个袋子里面摸球，期望摸几次才能使pattern符合D中的任意一个。
例如2个白球3个黑球，摸到1个白球或者1个黑球时停止，此问题的答案会小于f(2,3,1,0)和f(2,3,0,1).显然此问题的答案会变成1.

麻将问题应该是一个多目标概率问题。

称此问题为：多目标摸球问题
"""
from fractions import Fraction
from copy import deepcopy

noput_dict = {}


def noput(m, n, a, b):
    """
    m个白球，n个黑球，想要摸到a个白球，b个黑球
    用递推式的方式计算准确结果，结果使用分数表示
    """
    assert a >= 0 and b >= 0 and m >= 0 and n >= 0
    assert a <= m and b <= n
    param = (m, n, a, b)
    if param in noput_dict:
        return noput_dict[param]
    if a == 0 and b == 0:
        f_dict[param] = 0
        return 0
    if m == 0 or n == 0:
        f_dict[param] = max(a, b)
        return max(a, b)
    x = Fraction(m, m + n)
    y = Fraction(n, m + n)
    ans = 1 + x * noput(m - 1, n, max(a - 1, 0), b) + y * noput(m, n - 1, a, max(b - 1, 0))
    noput_dict[param] = ans
    return ans


f_dict = {}


def f(m, n, target):
    # 多目标不放回摸球问题
    assert m >= 0 and n >= 0
    for a, b in target:
        assert m >= a >= 0 and n >= b >= 0
    target = sorted(target)
    param = (m, n, str(target))
    if param in f_dict:
        return f_dict[param]
    for a, b in target:
        if a == 0 and b == 0:
            f_dict[param] = 0
            return 0
    ans = 1
    if m:
        ifA = deepcopy(target)
        for t in ifA:
            t[0] = max(t[0] - 1, 0)
        ans += Fraction(m, m + n) * f(m - 1, n, ifA)
    if n:
        ifB = deepcopy(target)
        for t in ifB:
            t[1] = max(t[1] - 1, 0)
        ans += Fraction(n, m + n) * f(m, n - 1, ifB)
    f_dict[param] = ans
    return ans


target = [[1, 0], [1, 1]]
m = 5
n = 3
for a, b in target:
    args = (m, n, a, b)
    print(args, noput(*args), f(m, n, [[a, b]]))
print(f(m, n, target))
