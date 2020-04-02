class Haha {
    haha: string;
    age: number;

    constructor(haha: string, age: number) {
        this.haha = haha;
        this.age = age;
    }
}

const x: Haha = {
    age: 18,
    haha: 'hello world'
};
console.log(x);