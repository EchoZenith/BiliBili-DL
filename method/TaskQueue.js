class TaskQueue {
    constructor() {
        this.tasks = [];
        this.flag = true; // 添加一个标志位，用于控制任务队列的执行
    }

    enqueue(task, ...args) {
        this.tasks.push({ task, args });
        this.runNextTask();
    }

    runNextTask() {
        if (this.tasks.length > 0 && this.flag) {
            this.flag = false; // 将标志位设置为false，表示当前有任务正在执行
            const { task, args } = this.tasks.shift();
            task(...args).then(() => {
                this.flag = true; // 任务执行完毕，将标志位设置为true，表示可以执行下一个任务
                this.runNextTask();
            }).catch(() => {
                this.flag = true; // 任务执行出错，将标志位设置为true，表示可以执行下一个任务
                this.runNextTask();
            })
        }
    }
}
export default TaskQueue;