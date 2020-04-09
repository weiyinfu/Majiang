"""
从N个元素中有放回抽样n次，能摸到元素种数的期望是多少？

使用条件概率推导出递推公式，然后化简
f(n)来源于f(n-1)，如果第n次没有摸到新元素，概率为(n-1)/N
如果第n次摸到了新元素,概率为(N-(n-1))/N,现在元素个数变为f(n-1)+1

化简得到
f(n)=f(n-1)+(N-(n-1))/N

进一步化简得到
f(n)=n-(1+2+3+...(n-1))/N=n-(n(n-1))/(2N)

反向问题：从N个元素中随机选取n种元素，期望选择多少次？
这个问题其实就是求 n=x-(x(x-1))/(2N)这个方程的解，这是一个一元二次方程求根问题

问题来源：测试集合的性能时，需要往集合里面放一堆元素，然后不停地查询有没有。现在想测试的集合的大小为n。
"""
import numpy as np


def bruteforce(n, N):
    case_count = 100000
    ans = []
    for cas in range(case_count):
        a = []
        for i in range(n):
            x = np.random.randint(0, N)
            a.append(x)
        ans.append(len(set(a)))
    return np.mean(ans)


def f(n, N):
    return n - (n * (n - 1)) / 2 / N


for N in range(1, 10):
    for n in range(N):
        print(f"{bruteforce(n, N)}={f(n, N)} ", end='')
    print()
