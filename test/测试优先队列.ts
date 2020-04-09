import {Topk} from "../majiang/util/Topk";
import seedrandom from "seedrandom";

class Node {
    x: number;

    constructor(x: number) {
        this.x = x;
    }
}

const com = (x: Node, y: Node) => {
    return x.x - y.x;
}
const q: Topk<Node> = new Topk<Node>(5, com);
const ele: number[] = [];
const $ = seedrandom();
for (let i = 0; i < 20; i++) {
    const x = $.int32() % 100
    ele.push(x)
    q.push(new Node(x));
    console.log('pushing', x, q.toList().map(x => x.x).join(','))
}
ele.sort()
console.log(ele)
console.log(q.toList())