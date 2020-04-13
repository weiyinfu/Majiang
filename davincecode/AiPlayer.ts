/**
 * 让若干个Ai进行战斗
 * */
import {DavinceCodeServer} from "./DavinceCodeServer";
import {li, randInt, range} from "../majiang/util/Utils";
import {Ai} from "./Ai";
import {Handler, ReverseHandler} from "../majiang/core/Handler";
import {bestSolver, deepSolver, simpleSolver} from "./solver/BestSolver";


async function compare(caseCount: number) {
    const server = new DavinceCodeServer();
    const solvers = [
        simpleSolver,
        deepSolver,
        simpleSolver,
    ]
    const ais: Handler[] = solvers.map(solver => new ReverseHandler(new Ai(solver)));
    const win = li(ais.length, 0);
    for (let i = 0; i < caseCount; i++) {
        const winner = await server.newGame(ais, randInt(0, 100).toString());
        console.log(`round ${i} winner is ${winner}`);
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

compare(100).then(() => {
    console.log('over');
})