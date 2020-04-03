/**
 * 只有throw Error()才会有堆栈信息，throw string不会打印堆栈信息
 * */
function haha() {
    baga()
}

function baga() {
    throw 'haha'
}


function anotherHaha() {
    anotherBaga()
}

function anotherBaga() {
    throw new Error();
}

// haha()
anotherHaha();