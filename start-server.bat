@echo off
chcp 65001 >nul
title Study Tracker Server

echo ========================================
echo   Study Tracker Server
echo ========================================
echo.
echo Starting server on port 5500...
echo.

REM Register URL ACL for port 5500
netsh http add urlacl url=http://0.0.0.0:5500/ user=Everyone >nul 2>&1

REM Start PowerShell server
powershell -ExecutionPolicy Bypass -Command "& { $l = [System.Net.HttpListener]::new(); $l.Prefixes.Add('http://0.0.0.0:5500/'); $l.Start(); Write-Host 'Server started!' -ForegroundColor Green; Write-Host 'Local: http://localhost:5500' -ForegroundColor Yellow; Write-Host 'Network: http://192.168.1.102:5500' -ForegroundColor Cyan; $r = 'C:\Users\Pc\Desktop\study-tracker'; $m = @{'.html'='text/html';'.css'='text/css';'.js'='application/javascript'}; while($true) { $c = $l.GetContext(); $p = $c.Request.Url.LocalPath; if($p -eq '/') {$p = '/index.html'}; $f = Join-Path $r $p.TrimStart('/'); if(Test-Path $f) { $e = [IO.Path]::GetExtension($f); $ct = $m[$e]; if(-not $ct) {$ct = 'application/octet-stream'}; $b = [IO.File]::ReadAllBytes($f); $c.Response.ContentType = $ct; $c.Response.ContentLength64 = $b.Length; $c.Response.OutputStream.Write($b, 0, $b.Length) } else { $c.Response.StatusCode = 404 }; $c.Response.Close() } }"

pause