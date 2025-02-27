# B站视频下载工具

一个用于下载 B站视频的开源项目，通过不同的分支提供 Node.js 和 Python 两种语言的实现。用户可以根据自己的需求选择合适的语言版本。

## 项目结构

本项目通过以下分支实现不同语言的代码：

- **`main`**: 项目主分支，包含通用文档和资源。
- **`node`**: 存储基于 Node.js 的代码实现。
- **`python`**: 存储基于 Python 的代码实现。

## 功能

- 下载 B站视频（支持高清、标清等多种清晰度）。
- 自动解析视频链接。
- 支持批量下载。
- 简单易用的命令行界面。

## 先决条件

在使用本项目之前，请确保你的系统中已安装以下工具：

### 安装 FFmpeg

本项目需要 `ffmpeg` 来处理视频文件。请确保在你的系统中安装了 `ffmpeg`，并将其添加到环境变量中。

#### 安装方法

1. **Windows 用户**：
   - 下载 [FFmpeg Windows 版本](https://ffmpeg.org/download.html)。
   - 解压下载的文件到一个目录（如 `C:\ffmpeg`）。
   - 将 `C:\ffmpeg\bin` 添加到系统的环境变量 `PATH` 中。
   - 打开命令提示符，运行以下命令以验证安装：
     ```bash
     ffmpeg -version
     ```

2. **macOS 用户**：
   - 使用 Homebrew 安装 FFmpeg：
     ```bash
     brew install ffmpeg
     ```
   - 验证安装：
     ```bash
     ffmpeg -version
     ```

3. **Linux 用户**：
   - 使用包管理器安装 FFmpeg：
     ```bash
     sudo apt install ffmpeg  # Ubuntu/Debian
     sudo yum install ffmpeg  # CentOS
     sudo pacman -S ffmpeg    # Arch Linux
     ```
   - 验证安装：
     ```bash
     ffmpeg -version
     ```

## 使用方法

### 1. Node.js 版本

#### 切换到 `node` 分支

```bash
git clone https://github.com/EchoZenith/BiliBili-DL.git
cd BiliBili-DL/
git checkout node
```

#### 安装依赖

```bash
npm install
```

#### 运行

```bash
npm run start
```

### 2. Python 版本

#### 切换到 `python` 分支

```bash
git clone https://github.com/EchoZenith/BiliBili-DL.git
cd BiliBili-DL/
git checkout python
```

#### 安装依赖

```bash
pip install -r requirements.txt
```

#### 运行

```bash
python main.py
```

## 支持的平台

- Windows
- macOS
- Linux

## 注意事项

- **合法使用**：本工具仅供学习和研究目的使用。请遵守 B站 的使用条款，不要用于非法用途。
- **视频链接格式**：请确保输入的视频链接是有效的 B站 视频页面链接。
- **依赖更新**：请定期更新项目依赖，以确保工具的正常运行。

## 贡献代码

欢迎贡献代码！如果你有任何改进或新功能的想法，请随时提交 Pull Request 或 Issue。

1. 叉取（Fork）本项目。
2. 创建一个新的分支：`git checkout -b feature/your-feature-name`。
3. 提交你的更改：`git commit -m "Add some feature"`。
4. 推送到你的分支：`git push origin feature/your-feature-name`。
5. 提交 Pull Request。

## 许可证

本项目采用 [GUN GPL](LICENSE) 许可证。
