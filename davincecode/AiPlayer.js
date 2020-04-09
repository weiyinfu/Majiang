"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 让若干个Ai进行战斗
 * */
const DavinceCodeServer_1 = require("./DavinceCodeServer");
const Utils_1 = require("../majiang/util/Utils");
const Ai_1 = require("./Ai");
const Handler_1 = require("../majiang/core/Handler");
function compare(caseCount) {
    return __awaiter(this, void 0, void 0, function* () {
        const server = new DavinceCodeServer_1.DavinceCodeServer();
        const ais = Utils_1.range(3).map(x => new Handler_1.ReverseHandler(new Ai_1.Ai()));
        const win = Utils_1.li(ais.length, 0);
        for (let i = 0; i < caseCount; i++) {
            const winner = yield server.newGame(ais, Utils_1.randInt(0, 100).toString());
            console.log(`winner is ${winner}`);
            win[winner]++;
        }
        const table = [];
        for (let i = 0; i < win.length; i++) {
            table.push({
                winner: i,
                times: win[i]
            });
        }
        console.table(table);
    });
}
compare(10000).then(() => {
    console.log('over');
});
