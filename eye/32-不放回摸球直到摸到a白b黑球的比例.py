from fractions import Fraction
from sympy import *

f_dict = {}


def f(m, n, a, b):
    """
    m个白球，n个黑球，想要摸到a个白球，b个黑球
    用递推式的方式计算准确结果，结果使用分数表示
    """
    assert a >= 0 and b >= 0 and m >= 0 and n >= 0
    assert a <= m and b <= n
    param = (m, n, a, b)
    if param in f_dict:
        return f_dict[param]
    if a == 0 and b == 0:
        f_dict[param] = 0
        return 0
    if m == 0 or n == 0:
        f_dict[param] = max(a, b)
        return max(a, b)
    x = Fraction(m, m + n)
    y = Fraction(n, m + n)
    ans = 1 + x * f(m - 1, n, max(a - 1, 0), b) + y * f(m, n - 1, a, max(b - 1, 0))
    f_dict[param] = ans
    return ans


def test():
    m, n, a, b = 7, 6, 3, 2
    res = f(m, n, a, b)
    res = simplify(f"{res.numerator}/{res.denominator}")
    # 分类讨论最后一个球
    rate1 = simplify(f"{m + 1}/ {m + n + 1}")
    rate2 = simplify(f"{n + 1}/ {m + n + 1}")
    last1 = a / rate1
    last2 = b / rate2
    print(f"""
期望摸球次数{res}次
如果最后一个球是白球，摸球次数{last1}
如果最后一个球是黑球,摸球次数{last2}
""")
    x, y = symbols('x,y')
    system = [last1 * x + last2 * y - res, x + y - 1]
    ans = linsolve(system, (x, y))
    print(ans)


test()
