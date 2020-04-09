一个字符串，里面包含麻将字符，给麻将字符添加颜色
<template>
    <div class="CardString">
        <span v-for="(i,ind) in parts" :key="ind">
            <template v-if="i.type==='card'">
                <Card :card="i.text" style="font-weight: bold;"></Card>
            </template>
        <template v-else>{{i.text}}</template>
        </span>
    </div>
</template>
<script>
    import Card from "./Card";

    export default {
        components: {Card},
        props: {
            text: {
                type: String,
                required: true,
            }
        },
        data() {
            return {}
        },
        computed: {
            parts() {
                const parts = [];
                let now = []
                const t = Array.from(this.text);
                for (let i = 0; i < t.length;) {
                    if (t[i] === '{') {
                        if (now.length)
                            parts.push({
                                type: 'text',
                                text: now.join(''),
                            })
                        now = [];
                        let end = i;
                        while (end < this.text.length && this.text[end] !== '}') end++
                        parts.push({
                            type: "card",
                            text: this.text.slice(i + 1, end),
                        })
                        i = end + 1;
                    } else {
                        now.push(t[i]);
                        i++;
                    }
                }
                if (now.length) {
                    parts.push({
                        type: 'text',
                        text: now.join(''),
                    })
                }
                return parts;
            }
        }
    }
</script>
<style lang="less">
    .CardString {
        display: flex;
        align-items: center;
    }
</style>