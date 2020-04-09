"""
运算符分为一元运算符和二元运算符
二元运算符分为可交换和不可交换

死条件：
一元运算符个数为a
二元运算符：可交换个数为b，不可交换个数为c

约束条件：
运算数个数d
运算符总数为e
运算树最大深度为h

问：运算树形态有多少种？
求表达式f(a,b,c,d,e,h)

不考虑公式等价性，如：k(a+b)=ka+kb

一旦解决了这个问题，每一个数学公式都能够在这个元素周期表中找到位置。
数学公式是可数的。

利用这个体系，可以遍历全部公式去拟合特定函数值。
"""

di = {}


def solve(n_unary, n_binary_swap, n_binary_non_swap, n_operand, n_operator, depth):
    """
    n_unary:一元运算符的个数
    n_binary_swap:二元可交换运算符的个数
    n_binary_non_swap:二元不可交换运算符的个数
    n_operand:操作数的个数
    n_operator:操作符的个数
    depth:表达式树的深度
    """
    params = n_unary, n_binary_swap, n_binary_non_swap, n_operand, n_operator, depth
    for i in params:
        assert i >= 0
    if params in di:
        return di[params]
    if n_operator == 0:
        # 没有可用运算符了，直接返回运算数
        return n_operand
    if depth == 0:
        # 如果深度为0，不能再向下扩展了
        return 0
    s = 0
    swapable = 0  # 可交换运算符的累积和，此数最后需要除以2
    # 如果是二元运算符
    for left in range(n_operator):
        left_count = solve(n_unary, n_binary_swap, n_binary_non_swap, n_operand, left, depth - 1)
        right_count = solve(n_unary, n_binary_swap, n_binary_non_swap, n_operand, n_operator - 1 - left, depth - 1)
        # 如果是可交换运算
        # 需要考虑左右两部分的等价性
        swapable += left_count * right_count * n_binary_swap
        # 如果是不可交换运算
        s += left_count * right_count * n_binary_non_swap
    assert swapable % 2 == 0
    s += swapable // 2
    # 如果是一元运算符
    s += solve(n_unary, n_binary_swap, n_binary_non_swap, n_operand, n_operator - 1, depth - 1) * n_unary
    di[params] = s
    return s


"""
二十四点游戏有2个可交换二元运算符，2个不可交换二元运算符
4个运算数，3个运算符，深度任意
"""
print('二十四点有多少个公式')
print(solve(n_unary=0, n_binary_swap=2, n_binary_non_swap=2, n_operand=4, n_operator=3, depth=100))


def 四则运算():
    n_operand = 4
    print(f'四则运算，{n_operand}个操作数，表达式的形态随运算符个数的变化')
    for n_operator in range(1, 15):
        ans = solve(
            n_unary=0,
            n_binary_swap=2,
            n_binary_non_swap=2,
            n_operand=n_operand,
            n_operator=n_operator,
            depth=100)
        print(n_operator, ans)


"""
所有的数学表达式：
四则运算：2种可交换二元运算符，2种不可交换二元运算符
幂运算（指数运算）：1种不可交换二元运算符
对数运算：1种一元运算符
三角函数运算sin，cos，asin，acos，都是一元运算符，不妨假设有4种

综上：一元运算符6种，二元可交换运算符2种，二元不可交换运算符3种。

在以上运算符基础上，9个运算数，9个运算符可以产生：974亿亿个表达式。

这是一个算力为王的时代。
"""


def big_picture():
    # 超大的图景
    n_unary = 6
    n_binary_swap = 2
    n_binary_non_swap = 3
    for n_operand in range(1, 10):
        print(f"n_operand={n_operand}\n{'=' * 10}")
        for n_operator in range(10):
            ans = solve(n_unary=n_unary,
                        n_binary_swap=n_binary_swap,
                        n_binary_non_swap=n_binary_non_swap,
                        n_operand=n_operand,
                        n_operator=n_operator,
                        depth=1e9)
            print(f"n_operand={n_operand},n_operator={n_operator},ans={ans}")


# big_picture()
四则运算()
