"""
把n个苹果分成k份有多少种分法

当有一份为1张
当所有堆都大于1
"""
from eye import lib

N = 10
a = [[0] * N for i in range(N)]

a[0][0] = 1
for i in range(1, N):
    for j in range(1, i + 1):
        a[i][j] = len(list(lib.split(i, j)))
for i in a:
    print(i)

b = [[0] * N for i in range(N)]
b[0][0] = 1
for n in range(1, N):
    for k in range(1, n + 1):
        b[n][k] = b[n - 1][k - 1] + b[n - k][k]
        if b[n][k] != a[n][k]:
            print('error', n, k, b[n][k], a[n][k])
print('=' * 10)
for i in b:
    print(i)

print('把9个苹果分成3份')
for i in lib.split(9, 3):
    print(i)
