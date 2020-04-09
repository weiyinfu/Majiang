//批量加载音频文件
import {Sounds} from "../core/Card";

const audios: { [index: string]: string } = {
    eat: '女声动作/吃.mp3',
    peng: '女声动作/碰.mp3',
    gang: '女声动作/杠.mp3',
    win: 'win.mp3',
    lose: "lose.mp3",
    start: "start.mp3",
    illegal: "illegal.mp3"
}

for (let i in audios) {
    audios[i] = require(`../res/${audios[i]}`).default;
}
for (let i of Sounds) {
    audios[i] = require(`../res/女声牌/${i}.mp3`).default;
}

export function playSound(x: string) {
    if ((window as any).mute) {
        return;
    }
    if (!audios[x]) {
        for (let i in audios) {
            if (audios[i] === x) {
                x = i;
                break;
            }
        }
    }
    if (!audios[x]) throw new Error(`cannot find audio ${x}`);
    const ele: any = document.querySelector(`#sound${x}`)
    if (!ele) {
        throw new Error(`cannot find element of ${x}`)
    }
    ele.play();
}

export default audios;