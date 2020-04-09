"""
n个苹果分成k份,每份可为空,一共有多少种分法
"""

N = 10
a = [[0] * N for i in range(N)]  # 把n个苹果分成k份,每份不能为空
b = [[0] * N for i in range(N)]  # 把n个苹果分成k份，每份不能为空
c = [[0] * N for i in range(N)]  # 把n个苹果分成k份,每份可以为空,由a推导得出，它是正确答案，用来校验b是否正确
a[0][0] = 1
for i in range(N):
    b[0][i] = 1
for n in range(1, N):
    for k in range(1, n + 1):
        a[n][k] = a[n - 1][k - 1] + a[n - k][k]
for n in range(1, N):
    for k in range(1, N):
        b[n][k] = b[n][k - 1] + b[n - k][k]
for n in range(N):
    for k in range(1, N):
        c[n][k] = sum(a[n][i] for i in range(k + 1))
        if c[n][k] != b[n][k]:
            print('error', n, k, c[n][k], b[n][k])
for i in c:
    print(i)
print('=' * 10)
for i in b:
    print(i)
