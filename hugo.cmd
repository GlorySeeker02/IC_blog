@echo off
rem Project-local Hugo shim.
rem PowerShell: .\hugo version
rem cmd:        hugo version
rem
rem Hugo defaults its cache and temp files to %TEMP%. Restricted or sandboxed
rem accounts cannot write there, which surfaces as:
rem   ERROR failed to load config: mkdir ...\Temp\hugo_cache: Access is denied.
rem Pin both inside the project so every subcommand (new/build/server) works.
if not defined HUGO_CACHEDIR set "HUGO_CACHEDIR=%~dp0.cache\hugo"
set "TEMP=%~dp0.cache\temp"
set "TMP=%TEMP%"
if not exist "%TEMP%" mkdir "%TEMP%" >nul 2>nul
"%~dp0.tools\hugo\hugo.exe" %*
