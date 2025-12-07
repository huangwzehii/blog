# 快速修复指南 - 服务器发布失败

## 🚨 本地成功，服务器失败的常见原因

### 1️⃣ 数据库权限问题（最常见）⭐⭐⭐⭐⭐

**症状**: 
- 可以访问网站
- 可以登录
- 发布时提示失败
- 服务器日志显示 `SQLITE_CANTOPEN` 或 `EACCES`

**快速修复**:
```bash
# SSH登录到服务器后执行
cd /path/to/your/blog

# 修复数据库权限
chmod 644 blog.db
chown $USER:$USER blog.db

# 修复目录权限
chmod 755 .

# 重启服务
pm2 restart blog
# 或
systemctl restart your-service
```

---

### 2️⃣ uploads目录权限问题 ⭐⭐⭐⭐

**症状**:
- 文章和碎碎念可以发布
- 相册上传失败

**快速修复**:
```bash
# 创建uploads目录（如果不存在）
mkdir -p uploads

# 修复权限
chmod 755 uploads
chown $USER:$USER uploads

# 测试写入
touch uploads/.test && rm uploads/.test && echo "OK" || echo "FAILED"

# 重启服务
pm2 restart blog
```

---

### 3️⃣ 磁盘空间不足 ⭐⭐⭐

**症状**:
- 之前可以发布，现在突然不行
- 上传照片失败

**快速检查**:
```bash
# 检查磁盘空间
df -h

# 检查当前目录大小
du -sh .
du -sh uploads/

# 清理空间
pm2 flush  # 清理PM2日志
rm -rf node_modules/.cache  # 清理缓存
```

---

### 4️⃣ Node.js进程权限问题 ⭐⭐⭐

**症状**:
- 使用sudo启动可以，普通用户启动不行

**快速修复**:
```bash
# 不要使用sudo运行Node.js
# 而是修复文件权限

# 修复所有文件所有权
chown -R $USER:$USER .

# 重新启动（不使用sudo）
pm2 delete blog
pm2 start server.js --name blog
```

---

### 5️⃣ SELinux阻止（CentOS/RHEL）⭐⭐

**症状**:
- 权限看起来正确
- 仍然无法写入

**快速检查**:
```bash
# 检查SELinux状态
getenforce

# 临时禁用SELinux测试
sudo setenforce 0

# 如果解决问题，永久配置
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/path/to/blog(/.*)?"
sudo restorecon -Rv /path/to/blog
```

---

## 🔍 诊断工具

### 方法1: 使用检查脚本

```bash
# 上传check-server.js到服务器
# 然后运行
node check-server.js
```

这会检查：
- ✅ Node.js版本
- ✅ 文件完整性
- ✅ 目录权限
- ✅ 数据库状态
- ✅ 依赖包
- ✅ 磁盘空间

### 方法2: 使用调试服务器

```bash
# 停止正常服务
pm2 stop blog

# 启动调试服务器
node server-debug.js

# 查看详细日志
# 尝试发布内容，观察日志输出
```

### 方法3: 手动测试API

```bash
# 测试创建文章
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "thoughts",
    "author": "male",
    "content": "测试内容"
  }'

# 如果返回错误，查看错误信息
```

---

## 📋 完整诊断流程

### 步骤1: 检查服务器状态
```bash
# 检查服务是否运行
pm2 list
# 或
ps aux | grep node

# 查看日志
pm2 logs blog --lines 50
```

### 步骤2: 检查文件权限
```bash
# 查看所有文件权限
ls -la

# 应该看到类似这样：
# -rw-r--r-- blog.db
# drwxr-xr-x uploads/
# -rw-r--r-- server.js
```

### 步骤3: 测试数据库
```bash
# 安装sqlite3命令行工具（如果没有）
# Ubuntu/Debian
sudo apt-get install sqlite3

# CentOS/RHEL
sudo yum install sqlite

# 测试数据库
sqlite3 blog.db "SELECT * FROM posts LIMIT 1;"

# 如果报错，说明数据库有问题
```

### 步骤4: 测试写入权限
```bash
# 测试当前目录
touch .test && rm .test && echo "目录可写" || echo "目录不可写"

# 测试uploads目录
touch uploads/.test && rm uploads/.test && echo "uploads可写" || echo "uploads不可写"

# 测试数据库
sqlite3 blog.db "INSERT INTO posts (type, author, content) VALUES ('thoughts', 'male', 'test');"
sqlite3 blog.db "DELETE FROM posts WHERE content='test';"
```

### 步骤5: 检查浏览器
```bash
# 在浏览器中按F12
# 1. 查看Console标签的错误
# 2. 查看Network标签的请求
#    - 请求URL是否正确
#    - 状态码是什么
#    - 响应内容是什么
```

---

## 🎯 根据错误码快速定位

### 404 Not Found
```
问题: API路径错误
检查: public/script.js中的API_URL配置
修复: 确保API_URL指向正确的域名
```

### 500 Internal Server Error
```
问题: 服务器内部错误
检查: 服务器日志 (pm2 logs blog)
常见原因:
  - 数据库权限
  - 磁盘空间不足
  - 代码错误
```

### 403 Forbidden
```
问题: 权限不足
检查: 文件和目录权限
修复: chmod 644 blog.db && chmod 755 uploads
```

### CORS Error
```
问题: 跨域请求被阻止
检查: server.js中的CORS配置
修复: 确保CORS允许你的域名
```

---

## 🔧 一键修复脚本

创建 `fix-permissions.sh`:
```bash
#!/bin/bash

echo "修复文件权限..."

# 修复数据库
if [ -f "blog.db" ]; then
    chmod 644 blog.db
    echo "✅ blog.db权限已修复"
fi

# 修复uploads目录
if [ -d "uploads" ]; then
    chmod 755 uploads
    echo "✅ uploads目录权限已修复"
else
    mkdir uploads
    chmod 755 uploads
    echo "✅ uploads目录已创建"
fi

# 修复当前目录
chmod 755 .
echo "✅ 当前目录权限已修复"

# 测试写入
if touch .test 2>/dev/null; then
    rm .test
    echo "✅ 目录可写"
else
    echo "❌ 目录不可写，请检查所有权"
    echo "运行: chown -R \$USER:\$USER ."
fi

if touch uploads/.test 2>/dev/null; then
    rm uploads/.test
    echo "✅ uploads目录可写"
else
    echo "❌ uploads目录不可写"
fi

echo ""
echo "修复完成！请重启服务："
echo "  pm2 restart blog"
```

使用方法:
```bash
chmod +x fix-permissions.sh
./fix-permissions.sh
```

---

## 📞 仍然无法解决？

请提供以下信息：

1. **服务器环境**:
   ```bash
   node --version
   npm --version
   uname -a
   ```

2. **文件权限**:
   ```bash
   ls -la blog.db uploads/
   ```

3. **服务器日志**:
   ```bash
   pm2 logs blog --lines 50
   ```

4. **浏览器错误**:
   - F12 -> Console标签的错误
   - F12 -> Network标签的失败请求

5. **测试结果**:
   ```bash
   node check-server.js
   ```

---

## ✅ 成功标志

修复成功后，你应该能看到：

1. **服务器日志**:
   ```
   [INFO] 创建新文章
   [INFO] 文章创建成功，ID: 1
   ```

2. **浏览器控制台**:
   ```
   无错误信息
   ```

3. **Network标签**:
   ```
   POST /api/posts
   Status: 200 OK
   Response: {"id":1,"message":"发布成功"}
   ```

4. **页面显示**:
   ```
   ✅ 发布成功！
   内容出现在列表中
   ```

---

**最后更新**: 2024-12-07
**适用于**: Linux/Unix服务器部署
