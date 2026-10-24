# IC 设计笔记

一个面向集成电路设计知识分享的 Hugo 博客骨架：公式、Mermaid 图表、Manim 短片、可缩放图片查看器，以及四类文章模板和笔记专题模板。

## 技术栈

| 层 | 选择 |
|---|---|
| 静态站点 | Hugo extended（≥ 0.158） |
| 主题 | [PaperMod](https://github.com/adityatelange/hugo-PaperMod)（已随仓库提交） |
| 公式 | KaTeX + Goldmark passthrough（按页开启） |
| 图表 | Mermaid（跟随明暗主题重绘） |
| 视频 | `video` 短代码（WebM / MP4） |
| 图片 | 自写查看器：滚轮缩放 / 拖动 / 双指缩放 / 组图切换 |
| 笔记互链 | 自动反向链接：扫描正文站内链接，生成「本文引用 / 引用本文」 |
| 专题 | `topics` 分类法（多对多），专题页在 `/topics/<term>/` |
| 系列 | `series` 分类法（有序），基础理论拆多篇时用，系列页在 `/series/<term>/` |
| 部署 | Cloudflare Pages（`git push` 自动构建） |

## 本地预览

需要 Hugo extended ≥ 0.158（主题声明的最低版本）。`hugo` 没有全局安装时，项目根目录的 `hugo.cmd` 会代理到 `.tools/hugo/hugo.exe`：

```powershell
.\hugo version          # 输出里应包含 +extended
.\serve.cmd             # http://localhost:1313
.\serve.cmd --port 1414 -D
```

`.tools/` 下是 Windows 便携版（已被 `.gitignore` 排除）。如果已经全局安装 Hugo，把 `.\hugo` 换成 `hugo` 即可。

`serve.cmd` 会把 `HUGO_CACHEDIR` 和 `TEMP` 指到项目内的 `.cache/`，避免受限账户或沙箱环境写系统临时目录被拒（报 `mkdir ...\hugo_cache: Access is denied`）。

如果不想用脚本，手动指定缓存目录也可以：

```powershell
$env:HUGO_CACHEDIR = "$PWD\.cache\hugo"
.\.tools\hugo\hugo.exe server
```

## 写文章

四类模板对应四个栏目：

```powershell
.\hugo new content logs/calibre-drc-2026.md --kind log
.\hugo new content cheatsheets/spectre-noise.md --kind cheatsheet
.\hugo new content notes/paper-xxx.md --kind paper
.\hugo new content essays/adc-review.md --kind essay
```

### 专题

专题不是目录，是 `topics` 分类法：一篇笔记可以同时属于多个专题，改归属不用移动文件。

笔记平铺在 `content/notes/` 下，用 front matter 声明归属：

```yaml
topics: ["noise", "signals"]   # 挂几个都行
```

两个场景都支持：

- 只归一个专题：`topics: ["signals"]`，别的专题通过链接引用它，被引用处会出现「引用本文」。
- 同时归多个专题：`topics: ["signals", "noise"]`，它直接出现在两个专题的列表里，笔记仍然只有一份、一个 URL。

专题本身在 `content/topics/<term>/_index.md` 里定义标题和简介：

```powershell
.\hugo new content topics/emc/_index.md --kind topic
```

`--kind topic` 对应 `archetypes/topic.md`，只生成专题介绍页。标题默认取目录名（`emc` → `Emc`），生成后改成中文；`weight` 控制 `/topics/` 里的顺序（现有 10/20/30/40，新专题默认 50）。

现有专题：`noise`（噪声）、`signals`（信号与系统）、`algorithms`（算法）、`circuits`（电路原理）。

| 页面 | URL |
|---|---|
| 专题总览 | `/topics/` |
| 单个专题 | `/topics/noise/` |
| 笔记 | `/notes/<slug>/`，与挂几个专题无关 |

空专题也会出现在总览里，只是不显示笔记数；等第一篇笔记写上对应 `topics` 后，列表自动出现。

### 系列

专题是横向归类，系列是纵向顺序：一个专题要拆成多篇基础理论时，用 `series` 把它们串成连载。

```yaml
series: ["noise-fundamentals"]
series_weight: 2      # 系列内顺序，越小越靠前
```

系列本身在 `content/series/<term>/_index.md` 定义标题和简介：

```powershell
.\hugo new content series/noise-fundamentals/_index.md --kind series
```

- 系列页 `/series/noise-fundamentals/` 按 `series_weight` 列出全部篇目。
- 文章底部显示「系列《噪声基础》· 第 2/3 篇」、上一篇/下一篇和可折叠目录。
- 专题页会把该专题下的系列分组展示，组内按序号排；没有系列的文章归入「单篇」。
- 一篇笔记可以挂多个专题，所以同一个系列能出现在多个专题下，各自只显示与该专题相关的篇目。

基础理论文章用 `theory` 模板，默认开公式：

```powershell
.\hugo new content notes/noise-spectrum.md --kind theory
```

骨架：这一篇讲什么 → 定义与直觉 → 推导 → 结论与适用范围 → 常见误区 → 参考。

#### 三种排序字段

| 字段 | 写在哪 | 控制什么 |
|---|---|---|
| `weight` | `content/topics/<term>/_index.md` | `/topics/` 里专题的先后 |
| `weight` | `content/series/<term>/_index.md` | 专题页里各系列分组的先后 |
| `series_weight` | 笔记 front matter | 系列内文章的先后 |

作用域不同，互不冲突：两个 `weight` 是 Hugo 的页面权重，一个属于专题页、一个属于系列页；`series_weight` 是自定义字段，只被系列页和文章底部的系列导航读取。

`/series/` 总览目前按 term 字母排序，不受系列页 `weight` 影响。

### 新建系列文章（自动编号）

其实不需要提前知道第几篇：文章底部的「第 N/M 篇」是构建时按顺序算出来的。`series_weight` 只负责固定顺序。

`hugo new` 的模板读不到已有文章，所以取号放在脚本里。`new-note` 会扫描同系列文章的 `series_weight`，取最大值 +1，并写回 front matter：

```powershell
.\scripts\new-note.cmd -Name noise-measure -Series noise-fundamentals -Topics noise -Title "噪声测量"
```

输出会顺手列出系列当前篇目：

```text
系列「noise-fundamentals」现在共 3 篇：
    1. 概率统计基础  (noise-statistics.md)
    2. 频谱与功率谱  (noise-spectrum.md)
    3. 噪声系数  (noise-figure.md)

已创建：content/notes/noise-measure.md（第 4 篇）
地址：  /notes/noise-measure/
```

只查看编号、不创建：

```powershell
.\scripts\new-note.cmd -Series noise-fundamentals -List
```

参数：

| 参数 | 说明 |
|---|---|
| `-Name` | 文件名 / slug，小写字母、数字、连字符 |
| `-Series` | 必填，系列 term |
| `-Topics` | 逗号分隔，如 `noise,signals` |
| `-Title` | 中文标题；省略时用文件名 |
| `-Kind` | `theory`（默认）/ `topic-post` / `paper` / `book` |
| `-Weight` | 手动指定编号，覆盖自动取号（往中间插篇时用） |

生成的仍是草稿（`draft: true`），填完内容把 `draft` 改成 `false`。

写笔记的模板：

| 命令 | 用途 |
|---|---|
| `--kind theory` | 基础理论，默认开公式，配合 `series` 写成多篇 |
| `--kind topic-post` | 一般知识文章：结论、背景、内容、适用范围 |
| `--kind paper` | 论文笔记：`paper` 字段（authors、venue、doi） |
| `--kind book` | 读书笔记：`book` 字段 + 章节 + 页码，配合 `series` 分章 |

```powershell
.\hugo new content notes/noise-spectrum.md --kind theory
.\hugo new content notes/background-knowledge.md --kind topic-post
.\hugo new content notes/paper-xxx.md --kind paper
.\hugo new content notes/book-xxx-ch03.md --kind book
```

旧的四合一 `--kind note` 已拆成 `paper` 和 `book`。

### 读书笔记

一本书通常要记很多次，一章甚至半章一篇。用 `book` 模板，并把同一本书挂到同一个 `series`：

```powershell
.\hugo new content notes/design-ch03.md --kind book
```

```yaml
title: "信息建筑"
description: "原研哉关于信息与设计的讨论。"
book:
  title: "设计中的设计"
  authors: "原研哉"
  publisher: "山东人民出版社"
  edition: "第 1 版"
  year: 2006
chapter: "第 3 章"
chapter_title: "信息建筑"
pages: "56–78"
topics: ["design"]
series: ["book-design"]
series_weight: 3
```

- 正文开头的 `{{< bookinfo >}}` 会把上面这些字段渲染成书籍信息块，正文不用再抄一遍书名。
- `description` 只写一句摘要；书名、章节、页码交给 front matter 和信息块，避免标题下重复显示。
- `chapter` 和 `pages` 允许只覆盖一章的一部分，比如 `chapter: "第 3 章前半"`、`pages: "56–66"`。
- 同一本书的每一篇用相同的 `series`，`series_weight` 用笔记顺序；`/series/book-design/` 就是这本书的目录。
- 书名、作者只在 front matter 里写，改一次不影响其他章节。

论文笔记则用 `paper` 模板，字段是 `paper.title`、`paper.authors`、`paper.venue`、`paper.doi`，正文骨架是「论文信息 → 它解决什么问题 → 核心方法 → 结果与局限 → 我的疑问」。

生成的文件自带骨架和 front matter。两个开关按需打开：

```yaml
math: true      # 本页有 $...$ / $$...$$ 公式
mermaid: true   # 本页有 ```mermaid 代码块
```

`mermaid: true` 只是给作者看的标记，真正的加载开关由渲染钩子自动设置。

### 笔记互链

正文里用站内绝对路径链接另一篇笔记，页面底部会自动生成「本文引用」和「引用本文」：

```markdown
热噪声的谱密度是 $4kTR$，推导见 [热噪声](/notes/thermal-noise/)。
```

引用不限于同一个专题：信号与系统下的笔记链到噪声笔记，噪声笔记底部同样会出现「引用本文」。专题只负责归类，链接关系跨专题照样建立。

也可以用 Hugo 的 `ref` 短代码，路径写 content 下的文件路径，改文件位置时不用改链接：

```markdown
推导见 [热噪声]({{< ref "/notes/thermal-noise.md" >}})。
```

规则与限制：

- 只统计指向具体文章的链接；指向专题页、标签页、首页的不算。
- 草稿（`draft: true`）不参与统计。
- 判断依据是渲染后的 HTML，所以代码块里出现的站内链接也会被算进去，别把带站内地址的示例留在正文代码块里。
- 链接要带结尾斜杠（`/notes/thermal-noise/`），或者用 `ref` 让 Hugo 生成，否则匹配不上。
- 每次构建都会扫描全站正文，文章上千篇后会明显变慢，届时要换索引方案。

实现：`layouts/_partials/backlinks.html` 负责统计，`layouts/_partials/extend_post_content.html` 把它挂在正文之后，样式在 `assets/css/extended/backlinks.css`。

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

#### 图片放哪

按文章 slug 分目录，统一放 `static/attachments/`：

```text
static/attachments/noise-figure/
  shot-20261024-140000.png
```

引用时用绝对路径：

```markdown
![噪声系数随温度变化](/attachments/noise-figure/shot-20261024-140000.png)
```

构建时 `static/` 原样复制到 `public/`，图片地址就是 `/attachments/<slug>/<文件名>`。目录名要和 front matter 里的 `slug` 一致，删文章时整目录一起删。

#### 截图直接插入

`Win+Shift+S` 截图后，在项目根目录运行：

```powershell
.\scripts\paste-image.cmd -Slug noise-figure
```

脚本会：

1. 从剪贴板取图，存成 `static/attachments/noise-figure/shot-<时间戳>.png`；
2. 把 `![截图](/attachments/noise-figure/shot-....png)` 复制到剪贴板；
3. 回编辑器 `Ctrl+V` 即可。

| 参数 | 说明 |
|---|---|
| `-Slug` | 必填，文章 slug |
| `-File` | 不用剪贴板，直接导入已有图片 |
| `-Name` | 指定文件名，默认用原文件名或时间戳 |
| `-Alt` | 替换文字，默认「截图」 |

```powershell
# 导入已有图片
.\scripts\paste-image.cmd -Slug noise-figure -File D:\pics\curve.png -Alt "噪声系数曲线"
```

#### VS Code 里直接粘贴

装 [Paste Image](https://marketplace.visualstudio.com/items?itemName=mushan.vscode-paste-image) 插件，在 `.vscode/settings.json` 里加：

```json
{
  "pasteImage.path": "${projectRoot}/static/attachments/${currentFileNameWithoutExt}",
  "pasteImage.basePath": "${projectRoot}/static",
  "pasteImage.prefix": "/",
  "pasteImage.insertPattern": "![${imageFileNameWithoutExt}](${imageFilePath})"
}
```

截图后 `Ctrl+Alt+V`，图片落到同名目录，正文直接得到 `/attachments/...` 链接。文件名和 slug 不一致时用脚本更稳。

截图是 PNG，原图可能几百 KB 到几 MB；仓库里攒多了会拖慢构建，必要时先压成 WebP 再放进 `attachments/`。

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
archetypes/            文章 / 专题 / 系列模板
assets/css/extended/   自定义样式（主题自动合并）
assets/js/             图片查看器
content/
  logs/ cheatsheets/ essays/
  notes/               所有笔记，平铺；归属由 front matter 的 topics 决定
  topics/<term>/       专题定义（noise / signals / algorithms / circuits）
  series/<term>/       系列定义（如 noise-fundamentals）
  about.md search.md archives.md
layouts/
  _markup/             ```mermaid 代码块钩子
  _partials/           KaTeX / Mermaid / 页脚扩展
  _shortcodes/         video / mermaid / env
scripts/               创建系列文章、导入截图
static/videos/         Manim 产物
static/attachments/    文章截图，按 slug 分目录
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

### `hugo` 不是内部或外部命令 / 无法将“hugo”项识别为 cmdlet

Hugo 没进 `PATH`。项目根目录的 `hugo.cmd` 已经代理到 `.tools/hugo/hugo.exe`，在项目里用：

```powershell
.\hugo version
.\hugo new content logs/foo.md --kind log
```

想在任何目录直接用 `hugo`，把便携版目录加进用户 `PATH`（只影响当前用户，不需要管理员），然后重开终端：

```powershell
$dir = "$PWD\.tools\hugo"
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$dir*") {
    [Environment]::SetEnvironmentVariable('Path', "$userPath;$dir", 'User')
}
```

注意 `.tools/` 被 `.gitignore` 排除，换机器后需要重新放一份 Hugo，或改用 `winget install Hugo.Hugo.Extended`。

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
