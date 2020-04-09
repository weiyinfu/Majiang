"""
使用蒙特卡洛方法解决多目标摸球问题
"""
from eye.multi_target.recursive_formula import f, f_dict
import numpy as np


def monteCarlo(a, target):
    # 蒙特卡罗方法返回期望摸球次数
    s = np.sum(a)
    times = np.zeros(s + 1, dtype=np.float32)
    case_count = 10000
    box = []
    for card, cnt in enumerate(a):
        box.extend([card] * cnt)
    box = np.array(box)
    for cas in range(case_count):
        np.random.shuffle(box)
        TARGET = np.copy(target)
        over = False
        for ind, card in enumerate(box):
            for t in TARGET:
                if t[card] > 0:
                    t[card] -= 1
                    if np.all(t == 0):
                        over = True
                        # 摸了ind+1次成功
                        times[ind + 1] += 1
                        break
            if over:
                break
    times = times / case_count
    return np.dot(np.arange(len(times)), times)


if __name__ == '__main__':
    a = [3, 4, 3, 3, 2]
    target = [[0, 1, 2, 0, 1], [1, 1, 0, 1, 0], [0, 2, 1, 0, 2]]
    print('标准答案', f(a, target), f(a, target, False))
    mine = monteCarlo(a, target)
    print(mine)
