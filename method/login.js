import axios from "axios";
import qrcode from "qrcode-terminal";
import fs from "fs";

let qrcode_key = "";
let timer;

async function getQRCode() {
    return new Promise(async (resolve, reject) => {
        const response = await axios.get('https://passport.bilibili.com/x/passport-login/web/qrcode/generate');
        if (response.status === 200) {
            if (response.data.code === 0) {
                qrcode.generate(response.data.data.url);
                qrcode_key = response.data.data.qrcode_key;
                console.log('二维码已生成，请使用Bilibili客户端扫码登录');
                await checkLogin();
                return resolve();
            } else {
                console.log('获取二维码失败');
                return reject();
            }
        }
    });

}

async function checkLogin() {
    return new Promise(async (resolve, reject) => {
        async function _checkLogin() {
            const response = await axios.get('https://passport.bilibili.com/x/passport-login/web/qrcode/poll', {
                params: {
                    qrcode_key: qrcode_key
                }
            });
            if (response.status === 200) {
                if (response.data.code === 0) {
                    if (response.data.data.code === 0) {
                        console.log(response.headers['set-cookie']);
                        const cookie = response.headers['set-cookie'][0].split(';')[0];
                        fs.writeFileSync('./config/cookie.txt', cookie);
                        console.log('登录成功');
                        clearInterval(timer);
                        resolve();
                    } else if (response.data.data.code === 86038) {
                        getQRCode();
                        clearInterval(timer);
                        reject();
                    }
                }
            }
        }
        timer = setInterval(_checkLogin, 2000);
        
    });
    
}

export { getQRCode };