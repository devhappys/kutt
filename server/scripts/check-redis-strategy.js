#!/usr/bin/env node

/**
 * Redis 策略检查工具
 * 帮助你决定是否应该使用 Redis
 * 
 * Usage: node server/scripts/check-redis-strategy.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

async function assessRedisNeed() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════╗', 'cyan');
  log('║         Redis 使用策略评估工具                        ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════╝', 'cyan');
  console.log();

  let score = 0;
  const recommendations = [];

  // 问题 1: 环境类型
  log('📋 第 1/6 题: 这是什么环境？', 'bright');
  log('  1. 生产环境');
  log('  2. 开发/测试环境');
  log('  3. 个人项目/演示');
  const env = await question('请选择 (1-3): ');
  
  if (env === '1') {
    score += 30;
    recommendations.push('✅ 生产环境强烈建议使用 Redis');
  } else if (env === '2') {
    score += 10;
    recommendations.push('ℹ️ 开发环境可选使用 Redis（建议启用以模拟生产）');
  } else {
    score += 0;
    recommendations.push('ℹ️ 个人项目可以不使用 Redis');
  }
  console.log();

  // 问题 2: 日访问量
  log('📊 第 2/6 题: 预期日访问量？', 'bright');
  log('  1. < 100 次/天');
  log('  2. 100 - 1,000 次/天');
  log('  3. 1,000 - 10,000 次/天');
  log('  4. > 10,000 次/天');
  const traffic = await question('请选择 (1-4): ');
  
  if (traffic === '4') {
    score += 30;
    recommendations.push('✅ 高流量场景必须使用 Redis');
  } else if (traffic === '3') {
    score += 20;
    recommendations.push('✅ 中等流量强烈建议使用 Redis');
  } else if (traffic === '2') {
    score += 10;
    recommendations.push('⚠️ 低流量可选 Redis（推荐使用）');
  } else {
    score += 0;
    recommendations.push('ℹ️ 极低流量无需 Redis');
  }
  console.log();

  // 问题 3: 并发用户
  log('👥 第 3/6 题: 预期并发用户数？', 'bright');
  log('  1. < 10 人');
  log('  2. 10 - 50 人');
  log('  3. 50 - 200 人');
  log('  4. > 200 人');
  const concurrent = await question('请选择 (1-4): ');
  
  if (concurrent === '4') {
    score += 20;
    recommendations.push('✅ 高并发必须使用 Redis');
  } else if (concurrent === '3') {
    score += 15;
    recommendations.push('✅ 中等并发强烈建议 Redis');
  } else if (concurrent === '2') {
    score += 5;
    recommendations.push('⚠️ 低并发可选 Redis');
  }
  console.log();

  // 问题 4: 部署方式
  log('🚀 第 4/6 题: 部署方式？', 'bright');
  log('  1. 单服务器');
  log('  2. 多服务器/集群（PM2/Docker/K8s）');
  const deployment = await question('请选择 (1-2): ');
  
  if (deployment === '2') {
    score += 30;
    recommendations.push('✅ 集群部署必须使用 Redis（共享缓存和队列）');
  } else {
    recommendations.push('ℹ️ 单服务器部署可选 Redis');
  }
  console.log();

  // 问题 5: 是否需要队列
  log('🔄 第 5/6 题: 是否需要持久化的任务队列？', 'bright');
  log('  (访问统计、邮件发送、数据导出等异步任务)');
  log('  1. 是，需要任务持久化和重试');
  log('  2. 否，可以接受任务丢失');
  const queue = await question('请选择 (1-2): ');
  
  if (queue === '1') {
    score += 20;
    recommendations.push('✅ 需要可靠队列必须使用 Redis');
  } else {
    recommendations.push('ℹ️ 可以使用内存队列（服务重启会丢失任务）');
  }
  console.log();

  // 问题 6: 预算和资源
  log('💰 第 6/6 题: 服务器资源情况？', 'bright');
  log('  1. 充足（> 1GB RAM，可安装额外服务）');
  log('  2. 有限（512MB RAM）');
  log('  3. 极度受限（< 256MB RAM，共享主机）');
  const resources = await question('请选择 (1-3): ');
  
  if (resources === '1') {
    score += 10;
    recommendations.push('✅ 资源充足，适合使用 Redis');
  } else if (resources === '2') {
    score += 5;
    recommendations.push('⚠️ 资源有限，需要权衡');
  } else {
    score -= 20;
    recommendations.push('❌ 资源受限，建议不使用 Redis');
  }
  console.log();

  // 计算结果
  console.log('═══════════════════════════════════════════════════════');
  log('\n📊 评估结果', 'bright');
  console.log('═══════════════════════════════════════════════════════\n');

  log(`总分: ${score} / 100`, 'cyan');
  console.log();

  // 最终建议
  if (score >= 70) {
    log('🎯 强烈建议：使用 Redis', 'green');
    log('\n原因：', 'bright');
    recommendations.forEach(r => log('  ' + r, 'green'));
    
    log('\n📝 配置建议：', 'bright');
    log('  在 .env 文件中设置：', 'yellow');
    log('  REDIS_ENABLED=true', 'cyan');
    log('  REDIS_HOST=127.0.0.1', 'cyan');
    log('  REDIS_PORT=6379', 'cyan');
    log('  REDIS_PASSWORD=your_secure_password  # 生产环境必须设置', 'cyan');
    
    log('\n🐳 Docker 快速启动：', 'bright');
    log('  docker run -d -p 6379:6379 --name redis redis:7-alpine', 'cyan');
    
    log('\n📈 预期收益：', 'bright');
    log('  • 响应速度提升 5-10x', 'green');
    log('  • 数据库压力降低 90%+', 'green');
    log('  • 支持水平扩展', 'green');
    log('  • 任务队列持久化', 'green');

  } else if (score >= 40) {
    log('💡 建议：可选使用 Redis', 'yellow');
    log('\n原因：', 'bright');
    recommendations.forEach(r => log('  ' + r, 'yellow'));
    
    log('\n权衡：', 'bright');
    log('  优点：', 'green');
    log('    • 提升性能', 'green');
    log('    • 更好的扩展性', 'green');
    log('  缺点：', 'red');
    log('    • 增加部署复杂度', 'red');
    log('    • 额外资源消耗（~80MB）', 'red');
    
    log('\n💡 建议：', 'bright');
    log('  如果预算允许，建议启用 Redis', 'yellow');
    log('  否则可以暂时不用，等流量增长后再启用', 'yellow');

  } else {
    log('✋ 建议：暂不使用 Redis', 'red');
    log('\n原因：', 'bright');
    recommendations.forEach(r => log('  ' + r, 'red'));
    
    log('\n📝 配置建议：', 'bright');
    log('  在 .env 文件中设置：', 'yellow');
    log('  REDIS_ENABLED=false', 'cyan');
    
    log('\n✅ 系统将自动：', 'bright');
    log('  • 使用内存队列处理任务', 'green');
    log('  • 跳过缓存层直接查询数据库', 'green');
    log('  • 简化部署流程', 'green');
    
    log('\n📈 何时考虑启用 Redis：', 'bright');
    log('  • 日访问量超过 1,000 次', 'yellow');
    log('  • 需要多服务器部署', 'yellow');
    log('  • 数据库查询变慢', 'yellow');
    log('  • 需要可靠的任务队列', 'yellow');
  }

  console.log();
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('📚 详细指南: REDIS_STRATEGY.md', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  console.log();

  rl.close();
}

// 运行评估
assessRedisNeed().catch(console.error);
