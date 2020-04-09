/**
 * 让若干个Ai进行战斗
 * */
import {DavinceCodeServer} from "./DavinceCodeServer";
import {li, randInt, range} from "../majiang/util/Utils";
import {Ai} from "./Ai";
import {Handler, ReverseHandler} from "../majiang/core/Handler";


async function compare(caseCount: number) {
    const server = new DavinceCodeServer();
    const ais: Handler[] = range(3).map(x => new ReverseHandler(new Ai()));
    const win = li(ais.length, 0);
    for (let i = 0; i < caseCount; i++) {
        const winner = await server.newGame(ais, randInt(0, 100).toString());
        console.log(`winner is ${winner}`);
        win[winner]++;
    }
    const table = []
    for (let i = 0; i < win.length; i++) {
        table.push({
            winner: i,
            times: win[i]
        })
    }
    console.table(table);
}

compare(10000).then(() => {
    console.log('over');
})