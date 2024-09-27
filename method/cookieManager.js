import fs from 'fs'
import { readLine, writeLine } from './stdio.js';
import { showMenu } from './scan.js';
import { checkCookie, getQRCode } from './login.js';

async function showCookieManager(msg = "") {
    console.clear();
    writeLine("###########################");
    writeLine("#       Cookie管理");
    writeLine("#");
    writeLine("# 1) 登录获取Cookie");
    writeLine("# 2) 检测Cookie是否可用");
    writeLine("# 3) 查看Cookie");
    writeLine("# 4) 删除Cookie");
    writeLine("# 0) 返回主菜单");
    writeLine("#");
    writeLine("###########################");
    if (msg != "") {
        writeLine(msg);
    }
    const code = await readLine("请输入选项：");
    switch (code) {
        case "1":
            // TODO: 登录获取Cookie
            await getQRCode();
            showCookieManager("登录成功");
            break;
        case "2":
            // TODO: 检测Cookie是否可用
            const flag = await checkCookie();
            if (flag) {
                showCookieManager("Cookie可用");
            } else {
                showCookieManager("Cookie不可用");
            }
            break;
        case "3":
            // TODO: 查看Cookie
            if (fs.existsSync('./config/cookie.txt')) {
                showCookieManager(fs.readFileSync('./config/cookie.txt', 'utf-8'));
            } else {
                showCookieManager("Cookie文件不存在");
            }
            break;
        case "4":
            // TODO: 删除Cookie
            if (fs.existsSync("./config/cookie.txt")) {
                fs.unlinkSync('./config/cookie.txt');
            }
            showCookieManager("删除成功");
            break;
        default:
            return showMenu();
    }
}
export default showCookieManager;