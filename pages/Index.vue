<template>
    <div class="Index">
        <div class="left" v-if="cli.hand[0]">
            <!--用户可行的操作列表-->
            <div class="actionList" v-if="bigActions.length">
                <div v-for="action in bigActions">
                    <div v-if="action.mode===FetchReplyMode.HU_SELF">
                        <button @click="doAct(action)">
                            <card-string :text="`自摸胡{${cli.lastFetch}}`"></card-string>
                        </button>
                    </div>
                    <div v-if="action.mode===ReleaseReplyMode.HU">
                        <button @click="doAct(action)">
                            <card-string :text="`胡{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===FetchReplyMode.AN_GANG">
                        <button @click="doAct(action)">
                            <card-string :text="`暗杠{${cli.lastFetch}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===ReleaseReplyMode.EAT">
                        <button @click="doAct(action)">
                            <card-string
                                    :text="`${action.show.map(x=>'{'+x+'}').join('')}吃{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===ReleaseReplyMode.PENG">
                        <button @click="doAct(action)">
                            <card-string :text="`碰{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===ReleaseReplyMode.MING_GANG">
                        <button @click="doAct(action)">
                            <card-string :text="`杠{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                    <div v-else-if="action.mode===ReleaseReplyMode.PASS">
                        <button @click="doAct(action)">
                            <card-string :text="`过{${cli.lastRelease}}`"></card-string>
                        </button>
                    </div>
                </div>
            </div>
            <div v-for="userId in cli.USER_COUNT" :key="userId"
                 :style="{background:userId===cli.turn+1?'#eeeeee':'white'}">
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
                <card-string v-for="(msg,ind) in ui.messages" :key="ind" :text="msg"></card-string>
            </div>
        </div>
        <audio v-for="(v,k) in audios" :key="k" :src="v" :ref="k" hidden></audio>
    </div>
</template>
<script>
    import Card from "../components/Card.vue";
    import ServerWorker from "../js/server.worker.ts";
    import {Ui} from "../js/Ui.ts";
    import {FetchResponseMode, ReleaseResponseMode} from "../js/MajiangProtocol.ts";
    import CardString from "../components/CardString";

    const C = require('../js/Card.ts');
    //批量加载音频文件
    const audios = {
        eat: '女声动作/吃.mp3',
        peng: '女声动作/碰.mp3',
        gang: '女声动作/杠.mp3',
        win: 'win.mp3',
        lose: "lose.mp3",
        start: "start.mp3",
    }
    for (let i in audios) {
        audios[i] = require(`../res/${audios[i]}`).default;
    }
    for (let i of C.Sounds) {
        audios[i] = require(`../res/女声牌/${i}.mp3`).default;
    }
    export default {
        components: {CardString, Card},
        data() {
            const ui = new Ui(this);
            return {
                inited: false,
                //游戏状态
                userId: 0, //用户是第几号玩家
                ui: ui,
                cli: ui.client,
                chosen: -1,
                FetchReplyMode: FetchResponseMode,
                ReleaseReplyMode: ReleaseResponseMode,
                C,
                server: null,
                audios,
            }
        },
        mounted() {
            document.title = "麻将";
            this.newGame();
            window.haha = this;//用于调试
        },
        computed: {
            lastFetchIndex() {
                const cli = this.cli;
                return cli.hand[cli.me].indexOf(cli.lastFetch);
            },
            bigActions() {
                //除弃牌以外的全部动作
                return this.ui.actions.filter(act => !this.hasRelease(act));
            }
        },
        methods: {
            newGame() {
                if (this.server !== null) {
                    this.server.terminate();
                    this.server = null;
                }
                this.server = new ServerWorker();
                this.server.onmessage = (e) => {
                    this.ui.onMessage(e.data);
                };
                this.ui.postMessage({
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
                this.ui.postMessage(action);
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
