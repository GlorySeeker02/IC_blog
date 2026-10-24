---
title: "{{ (path.Base .File.Dir) | replaceRE "-" " " | title }}"
description: ""
weight: 50
---

<!-- 专题简介：覆盖什么、不覆盖什么。会显示在专题页标题下方。 -->

收录与……相关的笔记。笔记里写 `topics: ["{{ path.Base .File.Dir }}"]` 就会出现在这里；同一篇笔记可以同时挂到多个专题。

<!-- 新建专题后，需要至少一篇笔记写上了这个 topics，专题页里的笔记列表才会有内容；/topics/ 入口仍然会显示。 -->
