import argparse
import os
import re
import subprocess

import requests

bvReg = r"(BV|bv|Bv|bV).{10}"
avReg = r"(av|AV|Av|aV)\d+"
epReg = r"(ep|EP|Ep|eP)\d+"  # 暂未支持

""" qn 清晰度标识
    6   240P 极速 仅 MP4 格式支持 仅platform=html5时有效
    16  360P 流畅	
    32  480P 清晰	
    64  720P 高清 WEB 端默认值 B站前端需要登录才能选择，但是直接发送请求可以不登录就拿到 720P 的取流地址 无 720P 时则为 720P60
    74  720P60 高帧率  登录认证
    80  1080P 高清    TV 端与 APP 端默认值 登录认证
    112 1080P+ 高码率  大会员认证
    116 1080P60 高帧率 大会员认证
    120 4K 超清   需要fnval&128=128且fourk=1 大会员认证
    125 HDR 真彩色 仅支持 DASH 格式 需要fnval&64=64 大会员认证
    126 杜比视界    仅支持 DASH 格式 需要fnval&512=512 大会员认证
    127 8K 超高清  仅支持 DASH 格式 需要fnval&1024=1024 大会员认证
"""


def main():
    # 使用 argparse 解析命令行参数
    parser = argparse.ArgumentParser(description="批量下载文件")
    parser.add_argument("-file", type=str, help="包含视频链接的文件路径")
    args = parser.parse_args()
    if args.file is not None:
        urls = read_urls_from_file(args.file)
        for url in urls:
            download_and_process_video(url)
    else:
        download_and_process_video()


def download_and_process_video(text=None):  # 下载视频并处理
    video_id = get_video_id(text)
    video_info = get_video_info(video_id)
    video_episodes = get_video_episodes(int(video_info["data"]["videos"]))
    for i in video_episodes:
        video = video_info["data"]["pages"][i - 1]
        cid = video["cid"]
        video_stream = get_video_stream(cid, video_id)
        if video_stream["code"] == 0:
            cid_path = f"./videos/cache/{cid}/"
            video_save_path = f"./videos/cache/{cid}/video.m4s"
            audio_save_path = f"./videos/cache/{cid}/audio.m4s"
            output_path = f"./videos/{video["page"]}_{video["part"]}.mp4"
            os.makedirs(cid_path, exist_ok=True)
            download_file(video_stream["video_base_url"], video_save_path, "视频")
            download_file(video_stream["audio_base_url"], audio_save_path, "音频")
            merge_video_audio(video_save_path, audio_save_path, output_path)
            delete_video_cache(video_save_path, audio_save_path, cid_path)


def read_urls_from_file(file_path):  # 从文件中逐行读取url
    with open(file_path, 'r') as file:
        urls = file.readlines()
    return [url.strip() for url in urls]


def get_video_id(text=None):  # 获取av|bv号
    if text is None:
        data = input("请输入BV号：")
    else:
        print(f"请输入BV号：{text}")
        data = text
    avid = ""
    bvid = ""
    result_bv = re.search(bvReg, data)
    result_av = re.search(avReg, data)
    if result_bv:
        bvid = result_bv.group()
    elif result_av:
        avid = result_av.group()[2:]  # 截取掉av号
    else:
        print("输入错误")
    return {
        "avid": avid,
        "bvid": bvid
    }


def get_video_info(video_id):  # 获取视频基本信息
    url = f"https://api.bilibili.com/x/web-interface/view?aid={video_id["avid"]}&bvid={video_id["bvid"]}"
    res = session.get(url).json()

    """ code的值
        0：成功
        -400：请求错误
        -403：权限不足
        -404：无视频
        62002：稿件不可见
        62004：稿件审核中
        62012：仅UP主自己可见
    """
    if res["code"] == 0:
        keys = ["title", "videos", "desc", "owner", "pages"]
        # 从请求结果中取出指定键值对
        data = {key: res["data"][key] for key in keys if key in res["data"]}
        return {
            "code": "0",
            "message": "成功",
            "data": data
        }
    else:
        return {
            "code": res["code"],
            "message": res["message"],
            "data": {}
        }


def get_video_stream(cid, video_id):  # 获取视频流地址
    url = f"https://api.bilibili.com/x/player/playurl?cid={cid}&bvid={video_id["bvid"]}&avid={video_id["avid"]}&fnval=16&fourk=1"
    res = session.get(url).json()
    if res["code"] == 0:
        video_base_url = res["data"]["dash"]["video"][0]["baseUrl"]
        audio_base_url = res["data"]["dash"]["audio"][0]["baseUrl"]
        return {
            "code": 0,
            "video_base_url": video_base_url,
            "audio_base_url": audio_base_url
        }
    else:
        return {"code": -1}


def get_video_episodes(total=0):  # 获取分批下载集数
    data = input(f"请输入下载的集数(1-{total})：")
    data = data.replace(" ", "").replace("，", ",").strip(",")  # 去除空格 前后逗号
    if len(data) == 0:
        result = list(range(1, total + 1))
    else:
        res = data.split(",")
        result = []
        for item in res:
            if '-' in item:
                # 如果是一个范围时 展开
                start, end = map(int, item.split('-'))
                result.extend(range(start, end + 1))
            else:
                result.append(int(item))

    return list(dict.fromkeys(result))  # 去重 (Py3.7以上支持)


def download_file(url, save_path="./temp", message=""):
    # 获取文件总大小
    response = session.head(url)
    if 'Content-Length' not in response.headers:
        print("无法获取文件大小，不支持断点续传")
        return
    total_size = int(response.headers['Content-Length'])
    print(f"正在下载 {message} 文件总大小：{bytes_to_mb(total_size):.2f} MB")

    # 检查已下载的部分
    if os.path.exists(save_path):
        downloaded_size = os.path.getsize(save_path)
        # print(f"已下载 {bytes_to_mb(downloaded_size):.2f} / {bytes_to_mb(total_size):.2f} MB，继续下载...")
    else:
        downloaded_size = 0

    # 设置Range头部，从已下载的部分开始下载
    headers = {'Range': f'bytes={downloaded_size}-'}
    response = session.get(url, headers=headers, stream=True)

    # 打开文件并追加内容
    with open(save_path, 'ab') as file:
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                file.write(chunk)
                downloaded_size += len(chunk)
                print(f"已下载 {bytes_to_mb(downloaded_size):.2f} / {bytes_to_mb(total_size):.2f} MB", end='\r')
    return save_path


def merge_video_audio(video_path, audio_path, output_path):  # 合并视频音频
    command = [
        "ffmpeg",
        "-i", video_path,
        "-i", audio_path,
        "-c", "copy",
        "-loglevel", "quiet",
        output_path
    ]
    print("\n合并中...", end="\r")
    subprocess.run(command, check=True)
    print("合并完成！")


def delete_video_cache(video_path, audio_path, cid_path):  # 删除合并前的缓存
    os.remove(video_path)
    os.remove(audio_path)
    os.rmdir(cid_path)


def bytes_to_mb(bytes_value):  # 将字节转换为MB
    mb_value = bytes_value / (1024 * 1024)  # 1 MB = 1024 * 1024 Bytes
    return mb_value


if __name__ == '__main__':
    session = requests.Session()
    if os.path.exists("config/cookie.txt"):  # 存在cookie文件的话，就添加进requests
        with open("config/cookie.txt", "r", encoding="utf-8") as file:
            ck = {
                "SESSDATA": file.read()
            }
            session.cookies.update(ck)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        "Referer": "https://www.bilibili.com"
    }
    session.headers.update(headers)

    main()
