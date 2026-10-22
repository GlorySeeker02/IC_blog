# IC 设计笔记

一个面向集成电路设计知识分享的 Hugo 博客骨架：公式、Mermaid 图表、Manim 短片、可缩放图片查看器，以及四类固定写作模板。

## 技术栈

| 层 | 选择 |
|---|---|
| 静态站点 | Hugo extended（≥ 0.158） |
| 主题 | [PaperMod](https://github.com/adityatelange/hugo-PaperMod)（已随仓库提交） |
| 公式 | KaTeX + Goldmark passthrough（按页开启） |
| 图表 | Mermaid（跟随明暗主题重绘） |
| 视频 | `video` 短代码（WebM / MP4） |
| 图片 | 自写查看器：滚轮缩放 / 拖动 / 双指缩放 / 组图切换 |
| 部署 | Cloudflare Pages（`git push` 自动构建） |

## 本地预览

需要 Hugo extended ≥ 0.158（主题声明的最低版本）：

```bash
hugo version          # 输出里应包含 +extended
hugo server -D        # http://localhost:1313
```

本仓库的 `.tools/` 下有一个 Windows 便携版（已被 `.gitignore` 排除）。**在这个项目里推荐用包装脚本启动**：

```powershell
.\serve.cmd              # http://localhost:1313
.\serve.cmd --port 1414 -D
```

`serve.cmd` 会把 `HUGO_CACHEDIR` 和 `TEMP` 指到项目内的 `.cache/`，避免受限账户或沙箱环境写系统临时目录被拒（报 `mkdir ...\hugo_cache: Access is denied`）。

如果不想用脚本，手动指定缓存目录也可以：

```powershell
$env:HUGO_CACHEDIR = "$PWD\.cache\hugo"
.\.tools\hugo\hugo.exe server
```

## 写文章

四类模板对应四个栏目：

```bash
hugo new content logs/calibre-drc-2026.md --kind log
hugo new content cheatsheets/spectre-noise.md --kind cheatsheet
hugo new content notes/paper-xxx.md --kind note
hugo new content essays/adc-review.md --kind essay
```

生成的文件自带骨架和 front matter。两个开关按需打开：

```yaml
math: true      # 本页有 $...$ / $$...$$ 公式
mermaid: true   # 本页有 ```mermaid 代码块
```

`mermaid: true` 只是给作者看的标记，真正的加载开关由渲染钩子自动设置。

### 公式

```markdown
行内：$V_{th}$，或 \(V_{th}\)

块级：
$$
\mathrm{SNR_{dB}} = 6.02N + 1.76
$$
```

### 图表

````markdown
```mermaid
flowchart LR
  A[输入] --> B[处理] --> C[输出]
```
````

也可以写 `{{< mermaid >}} ... {{< /mermaid >}}`。明暗主题切换时会自动重绘。

### 视频

把文件放到 `static/videos/`，然后：

```markdown
{{< video src="/videos/adc-sampling.webm" caption="采样保持的电荷转移过程" >}}
```

可选参数：`poster`、`autoplay="false"`、`loop="false"`、`controls="false"`。

Manim 透明背景必须输出 WebM：

```bash
manim -t --format=webm -qh scene.py YourScene
```

### 图片

正文里的图片自动启用查看器（点击打开，滚轮缩放，拖动，`Esc` 关闭）。不需要查看器的图加 `data-nozoom`：

```html
<img src="/images/icon.svg" data-nozoom alt="">
```

### 在代码块里展示短代码

Hugo 会在 Markdown 之前解析短代码，代码块保护不了它。要展示字面量，用转义写法：

```text
{{</* video src="/videos/demo.webm" */>}}
```

### 环境信息框

```markdown
{{< env tool="Spectre" version="23.1" os="Rocky Linux 9" pdk="TSMC 28HPC+" >}}
```

## 目录结构

```text
archetypes/            四类文章骨架
assets/css/extended/   自定义样式（主题自动合并）
assets/js/             图片查看器
content/
  logs/ cheatsheets/ notes/ essays/
  about.md search.md archives.md
layouts/
  _markup/             ```mermaid 代码块钩子
  _partials/           KaTeX / Mermaid / 页脚扩展
  _shortcodes/         video / mermaid / env
static/videos/         Manim 产物
themes/PaperMod/       主题（随仓库提交）
hugo.yaml
```

## 部署

见 [deploy/cloudflare-pages.md](deploy/cloudflare-pages.md)。最短路径：

1. 推到 GitHub。
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git。
3. Build command `hugo --minify`，输出目录 `public`，环境变量 `HUGO_VERSION=0.168.0`。
4. 绑定自定义域名。

## 上线前改这几处

- `hugo.yaml`：`baseURL`、`title`、`description`、`params.author`、`socialIcons`
- `content/about.md`：自我介绍和联系方式
- `content/search.md`、`content/archives.md`：一般不用动
- 如果换项目名：`deploy/wrangler.jsonc` 里的 `name` 必须与 Cloudflare 项目名一致

## 常见问题

### `hugo server` 报 `mkdir C:\Users\<you>\AppData\Local\Temp\hugo_cache: Access is denied`

Hugo 默认把缓存放在系统临时目录。受限账户、公司电脑或沙箱只允许写工作区时，创建这个目录会被拒。

用 `.\serve.cmd`，或手动指定缓存：

```powershell
$env:HUGO_CACHEDIR = "$PWD\.cache\hugo"
.\.tools\hugo\hugo.exe server
```

注意：在 `hugo.yaml` 里写相对路径的 `cacheDir` 不行，Hugo 会报 `must resolve to an absolute directory`；环境变量或绝对路径才可以。

### `无法加载文件 serve.ps1，因为在此系统上禁止运行脚本`

直接用 `serve.cmd`（它已经带了 `-ExecutionPolicy Bypass`），或：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

## 已知取舍

- 站内搜索是前端 Fuse.js，文章上千篇后会变慢，届时可换 Pagefind。
- 评论系统未接入，需要时在 `hugo.yaml` 里配 `comments` 并加对应 partial。
- 主题是拷贝进来的，升级需要手动替换 `themes/PaperMod`。
- 国内访问依赖 Cloudflare 线路；要更稳就备案后接 EdgeOne Pages 或国内 CDN。

## 许可

文章内容版权归作者所有；主题遵循 PaperMod 的 MIT 许可。
