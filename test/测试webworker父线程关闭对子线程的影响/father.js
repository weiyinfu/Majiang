const son = new Worker('./son.js')
setInterval(() => {
    console.log('father')
}, 1000)