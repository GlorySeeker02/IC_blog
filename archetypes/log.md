---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
slug: "{{ .File.ContentBaseName }}"
summary: ""
tags: []
# 文章里出现 $...$ / $$...$$ 公式时改为 true
math: false
# 文章里出现 ```mermaid 代码块时改为 true（渲染钩子会自动识别，此项仅作标记）
mermaid: false
---

## 现象

<!-- 报错原文直接粘进来，不要改写。搜索流量主要来自这里。 -->

```text

```

## 环境

<!-- 可选：取消下面一行的注释，生成环境信息框（把值改成你的）
{{</* env tool="Spectre" version="23.1" os="Rocky Linux 9" pdk="TSMC 28HPC+" */>}}
-->

- 工具 / 版本：
- 工艺库 / PDK：
- 操作系统：

## 排查过程

<!-- 试了 A 不行，试了 B 发现是 C。按时间顺序写，不用润色。 -->

1.
2.

## 根因

<!-- 一句话说清。 -->

## 解决

<!-- 可直接复制的命令或操作步骤。 -->

```bash

```

## 教训

<!-- 可选：一句话，写给三个月后的自己。 -->
