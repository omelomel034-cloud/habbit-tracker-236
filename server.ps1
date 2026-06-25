# Simple HTTP Server for Study Tracker
# Binds to 0.0.0.0:5500 for local network access

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://0.0.0.0:5500/")
$listener.Start()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Study Tracker Server Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Local Access: http://localhost:5500" -ForegroundColor Yellow
Write-Host "  Network Access: http://192.168.1.102:5500" -ForegroundColor Green
Write-Host ""
Write-Host "  Open this URL on your phone:" -ForegroundColor White
Write-Host "  👉 http://192.168.1.102:5500" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = "C:\Users\Pc\Desktop\study-tracker"

$mimeTypes = @{
    ".html" = "text/html"
    ".css" = "text/css"
    ".js" = "application/javascript"
    ".json" = "application/json"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif" = "image/gif"
    ".svg" = "image/svg+xml"
    ".ico" = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf" = "font/ttf"
    ".mp3" = "audio/mpeg"
    ".wav" = "audio/wav"
}

while ($true) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") {
            $localPath = "/index.html"
        }
        
        $filePath = Join-Path $rootPath $localPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath)
            $contentType = $mimeTypes[$extension]
            if (-not $contentType) {
                $contentType = "application/octet-stream"
            }
            
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $buffer.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
            $errorMessage = "404 - File Not Found"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.Close()
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}