function readLine(msg = '') {
    process.stdin.setEncoding('utf-8');
    process.stdout.write(msg);
    return new Promise((resolve, reject) => {
        process.stdin.resume();
        process.stdin.on('data', (res) => {
            process.stdin.pause();
            res = res.replace('\r\n', ''); // 去掉回车换行符
            resolve(res ? res : undefined); // 如果输入为空，则返回undefined
        });
    });
}

export default readLine;