# 制冷装置操作顺序练习软件：手机版 / PWA 版

这是一个纯前端手机网页项目，用于训练：

- 制冷装置开机操作顺序
- 制冷装置停机操作顺序

特点：

- 不需要数据库
- 不需要后端服务器
- 不需要学生安装 Python
- 手机浏览器可直接使用
- 可发布到 GitHub Pages
- 支持 PWA 添加到手机主屏幕
- 支持离线缓存
- 点击选项区文字后，自动填入下方对应的第 N 步

## 文件结构

```text
mobile_web/
├─ index.html              页面入口
├─ style.css               手机端样式
├─ app.js                  练习逻辑
├─ steps.json              步骤数据
├─ manifest.webmanifest    PWA 安装配置
├─ sw.js                   离线缓存脚本
├─ .nojekyll               GitHub Pages 静态发布辅助文件
└─ icons/
   ├─ icon-192.png
   └─ icon-512.png
```

## 本地运行

进入项目目录：

```bash
cd mobile_web
```

启动本地服务：

```bash
python -m http.server 8000
```

电脑浏览器打开：

```text
http://localhost:8000
```

手机测试：

1. 电脑和手机连接同一个 Wi-Fi。
2. 查看电脑局域网 IP，例如 `192.168.1.23`。
3. 手机浏览器打开：

```text
http://192.168.1.23:8000
```

## 发布到 GitHub Pages

推荐把这些文件放到 GitHub 仓库根目录：

```text
index.html
style.css
app.js
steps.json
manifest.webmanifest
sw.js
.nojekyll
icons/
```

然后进入仓库：

```text
Settings → Pages
```

设置：

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

保存后等待 GitHub Pages 部署完成。

最终网址类似：

```text
https://你的用户名.github.io/仓库名/
```

把这个网址生成二维码，学生扫码即可使用。

## 学生添加到手机桌面

### Android / Chrome

```text
浏览器右上角菜单 → 添加到主屏幕 / 安装应用
```

### iPhone / Safari

```text
分享按钮 → 添加到主屏幕
```

## 修改题目

只需要修改 `steps.json`。

如果发布后学生手机仍显示旧内容，请同时修改 `sw.js` 中的缓存版本号：

```js
const CACHE_NAME = "refrigeration-trainer-mobile-v3";
```

例如下一次更新改成 `v3`、`v4`。

## 功能清单

- 首页显示“开机练习”“停机练习”
- 每次进入练习随机打乱 8 个步骤
- 选项显示为 A-H
- 作答区显示第 1 步到第 8 步
- 用户使用下拉框选择 A-H
- 点击选项区文字后，自动填入该选项真实对应的第 N 步
- 动态计算本轮正确答案
- 不把正确答案写死成固定 A-H 字符串
- 未填满时提示“请完成所有步骤后再确认”
- 重复选择时提示“不能重复选择同一个选项”
- 正确时提示“回答正确”
- 错误时显示用户答案、正确答案、错误位置
- 清空按钮可清除所有选择
- 重新开始会重新随机排序
- 返回主界面正常工作
- 手机端自适应布局
- 支持 PWA 离线缓存

## 注意

直接双击 `index.html` 也能看到页面，并且 `app.js` 内置了备用步骤数据；但为了测试 `steps.json`、PWA 和离线缓存，请使用 `python -m http.server 8000` 或部署到 HTTPS 网站。
