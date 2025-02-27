import os
import time

import requests
from qrcode_terminal import draw

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
}


def login(timeout=30):
    url = "https://passport.bilibili.com/x/passport-login/web/qrcode/generate"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        qr_url = res.json()["data"]["url"]
        qr_key = res.json()["data"]["qrcode_key"]
        draw(qr_url)
        start_time = time.time()
        while time.time() - start_time < timeout:
            time.sleep(3)
            ck = check(qr_key)
            if ck == 1:
                print("登录成功")
                break
            elif ck == 0:
                print("二维码失效")
                break
    else:
        print("网络错误")
    return


def check(qr_key):
    url = f"https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key={qr_key}"
    res = requests.get(url, headers=headers)
    code = res.json()["data"]["code"]
    if code == 0:  # 扫码登录成功
        ck_dict = requests.utils.dict_from_cookiejar(res.cookies)
        os.makedirs("./config/", exist_ok=True)
        with open("./config/cookie.txt", "w", encoding="utf-8") as file:
            file.write(ck_dict["SESSDATA"])
        return 1
    elif code == 86038:  # 二维码失效
        return 0
    else:  # 其他情况
        return -1


if __name__ == '__main__':
    login()
