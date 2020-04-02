一张带颜色的麻将牌
<template>
     <span class="Card" :style="{color:CardMap[card].color}">
        {{CardMap[card].image}}
    </span>
</template>
<script>
    import {CardMap} from '../js/Card'

    export default {
        props: {
            card: {
                type: String,
                required: true
            }
        },
        data() {
            return {
                CardMap
            }
        }
    }
</script>
