@echo off
rem Usage: scripts\new-note.cmd -Name noise-measure -Series noise-fundamentals -Topics noise -Title "Noise measurement"
rem List only: scripts\new-note.cmd -Series noise-fundamentals -List
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0new-note.ps1" %*
