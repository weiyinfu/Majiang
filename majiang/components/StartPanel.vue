开局时设置手牌
<template>
    <div class="StartPanel"
         :visible="visible">
        <h1 style="text-align: center">麻将AI助手</h1>
        <div>
            我是<input type="number" min="0" max="3" step="1" v-model="me">号
        </div>
        <div class="chosen" title="开始的手牌">
            已选手牌：
            <card v-for="(i,ind) in hand" :card="i" :key="ind" @click.native="removeChosenCard(ind)"></card>
            <div style="float:right;">
                <el-button @click="hand=[]" icon="fa fa-trash" size="mini">清空手牌</el-button>
                <el-button-group>
                    <el-button title="复制手牌字符画" size="mini" icon="fa fa-clipboard" @click="copyUtf8">
                        复制图画
                    </el-button>
                    <el-button title="复制字符串" size="mini" icon="fa fa-copy" @click="copyHand">复制文本</el-button>
                </el-button-group>
            </div>
        </div>
        <div class="store" title="牌堆">
            牌堆：
            <card v-for="i in 34" :key="i" :card="NAMES[i-1]" @click.native="chooseCard(NAMES[i-1])"></card>
        </div>
        <card-string class="info" :text="message"></card-string>
        <div class="footer">
            <el-button type="primary" class="submit-button" :disabled="!canStart" @click="start">开 始</el-button>
        </div>
    </div>
</template>
<script>
    import {getCount} from "../util/Utils";
    import audios, {playSound} from "../web/Sound";
    import {CardMap, NAMES, sortCards} from "../core/Card";
    import Card from "./Card";
    import CardString from "./CardString";

    export default {
        components: {Card, CardString},
        props: {
            visible: {
                type: Boolean,
                default: false,
            },
            handCardCount: {
                type: Number,
                default: 13,
            }
        },
        data() {
            return {
                message: '',
                me: 0,
                hand: NAMES.slice(0, 13),
                NAMES
            }
        },

        computed: {
            canStart() {
                if (this.hand.length < this.handCardCount) {
                    return false;
                }
                return true;
            }
        },
        methods: {
            removeChosenCard(ind) {
                if (ind < 0 || ind >= this.hand.length) {
                    this.playSound(audios.illegal);
                    return
                }
                this.hand.splice(ind, 1)
                this.message = ''
            },
            copyText(text) {
                let textarea = document.createElement("textarea"); //创建input对象
                let currentFocus = document.activeElement; //当前获得焦点的元素
                let toolBoxwrap = document.querySelector("body"); //将文本框插入到NewsToolBox这个之后
                toolBoxwrap.appendChild(textarea); //添加元素
                textarea.value = text;
                textarea.focus();
                if (textarea.setSelectionRange) {
                    textarea.setSelectionRange(0, textarea.value.length); //获取光标起始位置到结束位置
                } else {
                    textarea.select();
                }
                let flag = document.execCommand("copy"); //执行复制
                toolBoxwrap.removeChild(textarea); //删除元素
                currentFocus.focus();
                return flag;
            },
            copyUtf8() {
                this.copyText(this.hand.map(x => CardMap[x].image))
                this.$message('已将手牌UTF8复制到剪贴板');
            },
            copyHand() {
                this.copyText(this.hand.join(','))
                this.$message('已将手牌复制到剪贴板');
            },
            chooseCard(card) {
                if (getCount(this.hand, card) >= 4
                    || this.hand.length >= this.handCardCount) {
                    playSound(audios.illegal);
                    if (this.hand.length >= this.handCardCount) {
                        this.message = `手牌数不能超过${this.handCardCount}张`
                    } else {
                        this.message = `已经选了4张{${card}}了`
                    }
                    return;
                }
                this.message = ''
                this.hand.push(card);
                sortCards(this.hand);
            },
            start() {
                this.$emit("submit", this.hand, this.me,)
            }, cancel() {
                this.$emit('cancel')
            }
        }
    }
</script>
<style lang="less">
    .StartPanel {
        .Card {
            cursor: grabbing;
        }
    }
</style>