# 部署到 Cloudflare Pages

本文对应两种部署形态。**优先用经典 Pages 的 Git 集成**，最省心；只有项目已经并入 Workers 体系时，才需要 `wrangler.jsonc`。

## 一、经典 Pages（推荐）

### 1. 推送仓库

```bash
git add .
git commit -m "init blog"
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

### 2. 连接仓库

Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**，选择仓库和分支。

### 3. 构建参数

| 项 | 值 |
|---|---|
| Framework preset | Hugo |
| Build command | `hugo --minify` |
| Build output directory | `public` |
| 环境变量 | `HUGO_VERSION = 0.168.0` |
| 环境变量 | `HUGO_ENV = production` |

`HUGO_VERSION` 必须和本地一致，否则可能出现「本地正常、云端模板报错」——Hugo 的模板查找规则在小版本之间也会变。

### 4. 自定义域名

Pages 项目 → **Custom domains** → 添加域名，按提示在 DNS 里加 CNAME。Cloudflare 会自动签发证书。

## 二、Workers 静态资源（新体系）

如果创建的是 Worker 而不是 Pages，构建产物目录要在仓库根目录的 `wrangler.jsonc` 里声明：

```jsonc
{
  "name": "ic-blog",
  "compatibility_date": "2026-10-01",
  "assets": {
    "directory": "./public",
    "not_found_handling": "404-page"
  }
}
```

示例文件在 `deploy/wrangler.jsonc`，复制到仓库根目录再改 `name`。

注意事项：

- `name` **必须与 Cloudflare 项目名完全一致**（小写、连字符），否则部署会创建新项目或直接报错。
- 构建命令仍然是 `hugo --minify`；`assets.directory` 指向 `./public`。
- 每次部署：`npx wrangler deploy`，或接 Git 集成自动跑。

## 三、主题是 submodule 时

本仓库把主题文件直接提交了，无需额外设置。如果你改回 submodule，必须让构建环境拉取子模块：

- Pages 设置里没有单独的“submodule”开关时，在构建命令前加一步：
  `git submodule update --init --recursive && hugo --minify`
- 或者干脆把 `themes/PaperMod` 一起提交，省掉这类环境差异。

## 四、国内访问：EdgeOne Pages

Cloudflare 的国内线路并不稳定。如果读者主要在国内：

1. 完成域名 ICP 备案（约 3–6 周）。
2. 腾讯云 EdgeOne Pages 关联**同一仓库**，构建命令与输出目录完全一致。
3. 绑定已备案域名，选择中国大陆可用区。
4. 证书由 EdgeOne 自动管理。

代码不需要改，`baseURL` 换成最终域名即可。也可以做双栈：国内 DNS 解析到 EdgeOne，海外解析到 Cloudflare Pages。

## 五、回滚

- Pages：Deployments 里选上一个成功构建 → **Rollback**。
- Workers：`npx wrangler deployments list` / `npx wrangler rollback`。
- 内容层回滚永远靠 Git：`git revert` 后重新 push。

## 六、常见构建失败

| 报错 | 原因 | 处理 |
|---|---|---|
| `module "PaperMod" not found` | 主题是 submodule，未拉取 | 见第三节 |
| `found no layout file` | 主题目录为空 / 主题名与 `theme:` 不一致 | 检查 `themes/PaperMod/theme.toml` |
| `TOCSS: failed to transform` | 用了非 extended 版 Hugo | `HUGO_VERSION` 对应的构建镜像需为 extended；或去掉 SCSS 依赖 |
| 页面 404 但构建成功 | 输出目录填错 | 必须是 `public` |
| 样式是旧的 | CDN/浏览器缓存 | 强制刷新；Hugo 的指纹文件名会随内容变化 |
