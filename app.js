import { showMenu } from "./method/scan.js";
import fs from "fs";
import TaskQueue from "./method/TaskQueue.js";
const queue = new TaskQueue();

function main() {
    init();
    showMenu();
}

function init() {
    if (!fs.existsSync(`./data`)) {
        fs.mkdirSync(`./data`)
    }
    if (!fs.existsSync(`./data/cache`)) {
        fs.mkdirSync(`./data/cache`)
    }
    if (!fs.existsSync(`./config`)) {
        fs.mkdirSync(`./config`)
    }
    if (!fs.existsSync(`./config/savePath.txt`)) {
        fs.writeFileSync(`./config/savePath.txt`, './data/')
    }
}

main();
export { queue };