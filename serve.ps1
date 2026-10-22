# Local preview wrapper.
# Hugo caches to %TEMP%\hugo_cache by default; restricted/sandboxed accounts
# cannot write there, so keep cache and temp inside the project.
#
# Usage:
#   .\serve.cmd                  # http://localhost:1313
#   .\serve.cmd --port 1414 -D   # extra args go to "hugo server"
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cacheRoot = Join-Path $root ".cache"
New-Item -ItemType Directory -Force -Path $cacheRoot | Out-Null

$env:HUGO_CACHEDIR = Join-Path $cacheRoot "hugo"
$env:TEMP = Join-Path $cacheRoot "temp"
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

$hugo = Join-Path $root ".tools\hugo\hugo.exe"
if (-not (Test-Path $hugo)) {
    $cmd = Get-Command hugo -ErrorAction SilentlyContinue
    if (-not $cmd) {
        throw "hugo not found. Install Hugo extended or put it at .tools\hugo\hugo.exe."
    }
    $hugo = $cmd.Source
}

Write-Host "Hugo : $hugo"
Write-Host "Cache: $env:HUGO_CACHEDIR"

& $hugo server --source $root @args
exit $LASTEXITCODE
