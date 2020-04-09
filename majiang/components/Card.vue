一张带颜色的麻将牌
<template>
     <span class="Card" :style="{color:C.byName(card).color}">
        {{C.byName(card).image}}
    </span>
</template>
<script>
    import {C} from '../core/Card'

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
        }
    }
</script>
<style lang="less">
    .Card {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
</style>