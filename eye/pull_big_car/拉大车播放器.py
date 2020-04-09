import tkinter
import tkinter.font

me = [2, 1, 0, 4]
he = [1, 3, 3, 0]


class Card:
    def __init__(self, id, value):
        self.value = value
        self.id = id
        self.spirit = None

    def __str__(self):
        return str(self.value)


def init():
    id = 0
    for i in range(len(me)):
        me[i] = Card(id, me[i])
        id += 1
    for i in range(len(he)):
        he[i] = Card(id, he[i])
        id += 1


init()
width = 700
height = 500
root = tkinter.Tk()
font = tkinter.font.Font(family='Consolas', size=30, weight=tkinter.font.BOLD)
cava = tkinter.Canvas(width=width, height=height)
cava.pack()
# 开始玩游戏
now = []  # 当前牌堆
who = 1  # 当前谁出牌
cnt = 0  # 对局轮数
a = (me, he)
who_rec = None
eat_rec = None
wait = True
find_eat = False


def draw_person(x, ar):
    if len(ar) == 0: return
    per_height = height // len(ar)
    for i in range(len(ar)):
        if ar[i].spirit is None:
            ar[i].spirit = cava.create_text(x, i * per_height + 20, text=str(ar[i]), font=font)
        else:
            pos = cava.coords(ar[i].spirit)
            cava.move(ar[i].spirit, x - pos[0], 20 + i * per_height - pos[1])


def paint():
    global who_rec, eat_rec
    draw_person(30, me)
    draw_person(width - 40, he)
    draw_person(width / 2, now)
    x = 50 if who == 0 else width - 50
    if who_rec is None:
        who_rec = cava.create_line(x, 0, x, height, fill="red", width=10)
    else:
        pos = cava.coords(who_rec)
        cava.move(who_rec, x - pos[0], 0)


def go():
    global who, cnt, now, wait, eat_rec
    pos = -1
    for i in range(len(now) - 1):
        if now[i].value == now[-1].value:
            pos = i
            break
    if pos != -1:
        if eat_rec is None:
            per_height = height / len(now)
            eat_rec = cava.create_rectangle(width / 2 - 20, pos * per_height, width / 2 + 40, len(now) * per_height, width=3)
            root.after(1000, go)
            return
        else:
            cava.delete(eat_rec)
            eat_rec = None
            a[who].extend(now[pos:][::-1])
            now = now[:pos]
            paint()
            root.after(1000, go)
            return
    if wait:
        who = 1 - who
        wait = False
        paint()
        root.after(1000, go)
        return
    if len(a[0]) and len(a[1]):
        x = a[who][0]
        a[who].pop(0)
        now.append(x)
        cnt += 1
        wait = True
        paint()
        root.after(1000, go)
    else:
        cava.create_text(width / 2, height / 2, text="GameOver!%s win !" % ("Left" if a[0] else "Right"))


root.after(1000, go)
root.mainloop()
