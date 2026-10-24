# 创建一篇系列笔记，自动分配系列内不重复的编号（series_weight）。
#
# 用法：
#   .\scripts\new-note.cmd -Name noise-measure -Series noise-fundamentals -Topics noise -Title "噪声测量"
#   .\scripts\new-note.ps1 -Series noise-fundamentals -List
#
# 说明：Hugo 的 archetype 在创建时读不到已有文章，所以取号这一步放在脚本里。

[CmdletBinding()]
param(
    [string]$Name,
    [string]$Series,
    [string]$Topics = "",
    [string]$Title = "",
    [ValidateSet("theory", "topic-post", "note")]
    [string]$Kind = "theory",
    [int]$Weight = 0,
    [switch]$List
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$notesDir = Join-Path $root "content\notes"
$seriesIndex = Join-Path $root "content\series\$Series\_index.md"

function Get-FrontMatter {
    param([string]$Path)
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ($null -eq $raw) { return "" }
    $raw = $raw.TrimStart([char]0xFEFF)
    $m = [regex]::Match($raw, '(?s)^---\s*\r?\n(.*?)\r?\n---')
    if ($m.Success) { return $m.Groups[1].Value }
    return ""
}

function Get-SeriesMembers {
    param([string]$Term)
    $items = @()
    Get-ChildItem -LiteralPath $notesDir -Filter *.md -File -ErrorAction SilentlyContinue | ForEach-Object {
        $fm = Get-FrontMatter $_.FullName
        if (-not $fm) { return }

        $sm = [regex]::Match($fm, '(?m)^series:\s*\[(.*?)\]')
        if (-not $sm.Success) { return }
        $terms = $sm.Groups[1].Value -split ',' | ForEach-Object { $_.Trim().Trim('"').Trim("'") }
        if ($terms -notcontains $Term) { return }

        $w = 0
        $wm = [regex]::Match($fm, '(?m)^series_weight:\s*(\d+)')
        if ($wm.Success) { $w = [int]$wm.Groups[1].Value }

        $tm = [regex]::Match($fm, '(?m)^title:\s*"?(.*?)"?\s*$')
        $title = if ($tm.Success) { $tm.Groups[1].Value } else { $_.BaseName }

        $items += [pscustomobject]@{
            File   = $_.Name
            Title  = $title
            Weight = $w
            Slug   = $_.BaseName
        }
    }
    return @($items | Sort-Object Weight, Title)
}

if (-not $Series) {
    throw "必须指定 -Series，例如 -Series noise-fundamentals"
}
if (-not (Test-Path -LiteralPath $seriesIndex)) {
    throw "系列「$Series」还没有定义。先运行：`n  .\hugo new content series/$Series/_index.md --kind series"
}

$members = @(Get-SeriesMembers -Term $Series)

if ($List) {
    if ($members.Count -eq 0) {
        Write-Host "系列「$Series」还没有文章。"
    } else {
        Write-Host "系列「$Series」共 $($members.Count) 篇："
        $members | ForEach-Object { "  {0,3}. {1}  ({2})" -f $_.Weight, $_.Title, $_.File }
    }
    return
}

if (-not $Name) {
    throw "必须指定 -Name，例如 -Name noise-measure"
}
if ($Name -notmatch '^[a-z0-9][a-z0-9-]*$') {
    throw "-Name 只能使用小写字母、数字和连字符，例如 noise-measure"
}

$target = Join-Path $notesDir "$Name.md"
if (Test-Path -LiteralPath $target) {
    throw "content/notes/$Name.md 已经存在，换一个 -Name，或直接编辑原文件。"
}

$next = 1
if ($members.Count -gt 0) {
    $max = ($members | Measure-Object -Property Weight -Maximum).Maximum
    $next = [int]$max + 1
}
if ($Weight -gt 0) {
    if ($members.Weight -contains $Weight) {
        throw "编号 $Weight 在系列「$Series」里已被占用，换一个没用的编号。"
    }
    $next = $Weight
}

$hugo = Join-Path $root ".tools\hugo\hugo.exe"
if (-not (Test-Path -LiteralPath $hugo)) {
    $cmd = Get-Command hugo -ErrorAction SilentlyContinue
    if (-not $cmd) { throw "找不到 hugo：既没有 .tools/hugo/hugo.exe，也不在 PATH 里。" }
    $hugo = $cmd.Source
}

$env:HUGO_CACHEDIR = Join-Path $root ".cache\hugo"
Push-Location $root
try {
    & $hugo new content "notes/$Name.md" --kind $Kind
    if ($LASTEXITCODE -ne 0) { throw "hugo new 失败，退出码 $LASTEXITCODE" }
} finally {
    Pop-Location
}

$titleValue = if ($Title) { $Title } else { ($Name -replace '-', ' ') }
$titleValue = $titleValue -replace '"', '\"'

$topicList = @()
if ($Topics) {
    $topicList = $Topics -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}
$topicsYaml = ($topicList | ForEach-Object { '"' + $_ + '"' }) -join ', '

$text = Get-Content -LiteralPath $target -Raw -Encoding UTF8
$text = $text -replace '(?m)^title:.*$', "title: `"$titleValue`""
$text = $text -replace '(?m)^slug:.*$', "slug: `"$Name`""
$text = $text -replace '(?m)^topics:.*$', "topics: [$topicsYaml]"
$text = $text -replace '(?m)^series:.*$', "series: [`"$Series`"]"
$text = $text -replace '(?m)^series_weight:.*$', "series_weight: $next"

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($target, $text, $utf8)

$all = @(Get-SeriesMembers -Term $Series)
Write-Host ""
Write-Host "系列「$Series」现在共 $($all.Count) 篇："
$all | ForEach-Object { "  {0,3}. {1}  ({2})" -f $_.Weight, $_.Title, $_.File }
Write-Host ""
Write-Host "已创建：content/notes/$Name.md（第 $next 篇）"
Write-Host "地址：  /notes/$Name/"
