"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//批量加载音频文件
const Card_1 = require("../core/Card");
const audios = {
    eat: '女声动作/吃.mp3',
    peng: '女声动作/碰.mp3',
    gang: '女声动作/杠.mp3',
    win: 'win.mp3',
    lose: "lose.mp3",
    start: "start.mp3",
    illegal: "illegal.mp3"
};
for (let i in audios) {
    audios[i] = require(`../res/${audios[i]}`).default;
}
for (let i of Card_1.Sounds) {
    audios[i] = require(`../res/女声牌/${i}.mp3`).default;
}
function playSound(x) {
    if (window.mute) {
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
    if (!audios[x])
        throw new Error(`cannot find audio ${x}`);
    const ele = document.querySelector(`#sound${x}`);
    if (!ele) {
        throw new Error(`cannot find element of ${x}`);
    }
    ele.play();
}
exports.playSound = playSound;
exports.default = audios;
