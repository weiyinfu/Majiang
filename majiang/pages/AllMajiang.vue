<template>
    <div>
        <div v-for="(i,ind) in NAMES" style="display: flex;align-items: center;">
            <card :card="i" :key="ind" @click.native="playSound(i)" style="font-size: 70px;"></card>
            <span style="font-size:20px">
                index：{{C.byName(i).index}}
                序数：{{C.byName(i).ordinal}}
                名称：{{C.byName(i).name}}
                part:{{C.byName(i).part}}
                ordinal:{{C.byName(i).ordinal}}
            </span>
        </div>
        <sound></sound>
    </div>
</template>
<script>
    import Card from "../components/Card"
    import {C, NAMES} from "../core/Card.js";
    import audios from "../web/Sound.js";
    import {playSound} from "../web/Sound";
    import Sound from "../components/Sound";

    export default {
        components: {Card, Sound},
        data() {
            return {
                C,
                audios,
                NAMES,
                playSound,
            }
        },
        mounted() {
            document.title = '全部麻将牌';
        }
    }
</script>