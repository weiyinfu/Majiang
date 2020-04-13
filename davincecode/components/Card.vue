一张带颜色的达芬奇密码牌
<template>
     <span class="Card" :style="getStyle()">
        {{C.byName(card).image}}
    </span>
</template>
<script>
    import {C} from "../Card";

    export default {
        props: {
            card: {
                type: String,
                required: true
            }
        },
        data() {
            return {
                C
            }
        },
        methods: {
            getStyle() {
                const ind = C.byName(this.card).ordinal & 1;
                const colors = ['black', '#992222']
                return {
                    color: colors[ind],
                }
            }
        },
    }
</script>
<style>
    .Card {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
</style>
