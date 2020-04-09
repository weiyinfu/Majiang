"""
n个互不相同的球，希望摸到k个球，有放回，估计需要摸几次才能实现愿望？

求f(n,k)
"""
import numpy as np
import sympy as sp

def bruteforce(n, k):
    case = 10000
    experiment = []
    for i in range(case):
        visited = set()
        a = list(range(n))
        op = 0
        while len(visited) < k:
            x = np.random.choice(a)
            visited.add(x)
            op += 1
        experiment.append(op)
    return np.mean(experiment)


def good(n, k):
    if k == 0: return 0
    return good(n, k - 1) + 1 / ((n - (k - 1)) / n)


for i in range(5):
    for j in range(i + 1):
        print(bruteforce(i, j), '=', good(i, j), end=' ', sep='')
    print()
