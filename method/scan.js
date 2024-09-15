import readline from "readline";
import fs from "fs";
import { getQRCode } from "./login.js";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import { queue } from "../app.js";


function showVideo() {
    return new Promise(async (resolve, reject) => {
        let r1 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        if (!fs.existsSync("./config/cookie.txt")) {
            await getQRCode();
        }
        r1.question("请输入bv号：", async function (bvid) {
            const response = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
            const vip = await axios.get("https://api.bilibili.com/x/vip/privilege/my", {
                headers: {
                    "Cookie": fs.readFileSync("./config/cookie.txt", "utf-8").toString()
                }
            });
            const isVip = vip.data.is_vip;
            if (response.status === 200) {
                if (response.data.code === 0) {
                    const { title, owner, cid } = response.data.data;
                    console.log("视频标题：", title);
                    console.log("UP主：", owner.name);
                    console.log("cid：", cid);

                    const res = await axios.get(`https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&fnval=16&fourk=1`, {
                        headers: {
                            "Cookie": fs.readFileSync("./config/cookie.txt", "utf-8").toString()
                        }
                    });

                    r1.question(`${JSON.stringify(supportFormat(res.data.data.support_formats, isVip))}：`, function (quality) {

                        queue.enqueue(downloadFile, res.data.data.dash.audio[0].baseUrl, "./data/cache/audio.m4s", "音频");
                        for (let i = 0; i < res.data.data.dash.video.length; i++) {
                            let item = res.data.data.dash.video[i];
                            if (item.id === parseInt(quality)) {
                                queue.enqueue(downloadFile, item.baseUrl, "./data/cache/video.m4s", "视频");
                                break;
                            }
                        }
                        queue.enqueue(mergeVideo, title);
                        queue.enqueue(deleteCache);
                        queue.enqueue(showVideo);
                        r1.close();
                        return resolve();
                    });
                }
            }
        });
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
                    process.stdout.write('\n');
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
function mergeVideo(title) {
    return new Promise((resolve, reject) => {
        const savePath = fs.readFileSync("./config/savePath.txt", "utf-8");
        const command = ffmpeg()
            .input('./data/cache/video.m4s')
            .input('./data/cache/audio.m4s')
            .output(`${savePath}${title}.mp4`)
            .audioCodec('copy') // 复制音频流
            .videoCodec('copy') // 复制视频流
            .on('start', (commandLine) => {
                console.log('Spawned FFmpeg with command: ' + commandLine);
            })
            .on('progress', (progress) => {
                console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
            })
            .on('end', () => {
                console.log('Processing finished !');
                console.log(`file with `);
                return resolve();
            })
            .on('error', (err) => {
                console.log('An error occurred: ' + err.message);
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

export { showVideo }