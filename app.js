import { showVideo } from "./method/scan.js";
import TaskQueue from "./method/TaskQueue.js";
const queue = new TaskQueue();

function main() {
    showVideo();
}

main();
export { queue };