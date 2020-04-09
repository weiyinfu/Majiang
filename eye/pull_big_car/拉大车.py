import random

MAX_TURN = 1e5  # 最大对局轮数，超过这个数字判定为和棋（这是一种妥协，不然进入死循环了）


def newgame(rankCount=13, suitCount=4):
    # 开始新游戏
    a = list(map(lambda x: x % rankCount, range(rankCount * suitCount)))
    random.shuffle(a)
    mid = rankCount * suitCount // 2
    return a[:mid], a[mid:]


def gogame(me, he, verbose=False):
    # 开始玩游戏
    a = (me, he)
    now = []  # 当前牌堆
    who = 0  # 当前谁出牌
    cnt = 0  # 对局轮数
    while len(a[0]) and len(a[1]):
        if cnt > MAX_TURN:
            return cnt, 2
        if verbose:
            print('me', a[0], '\nhe', a[1], '\nnow', now, '\nturn', who, '=' * 10)
            input()
        x = a[who][0]
        a[who].pop(0)
        if x in now:
            pos = now.index(x)
            now.append(x)
            a[who].extend(now[pos:][::-1])
            now = now[:pos]
        else:
            now.append(x)
        who = 1 - who
        cnt += 1
    return cnt, 0 if len(a[0]) > len(a[1]) else 1


def get_all_permutation(a, uniq=True):
    """

    :param a:数组
    :param uniq: 是否允许排列中元素重复
    :return: 全部的排列
    """
    ans = []

    def go(beg):
        if beg == len(a):
            ans.append(a[:])
            return
        for i in range(beg, len(a)):
            if uniq and i > beg and a[beg] == a[i]:
                continue
            a[i], a[beg] = a[beg], a[i]
            go(beg + 1)
            a[i], a[beg] = a[beg], a[i]

    go(0)
    return ans


def ichange(me, he):
    # 在对手固定，我可以随意排列我牌的情况下，我的全部排法的胜、负、和情况
    res = [0, 0, 0]
    for i in get_all_permutation(me[:]):
        steps, winner = gogame(i, he[:])
        res[winner] += 1
    return res


def best(me, he):
    """
    当对手随机排列他的牌的时候，我的最优策略
    如果返回的胜负和情况为[x,0,0]表明该决策为必胜策略
    :param me: 我的牌
    :param he: 对手的牌
    :return: 返回我的最佳排列和胜负和情况
    """
    my = get_all_permutation(me)
    his = get_all_permutation(he, uniq=False)
    ma = [0, 0, 0xff]  # 最优局面
    ans = None
    for i in my:
        res = [0, 0, 0]
        for j in his:
            cnt, winner = gogame(i[:], j[:])
            res[winner] += 1
        print(i, res)
        if res[0] == sum(res) or ma[0] / sum(ma) < res[0] / sum(res):
            ma = res
            ans = i
            if res[0] == sum(res):
                break
    return ans, ma


# 在对手随机对牌进行排列的情况下，我的最优策略
if __name__ == '__main__':
    me, he = newgame(5, 2)
    print(me, he)
    print(best(me, he))
