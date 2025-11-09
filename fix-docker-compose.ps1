# Docker Compose 快速修复脚本 (PowerShell)
# 用于修复 /hapxs-surl 到 /app 的路径问题

Write-Host "🔧 修复 Docker Compose 配置..." -ForegroundColor Cyan
Write-Host ""

# 获取所有 docker-compose 文件
$files = Get-ChildItem -Path . -Filter "docker-compose*.yml"

if ($files.Count -eq 0) {
    Write-Host "❌ 未找到 docker-compose*.yml 文件" -ForegroundColor Red
    exit 1
}

foreach ($file in $files) {
    Write-Host "📝 处理: $($file.Name)..." -ForegroundColor Yellow
    
    # 创建备份
    $backupFile = "$($file.FullName).backup"
    Copy-Item $file.FullName $backupFile
    Write-Host "   💾 已创建备份: $($file.Name).backup" -ForegroundColor Gray
    
    # 读取内容
    $content = Get-Content $file.FullName -Raw
    
    # 执行替换
    $updated = $false
    
    # 修复 custom 目录路径
    if ($content -match '/hapxs-surl/custom') {
        $content = $content -replace '/hapxs-surl/custom', '/app/custom'
        $updated = $true
        Write-Host "   ✅ 已更新 custom 路径" -ForegroundColor Green
    }
    
    # 添加 3001 端口（如果不存在）
    if ($content -match 'ports:\s*\n\s*-\s*3000:3000' -and $content -notmatch '3001:3001') {
        $content = $content -replace '(ports:\s*\n\s*-\s*3000:3000)', "`$1`n      - 3001:3001"
        $updated = $true
        Write-Host "   ✅ 已添加 3001 端口映射" -ForegroundColor Green
    }
    
    if ($updated) {
        # 保存更新后的内容
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "   ✨ $($file.Name) 已更新" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  $($file.Name) 无需更新" -ForegroundColor Blue
        # 删除不必要的备份
        Remove-Item $backupFile
    }
    
    Write-Host ""
}

Write-Host "🎉 所有配置文件已处理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Cyan
Write-Host "   1. 查看更改: git diff" -ForegroundColor White
Write-Host "   2. 停止容器: docker-compose down" -ForegroundColor White
Write-Host "   3. 重新构建: docker-compose build --no-cache" -ForegroundColor White
Write-Host "   4. 启动服务: docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示: 备份文件已保存为 *.backup" -ForegroundColor Gray
