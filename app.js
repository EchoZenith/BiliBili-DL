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
        fs.mkdirSync(path.resolve('./data'));
    }
    if (!fs.existsSync(`./data/cache`)) {
        fs.mkdirSync(path.resolve('./data/cache'));
    }
    if (!fs.existsSync(`./config`)) {
        fs.mkdirSync(path.resolve('./config'));
    }
    if (!fs.existsSync(`./config/savePath.txt`)) {
        fs.writeFileSync(`./config/savePath.txt`, path.resolve('./data'));
    }
    if (!fs.existsSync(`./config/fileFormat.txt`)) {
        fs.writeFileSync(`./config/fileFormat.txt`, '{se}_{title}.{ext}');
    }
}

main();
export { queue };