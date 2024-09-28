import fs from 'fs'
import path from 'path'
import { readLine, writeLine } from './stdio.js';
import { showMenu } from './scan.js';

async function showFileFormatManager(msg = "") {
    console.clear();
    writeLine("###########################");
    writeLine("#       文件格式管理");
    writeLine("#");
    writeLine("# {se} 序号");
    writeLine("# {title} 标题");
    writeLine("# {quality} 画质");
    writeLine("# {ext} 文件扩展名");
    writeLine("#");
    writeLine("###########################");
    writeLine("#");
    writeLine("# 1) 修改格式");
    writeLine("# 2) 重置默认格式");
    writeLine("# 3) 显示当前格式");
    writeLine("# 0) 返回主菜单");
    writeLine("#");
    writeLine("###########################");
    if (msg != "") {
        writeLine(msg);
    }
    const code = await readLine("请输入选项：");
    switch (code) {
        case "1":
            const format = await readLine("请输入格式：");
            fs.writeFileSync(`./config/fileFormat.txt`, format);
            return showFileFormatManager("修改成功");
        case "2":
            fs.writeFileSync(`./config/fileFormat.txt`, '{se}_{title}.{ext}');
            return showFileFormatManager("重置默认格式成功");
        case "3":
            return showFileFormatManager("当前格式：" + fs.readFileSync(`./config/fileFormat.txt`));
        default:
            return showMenu();
    }
}

export default showFileFormatManager;