import { showMenu } from "./method/scan.js";
import fs from "fs";
import path from "path";
import TaskQueue from "./method/TaskQueue.js";
const queue = new TaskQueue();

function main() {
    init();
    showMenu();
}

function init() {
    if (!fs.existsSync(`./data`)) {
        fs.mkdirSync(path.resolve('./data'))
    }
    if (!fs.existsSync(`./data/cache`)) {
        fs.mkdirSync(path.resolve('./data/cache'))
    }
    if (!fs.existsSync(`./config`)) {
        fs.mkdirSync(path.resolve('./config'))
    }
    if (!fs.existsSync(`./config/savePath.txt`)) {
        fs.writeFileSync(`./config/savePath.txt`, path.resolve('./data'))
    }
}

main();
export { queue };