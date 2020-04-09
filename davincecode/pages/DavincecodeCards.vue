<template>
    <div>
        <div style="font-size: 40px">
            🂠🂡🂢🂣🂤🂥🂦🂧🂨🂩🂪🂫🂬🂭🂮
            🂱🂲🂳🂴🂵🂶🂷🂸🂹🂺🂻🂼🂽🂾🂿
            🃁🃂🃃🃄🃅🃆🃇🃈🃉🃊🃋🃌🃍🃎🃏
            🃑🃒🃓🃔🃕🃖🃗🃘🃙🃚🃛🃜🃝🃞🃟
        </div>
        <div v-for="(v,k) in CardMap" :key="k">{{v}}
            <span>{{v.image}}</span>
        </div>
    </div>
</template>
<script>
    import {CardMap} from "../Card.js";

    export default {
        data() {
            return {
                CardMap,
            }
        }
    }
</script>