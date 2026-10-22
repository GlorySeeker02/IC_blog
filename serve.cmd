@echo off
rem Usage: serve.cmd [extra hugo server args]
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
