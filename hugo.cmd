@echo off
rem Project-local Hugo shim.
rem PowerShell: .\hugo version
rem cmd:        hugo version
"%~dp0.tools\hugo\hugo.exe" %*
