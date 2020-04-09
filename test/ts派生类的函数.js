"use strict";
class Dog {
    run() {
        console.log('wanwang');
    }
    shout() {
        this.run();
    }
}
let ani = new Dog();
ani.shout();
