import numpy as np

"""
numpy矩阵按照行进行排序
"""
a = np.array([[1, 2, 3, 4, 5],
              [2, 3, 4, 5, 7],
              [1, 2, 3, 6, 7],
              [4, 5, 6, 7, 8],
              [3, 4, 5, 6, 7],
              ])
print(a[np.lexsort(np.rot90(a))])
