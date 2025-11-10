const fs = require('fs');
const path = require('path');

/**
 * 移动所有Markdown文件（除了README.md）到markdown-docs文件夹
 */
function moveMarkdownFiles() {
  const currentDir = process.cwd();
  const targetDir = path.join(currentDir, 'markdown-docs');
  
  try {
    // 创建目标文件夹（如果不存在）
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log('✅ 创建目录:', targetDir);
    }
    
    // 读取当前目录下的所有文件
    const files = fs.readdirSync(currentDir);
    
    // 过滤出.md文件，排除README.md
    const mdFiles = files.filter(file => {
      const isMarkdown = path.extname(file).toLowerCase() === '.md';
      const isNotReadme = file.toLowerCase() !== 'readme.md';
      const isFile = fs.statSync(path.join(currentDir, file)).isFile();
      
      return isMarkdown && isNotReadme && isFile;
    });
    
    if (mdFiles.length === 0) {
      console.log('📝 没有找到需要移动的Markdown文件');
      return;
    }
    
    console.log(`📋 找到 ${mdFiles.length} 个Markdown文件需要移动:`);
    
    let movedCount = 0;
    let errorCount = 0;
    
    // 移动每个文件
    mdFiles.forEach(file => {
      const sourcePath = path.join(currentDir, file);
      const targetPath = path.join(targetDir, file);
      
      try {
        // 检查目标文件是否已存在
        if (fs.existsSync(targetPath)) {
          console.log(`⚠️  跳过 ${file} - 目标位置已存在同名文件`);
          return;
        }
        
        // 移动文件
        fs.renameSync(sourcePath, targetPath);
        console.log(`✅ 移动: ${file}`);
        movedCount++;
        
      } catch (error) {
        console.error(`❌ 移动失败 ${file}:`, error.message);
        errorCount++;
      }
    });
    
    // 输出结果统计
    console.log('\n📊 操作完成:');
    console.log(`   成功移动: ${movedCount} 个文件`);
    if (errorCount > 0) {
      console.log(`   失败: ${errorCount} 个文件`);
    }
    console.log(`   目标目录: ${targetDir}`);
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  console.log('🚀 开始移动Markdown文件...\n');
  moveMarkdownFiles();
}

module.exports = moveMarkdownFiles;
