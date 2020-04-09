使用AI打麻将，用户输入每个事件，AI返回决策。
<template>
    <div class="Ai">
        <div v-if="helper" class='playing'>
            <div class="left" v-if="helper">
                <!--主语区-->
                <el-radio-group v-model="helper.user" @change="helper.changeUser()">
                    <el-radio-button v-for="userId in cli.USER_COUNT"
                                     :key="userId"
                                     :label="userId-1"
                                     :disabled="!helper.userEnabled[userId-1]"
                    >{{ui.userNames[userId-1]}}
                    </el-radio-button>
                </el-radio-group>
                <!--谓语区-->
                <el-radio-group v-model="helper.act" @change="helper.changeAct()">
                    <el-radio-button v-for="(v,k) in helper.actEnabled"
                                     :key="k"
                                     :label="k"
                                     :disabled="!v"
                                     :class="{bestAction:helper.isBestAction(k)}"
                    >{{helper.ActionNames[k]}}
                    </el-radio-button>
                </el-radio-group>
                <!--其它按钮-->
                <el-button @click="over()">结束</el-button>
                <el-switch
                        v-model="mute"
                        @change="changeSound"
                        active-text="静音">
                </el-switch>
                <!--宾语区-->
                <div>
                    <div class="store" v-if="helper.cards.length>0">
                        <template v-for="(i,ind) in helper.cards">
                            <div v-if="i instanceof Array" :key="ind" class="group"
                                 @click="helper.doAct(i)"
                                 :class="{bestCard:helper.isBestCard(i)}">
                                <card v-for="(card,cardInd) in i" :key="cardInd" :card="card"></card>
                            </div>
                            <card v-else :key="ind" :card="i" @click.native="helper.doAct(i)"
                                  :class="{bestCard:helper.isBestCard([i])}"
                            ></card>
                        </template>
                    </div>
                    <div v-else>
                        <el-button @click.native="helper.doAct('')" type="primary">就这样</el-button>
                    </div>
                </div>
                <div class="remind" v-if="helper.message">
                    {{helper.message}}
                </div>
                <!--全景图区-->
                <div v-if="cli&&cli.hand[0]">
                    <div v-for="userId in cli.USER_COUNT" :key="userId"
                         :style="{background:backgroundOf(userId-1)}"
                         class="userCards"
                    >
                        <div class="cardList">
                            手牌：
                            <div v-for="(i,cardInd) in cli.hand[userId-1]" :key="cardInd">
                                <card :card="i"></card>
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
                    </div>
                </div>
            </div>
            <div class="right" ref="messageList">
                <card-string v-for="(message,ind) in ui.messages" :key="ind" :text="message"></card-string>
            </div>
        </div>
        <start-panel v-else @submit="onStart"></start-panel>
        <sound></sound>
    </div>
</template>

<script>
    import Card from "../components/Card";
    import Sound from "../components/Sound";
    import CardString from "../components/CardString";
    import {MessageType} from "../core/MajiangProtocol";
    import StartPanel from "../components/StartPanel";
    import {AiHelper} from "../web/AiHelper";

    export default {
        components: {Card, Sound, CardString, StartPanel},
        data() {
            return {
                ui: null,
                cli: null,
                helper: null,
                mute: false,
                MessageType
            }
        },
        mounted() {
            document.title = '麻将助手'
            window.haha = this;
        },

        methods: {
            changeSound(mute) {
                window.mute = mute;
            },
            backgroundOf(userId) {
                if (userId === this.ui.winner) return '#ffeeee';
                if (userId === this.cli.turn) return '#eeeeee';
                return 'white';
            },
            over() {
                if (this.helper) {
                    this.helper.shutdown();
                    this.helper = null;
                }
            },
            updateUi() {
                //刷新UI
                const messageList = this.$refs.messageList;
                if (messageList) {
                    this.$nextTick(() => {
                        messageList.scrollTop = messageList.scrollHeight;
                    });
                }
            },
            onStart(hand, me) {
                if (this.helper) {
                    this.helper.shutdown();
                    this.helper = null;
                }
                this.helper = new AiHelper();
                this.ui = this.helper.ui;
                this.cli = this.helper.ui.client;
                this.ui.postMessage = message => {
                    this.updateUi();
                }
                this.helper.onStart(hand, me);
            }
        }
    }
</script>
<style lang="less">
    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .Ai {
        display: flex;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        align-items: center;
        justify-content: center;
        background: #555555;
        overflow: auto;

        .StartPanel {
            background: #eedddd;
            z-index: 100;
            box-sizing: border-box;
            border-radius: 20px;
            padding: 10px;
            max-width: 90%;
            width: unset;

            input[type=number] {
                font-size: 20px;
                outline: none;
                user-select: none;
            }

            .info {
                color: #dd2222;
                float: right;
            }

            .footer {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;

                .submit-button {
                    float: right;
                }
            }

        }

        .playing {
            display: flex;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            align-items: center;
            justify-content: center;
            background: white;
        }

        .left {
            width: 70%;
            height: 100%;
            overflow: auto;
            padding: 10px;
            box-sizing: border-box;

            .userCards {
                border-bottom: solid 2px #aaaaaa;
            }

            .cardList {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                align-items: center;

                & > div {
                    display: flex;
                }
            }

            .bestAction {
                border: solid red 2px;
            }

            .bestCard {
                border: solid red 2px;
            }

            .remind {
                color: red;
            }
        }

        .right {
            width: 30%;
            border-left-style: solid;
            border-left-width: 2px;
            padding: 10px;
            height: 100%;
            overflow: auto;
            box-sizing: border-box;

            .CardString {
                font-size: 20px;

                .Card {
                    font-size: 25px;
                }
            }
        }

        .Card {
            user-select: none;
            font-size: 50px;
        }

        .chosen {
            .Card {
                font-size: 50px;
            }
        }

        .store {
            .Card {
                font-size: 40px;
            }

            .group {
                border: solid #888888;
                display: inline-flex;
            }
        }

        .startButton {
            width: 50%;
            height: 50%;
        }
    }
</style>