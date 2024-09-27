const { stdin, stdout } = process;

function readLine(msg = '') {
    stdin.setEncoding('utf-8');
    stdout.write(msg);
    return new Promise((resolve, reject) => {
        stdin.resume();
        // 保存对监听器函数的引用
        const onData = (res) => {
            stdin.pause();
            res = res.replace('\r\n', ''); // 去掉回车换行符
            resolve(res ? res : undefined); // 如果输入为空，则返回undefined
            // 移除当前的监听器
            stdin.removeListener('data', onData);
        };
        // 添加监听器
        stdin.on('data', onData);
    });
}

function writeLine(msg = '', end = '\n') {
    stdout.write(msg + end);
}

export { readLine, writeLine };