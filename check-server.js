#!/usr/bin/env node

/**
 * 服务器环境检查脚本
 * 用于诊断部署问题
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('服务器环境检查工具');
console.log('='.repeat(60));
console.log();

// 检查项目
const checks = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function pass(message) {
    console.log('✅', message);
    checks.passed++;
}

function fail(message) {
    console.log('❌', message);
    checks.failed++;
}

function warn(message) {
    console.log('⚠️ ', message);
    checks.warnings++;
}

function info(message) {
    console.log('ℹ️ ', message);
}

console.log('1. 检查Node.js环境');
console.log('-'.repeat(60));
try {
    const nodeVersion = process.version;
    info(`Node.js版本: ${nodeVersion}`);
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 14) {
        pass('Node.js版本符合要求 (>= 14.0.0)');
    } else {
        fail('Node.js版本过低，需要 >= 14.0.0');
    }
} catch (e) {
    fail('无法检测Node.js版本');
}
console.log();

console.log('2. 检查必需文件');
console.log('-'.repeat(60));
const requiredFiles = [
    'server.js',
    'package.json',
    'public/index.html',
    'public/script.js',
    'public/style.css'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        pass(`${file} 存在`);
    } else {
        fail(`${file} 不存在`);
    }
});
console.log();

console.log('3. 检查目录权限');
console.log('-'.repeat(60));

// 检查当前目录
try {
    const testFile = '.write-test-' + Date.now();
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    pass('当前目录可写');
} catch (e) {
    fail('当前目录不可写: ' + e.message);
}

// 检查uploads目录
if (fs.existsSync('uploads')) {
    try {
        const testFile = 'uploads/.write-test-' + Date.now();
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        pass('uploads目录可写');
    } catch (e) {
        fail('uploads目录不可写: ' + e.message);
    }
    
    // 检查uploads目录权限（仅Unix系统）
    if (process.platform !== 'win32') {
        try {
            const stats = fs.statSync('uploads');
            const mode = (stats.mode & parseInt('777', 8)).toString(8);
            info(`uploads目录权限: ${mode}`);
            if (mode === '755' || mode === '775' || mode === '777') {
                pass('uploads目录权限正确');
            } else {
                warn(`uploads目录权限可能不正确: ${mode}，建议设置为755`);
            }
        } catch (e) {
            warn('无法检查uploads目录权限');
        }
    }
} else {
    warn('uploads目录不存在，将在启动时自动创建');
}
console.log();

console.log('4. 检查数据库');
console.log('-'.repeat(60));
if (fs.existsSync('blog.db')) {
    const stats = fs.statSync('blog.db');
    info(`数据库文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // 检查数据库文件权限
    try {
        const testDb = 'blog.db';
        fs.accessSync(testDb, fs.constants.R_OK | fs.constants.W_OK);
        pass('数据库文件可读写');
    } catch (e) {
        fail('数据库文件权限不足: ' + e.message);
    }
    
    // 检查数据库权限（仅Unix系统）
    if (process.platform !== 'win32') {
        try {
            const mode = (stats.mode & parseInt('777', 8)).toString(8);
            info(`数据库文件权限: ${mode}`);
            if (mode === '644' || mode === '664' || mode === '666') {
                pass('数据库文件权限正确');
            } else {
                warn(`数据库文件权限可能不正确: ${mode}，建议设置为644`);
            }
        } catch (e) {
            warn('无法检查数据库文件权限');
        }
    }
} else {
    warn('数据库文件不存在，将在首次启动时自动创建');
}
console.log();

console.log('5. 检查依赖包');
console.log('-'.repeat(60));
const requiredDeps = ['express', 'sqlite3', 'cors', 'multer'];
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
        if (fs.existsSync(`node_modules/${dep}`)) {
            pass(`${dep} 已安装`);
        } else {
            fail(`${dep} 未安装，请运行: npm install`);
        }
    } else {
        fail(`${dep} 未在package.json中声明`);
    }
});
console.log();

console.log('6. 检查环境变量');
console.log('-'.repeat(60));
const port = process.env.PORT;
if (port) {
    info(`PORT环境变量: ${port}`);
    pass('PORT环境变量已设置');
} else {
    warn('PORT环境变量未设置，将使用默认端口3000');
}

const nodeEnv = process.env.NODE_ENV;
if (nodeEnv) {
    info(`NODE_ENV: ${nodeEnv}`);
} else {
    info('NODE_ENV未设置');
}
console.log();

console.log('7. 检查磁盘空间');
console.log('-'.repeat(60));
if (process.platform !== 'win32') {
    try {
        const { execSync } = require('child_process');
        const df = execSync('df -h .').toString();
        const lines = df.split('\n');
        if (lines.length > 1) {
            info('磁盘空间:');
            console.log(lines[0]);
            console.log(lines[1]);
            
            // 解析使用率
            const parts = lines[1].split(/\s+/);
            const usage = parts[4];
            const usagePercent = parseInt(usage);
            if (usagePercent < 90) {
                pass('磁盘空间充足');
            } else {
                warn(`磁盘使用率较高: ${usage}`);
            }
        }
    } catch (e) {
        warn('无法检查磁盘空间');
    }
} else {
    info('Windows系统，跳过磁盘空间检查');
}
console.log();

console.log('8. 测试数据库连接');
console.log('-'.repeat(60));
try {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./blog.db', (err) => {
        if (err) {
            fail('数据库连接失败: ' + err.message);
        } else {
            pass('数据库连接成功');
            
            // 检查表是否存在
            db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
                if (err) {
                    fail('无法查询数据库表: ' + err.message);
                } else {
                    if (tables.length > 0) {
                        info(`数据库表: ${tables.map(t => t.name).join(', ')}`);
                        pass('数据库表已创建');
                    } else {
                        warn('数据库表为空，将在首次启动时创建');
                    }
                }
                db.close();
                printSummary();
            });
        }
    });
} catch (e) {
    fail('无法加载sqlite3模块: ' + e.message);
    printSummary();
}

function printSummary() {
    console.log();
    console.log('='.repeat(60));
    console.log('检查结果汇总');
    console.log('='.repeat(60));
    console.log(`✅ 通过: ${checks.passed}`);
    console.log(`❌ 失败: ${checks.failed}`);
    console.log(`⚠️  警告: ${checks.warnings}`);
    console.log();
    
    if (checks.failed === 0) {
        console.log('🎉 所有检查通过！服务器环境正常。');
        console.log();
        console.log('如果仍然无法发布内容，请检查：');
        console.log('1. 浏览器控制台的错误信息（F12 -> Console）');
        console.log('2. 网络请求的状态（F12 -> Network）');
        console.log('3. 服务器日志输出');
        console.log();
        console.log('启动服务器命令：');
        console.log('  node server.js');
        console.log('  或');
        console.log('  pm2 start server.js --name blog');
    } else {
        console.log('⚠️  发现问题，请根据上述提示修复。');
        console.log();
        console.log('常见修复命令：');
        console.log('  npm install              # 安装依赖');
        console.log('  chmod 644 blog.db        # 修复数据库权限');
        console.log('  chmod 755 uploads        # 修复uploads权限');
        console.log('  mkdir uploads            # 创建uploads目录');
    }
    console.log('='.repeat(60));
}
