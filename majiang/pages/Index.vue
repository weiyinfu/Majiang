<template>
    <div class="Index">
        <div class="left" v-if="cli.hand[0]">
            <!--用户可行的操作列表-->
            <div class="actionList" v-if="actionsExceptRelease.length">
                <div v-for="action in actionsExceptRelease">
                    <div v-if="action.mode===FetchResponseMode.HU_SELF">
                        <button @click="doAct(action)">
                            <card-string :text="`自摸胡{${cli.lastFetch}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===FetchResponseMode.AN_GANG">
                        <button @click="doAct(action)">
                            <card-string :text="`暗杠{${cli.lastFetch}}`"></card-string>
                        </button>
                    </div>
                    <div v-if="action.mode===ReleaseResponseMode.HU">
                        <button @click="doAct(action)">
                            <card-string :text="`胡{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===ReleaseResponseMode.EAT">
                        <button @click="doAct(action)">
                            <card-string
                                    :text="`${action.show.map(x=>'{'+x+'}').join('')}吃{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===ReleaseResponseMode.PENG">
                        <button @click="doAct(action)">
                            <card-string :text="`碰{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===ReleaseResponseMode.MING_GANG">
                        <button @click="doAct(action)">
                            <card-string :text="`杠{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===ReleaseResponseMode.PASS">
                        <button @click="doAct(action)">
                            <card-string :text="`过{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                </div>
            </div>
            <div v-for="userId in cli.USER_COUNT" :key="userId"
                 :style="{background:backgroundOf(userId-1)}">
                <div class="cardList">
                    手牌：
                    <div v-for="(i,cardInd) in cli.hand[userId-1]" :key="cardInd">
                        <card v-if="userId-1===cli.me" :card="i"
                              :class="{
                                  lastFetch:lastFetchIndex===cardInd,
                                  chosen:chosen===cardInd,
                              }"
                              class="mine"
                              @click.native="clickCard(cardInd)"
                        ></card>
                        <card v-else :card="i"></card>
                    </div>
                </div>
                <div class="cardList" v-if="cli.shown[userId-1].length">
                    亮牌：
                    <div class="group" v-for="(group,groupInd) in cli.shown[userId-1]" :key="groupInd+'亮牌'">
                        <card v-for="(i,cardInd) in group" :card="i" :key="cardInd+'亮牌'"></card>
                    </div>
                </div>
                <div class="cardList" v-if="cli.anGang[userId-1].length">
                    暗杠：
                    <card v-for="(i,cardInd) in cli.anGang[userId-1]" :card="i" :key="cardInd+'暗杠'"></card>
                </div>
                <div class="cardList" v-if="cli.release[userId-1].length">
                    弃牌：
                    <card v-for="(i,cardInd) in cli.release[userId-1]" :card="i"
                          :key="cardInd"></card>
                </div>
                <hr/>
            </div>
        </div>
        <div class="right" ref="messageList">
            <div>
                <card-string v-for="(msg,ind) in messages" :key="ind" :text="msg"></card-string>
            </div>
        </div>
        <sound></sound>
    </div>
</template>
<script>
    import Card from "../components/Card.vue";
    import ServerWorker from "../web/server.worker.js";
    import {Ui} from "../web/Ui.js";
    import {FetchResponseMode, ReleaseResponseMode} from "../core/MajiangProtocol.js";
    import CardString from "../components/CardString";
    import Sound from "../components/Sound";
    //批量加载音频文件
    export default {
        components: {CardString, Card, Sound},
        data() {
            const ui = new Ui();
            return {
                inited: false,
                //游戏状态
                server: null,
                ui: ui,
                cli: ui.client,
                chosen: -1,//准备弃掉的牌
                FetchResponseMode,
                ReleaseResponseMode,
                messages: [],//消息列表
            }
        },
        mounted() {
            document.title = "麻将";
            window.haha = this;//用于调试
            this.newGame();
        },
        computed: {
            lastFetchIndex() {
                const cli = this.cli;
                return cli.hand[cli.me].indexOf(cli.lastFetch);
            },
            actionsExceptRelease() {
                //除弃牌以外的全部动作
                return this.ui.actions.filter(act => !this.hasRelease(act));
            }
        },
        methods: {
            updateUi() {
                this.messages = this.ui.messages;
                const ele = this.$refs.messageList;
                this.$nextTick(() => {
                    ele.scrollTop = ele.scrollHeight;
                })
            },
            newGame() {
                if (this.server !== null) {
                    this.server.terminate();
                    this.server = null;
                }
                this.server = new ServerWorker();
                this.server.onmessage = (e) => {
                    this.ui.onMessage(e.data);
                    this.updateUi();
                };
                this.ui.postMessage = (message) => {
                    this.server.postMessage(message);
                }
                this.server.postMessage({
                    //后门：开启新游戏
                    type: "newGame",
                });
            },
            serverStatus() {
                //后门，显示服务器状态
                this.server.postMessage({
                    type: "status"
                })
            },
            backgroundOf(userId) {
                if (userId === this.ui.winner) return '#ffeeee';
                if (userId === this.cli.turn) return '#eeeeee';
                return 'white';
            },
            hasRelease(act) {
                return !!act.release;
            },
            getReleaseAct(cardInd) {
                const card = this.cli.hand[this.cli.me][cardInd];
                //吃，碰，摸牌，三种操作之后需要弃牌
                for (let act of this.ui.actions) {
                    if (this.hasRelease(act) && act.release === card) {
                        //如果是弃牌
                        return act;
                    }
                }
                return null;
            },
            doAct(action) {
                this.server.postMessage(action);
                this.ui.actions = [];
            },
            clickCard(cardInd) {
                //弃牌：如果用户现在不能点击，那么不能让用户点击
                const resp = this.getReleaseAct(cardInd);
                if (!resp) return;
                if (this.chosen === cardInd) {
                    this.doAct(resp);
                    this.chosen = -1;
                } else {
                    this.chosen = cardInd;
                }
            }
        }
    };
</script>
<style lang="less">
    html, body, #app {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
    }

    .Index {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;

        .left {
            width: 70%;
            height: 100%;
            overflow: auto;
            padding: 10px;
            box-sizing: border-box;
        }

        .right {
            width: 30%;
            height: 100%;
            overflow: auto;
        }
    }

    .left {
        hr {
            margin: 0;
        }
    }

    .cardList {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;

        & > div {
            display: flex;
        }

        .Card {
            font-size: 40px;
            user-select: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
        }

        .mine {
            //我的手牌
            font-size: 70px;
        }

        .lastFetch {
            //上一次摸到的牌
            text-shadow: 0 0 3px;
        }

        .chosen {
            //选中的准备弃掉的牌
            border-style: solid;
        }

        .group {
            //已经显示出来的牌
            border-style: solid;
        }
    }

    .actionList {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;

        button {
            height: 100%;
            font-size: 30px;
            margin: 0 5px;
            user-select: none;
        }
    }

    .right {
        padding: 20px;
        box-sizing: border-box;

        .Card {
            font-size: 30px;
            user-select: auto;
        }
    }

    .CardProbability {
        font-size: 30px;
    }
</style>
