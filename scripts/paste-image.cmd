@echo off
rem Usage: scripts\paste-image.cmd -Slug noise-figure
rem        scripts\paste-image.cmd -Slug noise-figure -File D:\pics\shot.png
powershell -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0paste-image.ps1" %*
