达芬奇密码游戏界面


<template>
    <div class="DavinceCode" v-if="inited">
        <div class="left">
            <button v-if="canPass()" @click="doPass">过</button>
            <div v-if="cli.over()">
                <button @click="newGame()">新游戏</button>
                <button @click="replay()">重玩</button>
            </div>
            <div v-for="(hand,userId) in cli.hand" :key="userId" class="handCards">
                <div v-if="userId===cli.me">
                    <card :card="i" v-for="(i,ind) in hand" :key="ind" :style="getStyle(userId,ind)"></card>
                </div>
                <div v-else>
                    <card :card="i" v-for="(i,ind) in hand" :key="ind" @click.native="clickCard(userId,ind)"></card>
                </div>
            </div>
            <div v-if="options" class="optionCards">
                <!--如果有可选项-->
                <card :card="i" v-for="(i,ind) in options" :key="ind" @click.native="clickWhat(i)"></card>
            </div>
        </div>
        <div class="right" ref="right">
            <div class="messageList">
                <div v-for="message in ui.messages">{{message}}</div>
            </div>
        </div>
    </div>
</template>
<script>
    import {Ui} from "../Ui.js";
    import Server from "../server.worker.js";
    import Card from "../components/Card";
    import {EmptyCall, MessageType} from "../DavinceCodeProtocol";
    import {isUnknown} from "../Card";
    import {bestSolver} from "../solver/BestSolver";

    export default {
        components: {Card,},
        data() {
            return {
                ui: null,
                server: null,
                cli: null,
                inited: false,
                call: EmptyCall(),
                options: [],//可选项，当前用户点击的位置有哪些可选项
                advice: [],//三维数组，表示who,which处所有可能的解
            }
        },
        mounted() {
            document.title = "达芬奇密码";
            window.haha = this;
            this.newGame();
        },
        methods: {
            canPass() {
                //用户是否可以过牌
                if (this.cli.over()) return false;
                return this.getPassAction() !== null;
            },
            updateUi() {
                this.$nextTick(() => {
                    this.$refs.right.scrollTop = this.$refs.right.scrollHeight;
                });
            },
            newGame() {
                this.server = new Server();
                this.ui = new Ui((message) => {
                    this.server.postMessage(message)
                });
                this.cli = this.ui.cli;
                this.server.postMessage({type: 'newGame'})
                this.server.onmessage = event => {
                    this.ui.onMessage(event.data);
                    this.advice = bestSolver.getAdvice(this.cli.hand, this.cli.badCalls);
                    this.updateUi();
                }
                this.inited = true;
            },
            replay() {
                this.server.postMessage({type: "replay"})
            },
            serverStatus() {
                this.server.postMessage({
                    type: 'status',
                })
            },
            getPassAction() {
                const firstAction = this.ui.actions[0];
                if (firstAction && firstAction.type === MessageType.CALL) {
                    if (firstAction.call === null) return firstAction;
                }
                return null;
            },
            getCallAction() {
                //猜测谁的哪张牌
                for (let act of this.ui.actions) {
                    if (act.type === MessageType.CALL || act.type === MessageType.FETCH) {
                        if (act.call) {
                            return act;
                        }
                    }
                }
                return null;
            },
            doPass() {
                const act = this.getPassAction();
                if (act === null) {
                    throw new Error(`cannot find pass action`);
                }
                this.ui.postMessage(this.getPassAction());
                this.options = [];
                this.ui.bestAction = [];
            },
            doCall() {
                const act = this.getCallAction();
                act.call = this.call;
                this.ui.postMessage(act);
                this.options = [];
            },
            clickWhat(what) {
                this.call.what = what;
                this.doCall();
            },
            clickCard(who, which) {
                //点击某张未知牌，显示全部可能
                if (!isUnknown(this.cli.hand[who][which])) return;
                if (this.cli.over()) return;
                if (this.cli.isDied(this.cli.me)) return;//我已经死了
                this.call.who = who;
                this.call.which = which;
                this.options = this.advice[who][which];
            },
            getStyle(who, which) {
                if (who === this.cli.me) {
                    if (!this.cli.shown.has(this.cli.hand[who][which])) {
                        return {
                            background: 'bisque',
                        }
                    }
                }
            },
        }
    }
</script>
<style lang="less">
    .DavinceCode {
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;

        display: flex;

        .right {
            width: 30%;
            height: 100%;
            overflow: auto;
            border-left: black;
            border-left-width: 2px;
            border-left-style: solid;
            padding-left: 12px;
            box-sizing: border-box;
        }

        .left {
            width: 70%;
            height: 100%;
            overflow: auto;

            button {
                font-size: 40px;
            }
        }

        .Card {
            user-select: none;
            margin: 2px;
            border-radius: 10px;
        }

        .handCards {
            margin-top: 10px;

            .Card {
                font-size: 60px;
            }
        }

        .optionCards {
            margin-top: 20px;
            font-size: 35px;
        }
    }

</style>