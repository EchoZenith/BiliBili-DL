import fs from 'fs'
import path from 'path'
import { readLine, writeLine } from './stdio.js';
import { showMenu } from './scan.js';

async function showSavePathManager(msg = "") {
    console.clear();
    writeLine("###########################");
    writeLine("#       保存路径管理");
    writeLine("#");
    writeLine("# 1) 显示保存路径");
    writeLine("# 2) 修改保存路径");
    writeLine("# 0) 返回主菜单");
    writeLine("#");
    writeLine("###########################");
    if (msg != "") {
        writeLine(msg);
    }
    const code = await readLine("请输入选项：");
    switch (code) {
        case "1":
            //TODO: 显示保存路径
            const savePath = fs.readFileSync("./config/savePath.txt", "utf-8");
            showSavePathManager(`当前保存路径为：${path.resolve(savePath)}`);
            break;
        case "2":
            //TODO: 修改保存路径
            const newSavePath = await readLine("请输入新的保存路径：");
            fs.writeFileSync("./config/savePath.txt", path.resolve('./data/')(newSavePath));
            showSavePathManager("保存路径修改成功！");
            break;
        default:
            return showMenu();
    }
}

export default showSavePathManager;