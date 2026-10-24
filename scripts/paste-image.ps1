# 把截图保存到 static/attachments/<slug>/ 并生成 Markdown 链接。
#
# 用法：
#   .\scripts\paste-image.cmd -Slug noise-figure
#   .\scripts\paste-image.cmd -Slug noise-figure -File D:\pics\shot.png
#   .\scripts\paste-image.cmd -Slug noise-figure -Alt "噪声系数曲线"
#
# 不带 -File 时从剪贴板取图，适合 Win+Shift+S 截图后直接运行。

[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Slug,
    [string]$File = "",
    [string]$Name = "",
    [string]$Alt = "截图"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

if ($Slug -notmatch '^[a-z0-9][a-z0-9-]*$') {
    throw "-Slug 只能使用小写字母、数字和连字符，例如 noise-figure"
}
if ($Name -and $Name -notmatch '^[A-Za-z0-9._-]+$') {
    throw "-Name 只能使用字母、数字、点、下划线和连字符"
}

$dir = Join-Path $root "static\attachments\$Slug"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

if ($File) {
    if (-not (Test-Path -LiteralPath $File)) { throw "找不到文件：$File" }
    $src = (Resolve-Path -LiteralPath $File).Path
    $ext = [System.IO.Path]::GetExtension($src).ToLower()
    if (@('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg') -notcontains $ext) {
        throw "不支持的图片格式：$ext"
    }
    $base = if ($Name) { $Name } else { [System.IO.Path]::GetFileNameWithoutExtension($src) }
    $fileName = "$base$ext"
    $dest = Join-Path $dir $fileName
    if (Test-Path -LiteralPath $dest) {
        $fileName = "$base-$(Get-Date -Format 'HHmmss')$ext"
        $dest = Join-Path $dir $fileName
    }
    Copy-Item -LiteralPath $src -Destination $dest
} else {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $img = [System.Windows.Forms.Clipboard]::GetImage()
    if ($null -eq $img) {
        throw "剪贴板里没有图片。先按 Win+Shift+S 截图，再运行；或者用 -File 指定图片路径。"
    }
    $fileName = if ($Name) { "$Name.png" } else { "shot-$(Get-Date -Format 'yyyyMMdd-HHmmss').png" }
    $dest = Join-Path $dir $fileName
    $img.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
}

$url = "/attachments/$Slug/$fileName"
$markdown = "![$Alt]($url)"

$copied = $false
try {
    Set-Clipboard -Value $markdown
    $copied = $true
} catch {
    $copied = $false
}

Write-Host ""
Write-Host "已保存：static/attachments/$Slug/$fileName"
Write-Host "Markdown：$markdown"
if ($copied) {
    Write-Host "（链接已复制到剪贴板，编辑器里 Ctrl+V 插入）"
} else {
    Write-Host "（复制到剪贴板失败，手动复制上面的 Markdown）"
}
