<template>
    <div class="Sound">
        <audio v-for="(v,k) in audios" :key="k" :src="v" :id="`sound${k}`" hidden></audio>
    </div>
</template>
<script>
    import audios from "../web/Sound";

    export default {
        data() {
            return {
                audios
            }
        }
    }
</script>