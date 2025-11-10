#!/bin/bash

# Docker Compose 快速修复脚本 (Bash)
# 用于修复 /hapxs-surl 到 /app 的路径问题

echo "🔧 修复 Docker Compose 配置..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# 检查是否有 docker-compose 文件
files=$(ls docker-compose*.yml 2>/dev/null)

if [ -z "$files" ]; then
    echo -e "${RED}❌ 未找到 docker-compose*.yml 文件${NC}"
    exit 1
fi

# 处理每个文件
for file in docker-compose*.yml; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}📝 处理: $file...${NC}"
        
        # 创建备份
        cp "$file" "$file.backup"
        echo -e "${GRAY}   💾 已创建备份: $file.backup${NC}"
        
        updated=false
        
        # 修复 custom 目录路径
        if grep -q '/hapxs-surl/custom' "$file"; then
            sed -i.tmp 's|/hapxs-surl/custom|/app/custom|g' "$file"
            rm -f "$file.tmp"
            updated=true
            echo -e "${GREEN}   ✅ 已更新 custom 路径${NC}"
        fi
        
        # 添加 3001 端口（如果不存在）
        if grep -q '3000:3000' "$file" && ! grep -q '3001:3001' "$file"; then
            # 使用 awk 在 3000:3000 后添加 3001:3001
            awk '/3000:3000/ {print; print "      - 3001:3001"; next}1' "$file" > "$file.tmp"
            mv "$file.tmp" "$file"
            updated=true
            echo -e "${GREEN}   ✅ 已添加 3001 端口映射${NC}"
        fi
        
        if [ "$updated" = true ]; then
            echo -e "${GREEN}   ✨ $file 已更新${NC}"
        else
            echo -e "${BLUE}   ℹ️  $file 无需更新${NC}"
            rm -f "$file.backup"
        fi
        
        echo ""
    fi
done

echo -e "${GREEN}🎉 所有配置文件已处理完成！${NC}"
echo ""
echo -e "${CYAN}📋 下一步操作:${NC}"
echo -e "   ${NC}1. 查看更改: git diff"
echo -e "   ${NC}2. 停止容器: docker-compose down"
echo -e "   ${NC}3. 重新构建: docker-compose build --no-cache"
echo -e "   ${NC}4. 启动服务: docker-compose up -d"
echo ""
echo -e "${GRAY}💡 提示: 备份文件已保存为 *.backup${NC}"
