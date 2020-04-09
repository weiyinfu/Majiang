from collections import Counter

"""
来自网络的一个胡牌算法
"""
def is_agari(tehai) -> bool:
    def is_agari_impl(tehai_cnt: Counter, rest_tiles: int) -> bool:
        """
        Args:
            tehai_cnt: 各种牌的枚数信息
            rest_tiles: 剩余手牌张数
        """
        if rest_tiles == 0:
            return True
        # 个数不为0的最小的牌
        min_tile = min(filter(lambda x: tehai_cnt[x], tehai_cnt.keys()))
        # 拆刻子
        if tehai_cnt[min_tile] >= 3:
            tehai_cnt[min_tile] -= 3
            if is_agari_impl(tehai_cnt, rest_tiles - 3):
                return True
            tehai_cnt[min_tile] += 3
        # 拆雀头
        if rest_tiles % 3 and tehai_cnt[min_tile] >= 2:
            tehai_cnt[min_tile] -= 2
            if is_agari_impl(tehai_cnt, rest_tiles - 2):
                return True
            tehai_cnt[min_tile] += 2
        # 拆顺子
        if (min_tile < 27 and min_tile % 9 < 7
                and tehai_cnt[min_tile + 1] and tehai_cnt[min_tile + 2]):
            tehai_cnt[min_tile] -= 1
            tehai_cnt[min_tile + 1] -= 1
            tehai_cnt[min_tile + 2] -= 1
            if is_agari_impl(tehai_cnt, rest_tiles - 3):
                return True
            tehai_cnt[min_tile + 2] += 1
            tehai_cnt[min_tile + 1] += 1
            tehai_cnt[min_tile] += 1
        return False

    return is_agari_impl(Counter(tehai), len(tehai)) if len(tehai) % 3 == 2 else False


print(is_agari([0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8]))
