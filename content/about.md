---
title: "关于"
description: "这个博客写什么、为什么写、怎么写的。"
hidemeta: true
ShowToc: false
ShowBreadCrumbs: false
ShowReadingTime: false
ShowWordCount: false
---

做集成电路设计，日常和 Spectre、Calibre、Virtuoso 打交道。

这个博客不写「XX 从入门到精通」，只存三类东西：

- **踩坑记录**：报错原文 + 排查过程，别人搜得到，自己也回看得懂。
- **速查卡**：命令、参数、选项，写一次省下以后每次翻手册。
- **笔记与复盘**：论文、书、做完的模块，记下「和我的工作有什么关系」。

## 怎么写的

- 引擎：[Hugo](https://gohugo.io/)（extended 版）
- 主题：[PaperMod](https://github.com/adityatelange/hugo-PaperMod)
- 公式：KaTeX（按页开启）
- 图表：Mermaid（跟随明暗主题重绘）
- 视频：`video` 短代码，Manim 渲染的 WebM/MP4 直接循环播放
- 图片：自写的查看器，支持滚轮缩放 / 拖动 / 双指缩放
- 部署：Cloudflare Pages（`git push` 自动构建）

写作模板通过 `archetypes/` 固定成命令，`hugo new content logs/xxx.md --kind log` 会直接生成骨架。

## 联系

- GitHub：<https://github.com/>
- RSS：<index.xml>
