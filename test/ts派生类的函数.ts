interface Animal {
    shout(): void;
}

class Dog implements Animal {
    run() {
        console.log('wanwang')
    }

    shout() {
        this.run()
    }
}

let ani: Animal = new Dog();
ani.shout()