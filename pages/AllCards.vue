<template>
    <div>
        <div v-for="(i,ind) in C.NAMES" style="display: flex;align-items: center;">
            <card :card="i" :key="ind" @click.native="playSound(i)" style="font-size: 70px;"></card>
            <span style="font-size:20px">
                index：{{C.CardMap[i].index}}
                序数：{{C.CardMap[i].ordinal}}
                名称：{{C.CardMap[i].name}}
                part:{{C.CardMap[i].part}}
                ordinal:{{C.CardMap[i].ordinal}}
            </span>
        </div>
        <audio :ref="i" v-for="i in C.Sounds" :key="i" :src="`../res/女声牌/${i}.mp3`" hidden></audio>
    </div>
</template>
<script>
    import Card from "../components/Card"

    const C = require('../js/Card.ts')
    export default {
        components: {Card},
        data() {
            return {
                C,
            }
        }, methods: {
            playSound(x) {
                this.$refs[C.CardMap[x].sound][0].play()
            }
        }
    }
</script>