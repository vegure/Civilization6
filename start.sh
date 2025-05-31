#!/bin/bash

# 文明时代游戏启动脚本

echo "🏛️ 文明时代 - Civilization Era 🏛️"
echo "======================================"
echo ""

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

echo "✅ Python3 已安装"

# 获取当前目录
GAME_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 游戏目录: $GAME_DIR"

# 设置端口
PORT=${1:-12000}
echo "🌐 服务器端口: $PORT"

# 启动HTTP服务器
echo ""
echo "🚀 启动游戏服务器..."
echo "📱 游戏地址: http://localhost:$PORT"
echo "🔧 调试模式: http://localhost:$PORT/#debug"
echo "📖 演示页面: http://localhost:$PORT/demo.html"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "======================================"

cd "$GAME_DIR"
python3 -m http.server $PORT --bind 0.0.0.0