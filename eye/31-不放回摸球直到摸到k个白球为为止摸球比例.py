from fractions import Fraction


def f(m, n, k):
    return Fraction(m + n + 1, m + 1) * k


"""
不论k怎么变化，摸到的球中各种球的比例是不变的
"""


def test():
    m, n, k = 5, 7, 5
    x = f(m, n, k)
    print(f"""期望摸球次数{x}
摸到的球中白球占比{Fraction(k, x)}
摸到的球中黑球占比{Fraction(x - k, x)}
""")
    rate = Fraction(m + 1, m + n + 1)
    print('利用比例进行计算', Fraction(k, rate))


test()
