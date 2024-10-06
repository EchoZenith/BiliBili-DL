import { readLine, writeLine } from "./stdio.js";
import fs from "fs";
import { getQRCode } from "./login.js";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import { queue } from "../app.js";
import { bvReg, avReg, shareReg, getRedirectUrl } from "./biliReg.js";
import showCookieManager from "./cookieManager.js";
import showSavePathManager from "./savePathManager.js";
import showFileFormatManager from "./fileFormatManager.js";

//
// ###########################
// #      B站视频下载系统
// #
// # 1) 进入系统
// # 2) Cookie管理
// # 3) 视频保存路径设置
// # 0) 退出系统
// #
// ###########################
//

async function showMenu(msg = "") {
    console.clear();
    writeLine("###########################");
    writeLine("#      B站视频下载系统");
    writeLine("#");
    writeLine("# 1) 进入系统");
    writeLine("# 2) Cookie管理");
    writeLine("# 3) 视频保存路径设置");
    writeLine("# 4) 文件格式设置");
    writeLine("# 0) 退出系统");
    writeLine("#");
    writeLine("###########################");
    if (msg != "") {
        writeLine(msg);
    }
    const code = await readLine("请输入选项：");
    switch (code) {
        case '1':
            return showVideo();
        case '2':
            return showCookieManager();
        case '3':
            return showSavePathManager();
        case '4':
            return showFileFormatManager();
        default:
            return;
    }
}

function showVideo(msg = "") {
    console.clear();
    function _showMenu() {
        writeLine("###########################");
        writeLine("#");
        writeLine("# 0) 返回主菜单");
        writeLine("#");
        writeLine("###########################");
        if (msg != "") {
            writeLine(msg)
        }
    }
    _showMenu(msg);

    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync("./config/cookie.txt")) {
            const msg = await getQRCode();
            if (msg == "退出成功") {
                return resolve(showMenu(msg));
            } else {
                return resolve(showVideo(msg));
            }
        }
        const msg = await readLine("请输入BV号：");
        if (msg === "0") {
            resolve(showMenu());
            return;
        }
        let avid = "";
        let bvid = "";
        if (bvReg.test(msg)) {
            bvid = bvReg.exec(msg)[0];
        } else if (avReg.test(msg)) {
            avid = avReg.exec(msg)[0].slice(2);
        } else if (shareReg.test(msg)) {
            let url = await getRedirectUrl(shareReg.exec(msg)[0], { maxRedirects: 0 });
            if (bvReg.test(url)) {
                bvid = bvReg.exec(url)[0];
            }
        } else {
            writeLine("输入错误");
            return queue.enqueue(showVideo);;
        }
        const response = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}&aid=${avid}`);
        const vip = await axios.get("https://api.bilibili.com/x/vip/privilege/my", {
            headers: {
                "Cookie": fs.readFileSync("./config/cookie.txt", "utf-8").toString()
            }
        });
        const isVip = vip.data.data.is_vip;
        if (response.status === 200) {
            if (response.data.code === 0) {
                let { title, owner, cid, videos, pages } = response.data.data;
                if (videos == 1) {
                    writeLine(`标题：${title}`);
                    writeLine(`UP主：${owner.name}`);
                    writeLine(`cid：${cid}`);
                    await _showPage(cid, bvid, undefined, title, isVip);
                    return resolve();
                } else {
                    writeLine(`UP主：${owner.name}`);
                    for (let i = 0; i < videos; i++) {
                        const item = pages.shift();
                        writeLine(`标题：${item.part}`);
                        writeLine(`cid：${item.cid}`);
                        const se = (Array(videos.toString().length).join('0') + item.page).slice(-videos.toString().length);
                        await _showPage(item.cid, bvid, se, item.part, isVip);
                    }
                    return resolve();
                }

                async function _showPage(cid, bvid, se, title, isVip) {
                    return new Promise(async (resolve, reject) => {
                        const res = await axios.get(`https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&avid=${avid}&fnval=16&fourk=1`, {
                            headers: {
                                "Cookie": fs.readFileSync("./config/cookie.txt", "utf-8").toString(),
                                "Referer": 'https://www.bilibili.com/',
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
                            }
                        });
                        if (res.data.code == -404) {
                            writeLine("当前视频需要大会员才能下载，请先登录大会员账号");
                            queue.enqueue(showVideo);
                            return reject();
                        }
                        const quality = await readLine(`${JSON.stringify(supportFormat(res.data.data.support_formats, isVip))}：`);
                        if (quality == "q" || quality == "Q") {
                            queue.clearAllTasks();
                            videos = [];
                            queue.enqueue(showVideo, "退出成功");
                            return resolve();
                        }
                        await downloadFile(res.data.data.dash.audio[0].baseUrl, "./data/cache/audio.m4s", "音频");
                        for (let i = 0; i < res.data.data.dash.video.length; i++) {
                            let item = res.data.data.dash.video[i];
                            if (item.id === parseInt(quality)) {
                                await downloadFile(item.baseUrl, "./data/cache/video.m4s", "视频");
                                break;
                            }
                        }
                        await mergeVideo(se, title, supportFormat(res.data.data.support_formats, isVip)[quality]);
                        await deleteCache();
                        if (videos != 1 && pages.length > 0) {
                            const item = pages.shift();
                            const se = (Array(videos.toString().length).join('0') + item.page).slice(-videos.toString().length);
                            const title = item.part;
                            writeLine(`标题：${title}`);
                            writeLine(`cid：${item.cid}`);
                            await _showPage(item.cid, bvid, se, title, isVip);
                        } else {
                            queue.enqueue(showVideo, "保存成功");
                        }
                        return resolve();
                    });
                }
            }
        }
    });
}

async function downloadFile(url, name, hint) {
    const writer = fs.createWriteStream(name);
    const response = await axios({
        method: "get",
        url: url,
        responseType: "stream",
        onDownloadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
                // 计算下载百分比
                const percentCompleted = progressEvent.loaded / progressEvent.total * 100;
                process.stdout.write(`下载${hint ? hint : ""}: ${percentCompleted.toFixed(2)}%\r`);
                if (percentCompleted == 100) {
                    writeLine();
                }
            }
        },
        headers: {
            "Cookie": fs.readFileSync("./config/cookie.txt", "utf-8"),
            "Referer": "https://www.bilibili.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
        }
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function supportFormat(support_formats, isVip) {
    const result = {};
    support_formats.forEach((item) => {
        if (item.quality > 80 && !isVip) {
            return;
        }
        result[item.quality] = item.new_description;
    });
    return result;
}

function fileFormat(se = "01", title, quality, ext) {
    const format = fs.readFileSync("./config/fileFormat.txt", "utf-8");
    return format.replace('{se}', se)
        .replace('{title}', title)
        .replace('{quality}', quality)
        .replace('{ext}', ext);
}

function mergeVideo(se, title, quality) {
    return new Promise(async (resolve, reject) => {
        const savePath = fs.readFileSync("./config/savePath.txt", "utf-8");
        const command = ffmpeg()
            .input('./data/cache/video.m4s')
            .input('./data/cache/audio.m4s')
            .output(`${savePath}/${fileFormat(se, title, quality, 'mp4')}`)
            .audioCodec('copy') // 复制音频流
            .videoCodec('copy') // 复制视频流
            .on('progress', (progress) => {
                process.stdout.write('合并视频：' + progress.percent.toFixed(2) + '%\r');
            })
            .on('end', () => {
                writeLine('\nDone !\n');
                return resolve();
            })
            .on('error', (err) => {
                writeLine('An error occurred: ' + err.message);
                return reject(err);
            });
        command.run();
    });
}
function deleteCache() {
    return new Promise((resolve, reject) => {
        fs.unlinkSync("./data/cache/video.m4s");
        fs.unlinkSync("./data/cache/audio.m4s");
        return resolve();
    });
}

export { showMenu }