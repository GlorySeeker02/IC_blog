---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
slug: "{{ .File.ContentBaseName }}"
summary: ""
tags: []
# 所属专题，可多个：["noise", "signals"]。专题名就是 content/topics/ 下的目录名
topics: []
# 所属系列（可选）：["noise-fundamentals"]，相同系列的笔记会按 series_weight 串成连载
series: []
series_weight: 10
math: false
mermaid: false
---

## 一句话结论

<!-- 先给结论，再给推导。读者时间有限。 -->

## 背景

<!-- 这个问题从哪来、为什么值得单独记一篇。 -->

## 主要内容

<!-- 概念、公式、推导、代码，按逻辑顺序写。公式多就把上面的 math 改成 true。 -->

## 适用范围与坑

<!-- 什么条件下成立，什么情况下会失效，和哪些结论容易混。 -->

## 参考
