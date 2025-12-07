# 部署问题排查指南

## 问题：发布内容失败

### 已修复的问题

#### 1. ✅ API地址硬编码问题
**问题描述**: `API_URL` 硬编码为 `http://localhost:3000/api`，在托管服务器上无法工作。

**修复方案**: 
```javascript
// 修改前
const API_URL = 'http://localhost:3000/api';

// 修改后 - 自动检测环境
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : `${window.location.protocol}//${window.location.host}/api`;
```

#### 2. ✅ 端口配置问题
**问题描述**: 端口硬编码为3000，托管服务器可能使用其他端口。

**修复方案**:
```javascript
// 修改前
const PORT = 3000;

// 修改后 - 使用环境变量
const PORT = process.env.PORT || 3000;
```

---

## 常见部署问题排查

### 问题1: 发布内容提示失败

#### 可能原因A: 数据库文件权限问题
**症状**: 
- 可以访问网站
- 可以登录
- 发布内容时提示失败

**解决方案**:
```bash
# 检查数据库文件权限
ls -la blog.db

# 修改权限（Linux/Mac）
chmod 644 blog.db
chown www-data:www-data blog.db

# 确保目录可写
chmod 755 .
```

#### 可能原因B: 数据库文件不存在
**症状**: 
- 首次部署
- 没有上传blog.db文件

**解决方案**:
1. 让服务器自动创建数据库（推荐）
   - 删除现有的blog.db
   - 重启服务器
   - 服务器会自动创建新数据库

2. 或者从本地上传blog.db文件

#### 可能原因C: uploads目录权限问题
**症状**: 
- 文章和碎碎念可以发布
- 相册上传失败

**解决方案**:
```bash
# 检查uploads目录
ls -la uploads/

# 修改权限
chmod 755 uploads/
chown www-data:www-data uploads/

# 如果目录不存在，创建它
mkdir uploads
chmod 755 uploads
```

#### 可能原因D: 文件大小限制
**症状**: 
- 小文件可以上传
- 大文件上传失败

**解决方案**:
检查托管服务器的上传限制，可能需要在服务器配置中增加限制：

**Nginx配置**:
```nginx
client_max_body_size 50M;
```

**Apache配置**:
```apache
LimitRequestBody 52428800
```

---

### 问题2: 网站无法访问

#### 可能原因A: 端口配置错误
**解决方案**:
确保服务器使用正确的端口，检查环境变量：
```bash
echo $PORT
```

#### 可能原因B: 防火墙阻止
**解决方案**:
```bash
# 检查防火墙
sudo ufw status

# 开放端口（如果需要）
sudo ufw allow 3000
```

#### 可能原因C: 服务未启动
**解决方案**:
```bash
# 检查进程
ps aux | grep node

# 使用PM2启动
pm2 start server.js --name blog
pm2 logs blog
```

---

### 问题3: 照片上传失败

#### 可能原因A: uploads目录不存在
**解决方案**:
```bash
mkdir uploads
chmod 755 uploads
```

#### 可能原因B: 磁盘空间不足
**解决方案**:
```bash
# 检查磁盘空间
df -h

# 清理空间
pm2 flush  # 清理PM2日志
```

#### 可能原因C: 文件类型限制
**解决方案**:
检查multer配置，确保允许图片格式：
```javascript
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'));
        }
    }
});
```

---

### 问题4: CORS跨域错误

#### 症状
浏览器控制台显示CORS错误：
```
Access to fetch at 'xxx' from origin 'xxx' has been blocked by CORS policy
```

#### 解决方案
更新server.js中的CORS配置：
```javascript
// 方案1: 允许所有来源（开发环境）
app.use(cors());

// 方案2: 指定允许的来源（生产环境推荐）
app.use(cors({
    origin: ['https://yourdomain.com', 'http://localhost:3000'],
    credentials: true
}));
```

---

### 问题5: 数据库锁定错误

#### 症状
```
Error: SQLITE_BUSY: database is locked
```

#### 解决方案
```javascript
// 在server.js中配置数据库
const db = new sqlite3.Database('./blog.db', (err) => {
    if (err) {
        console.error('数据库连接失败:', err);
    } else {
        console.log('数据库连接成功');
        // 设置超时时间
        db.configure('busyTimeout', 10000);
        initDatabase();
    }
});
```

---

## 调试步骤

### 1. 检查浏览器控制台
按F12打开开发者工具，查看：
- Console标签：查看JavaScript错误
- Network标签：查看API请求状态

### 2. 检查服务器日志
```bash
# 如果使用PM2
pm2 logs blog

# 如果直接运行
node server.js
```

### 3. 测试API端点
```bash
# 测试服务器是否运行
curl http://your-domain.com

# 测试API
curl http://your-domain.com/api/posts/thoughts

# 测试发布（需要替换数据）
curl -X POST http://your-domain.com/api/posts \
  -H "Content-Type: application/json" \
  -d '{"type":"thoughts","author":"male","content":"测试内容"}'
```

### 4. 检查文件权限
```bash
# 检查所有文件权限
ls -la

# 应该看到类似这样的权限
# -rw-r--r-- blog.db
# drwxr-xr-x uploads/
# -rw-r--r-- server.js
```

---

## 不同托管平台的特殊配置

### Vercel
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

**注意**: Vercel是Serverless，不支持SQLite持久化，需要使用外部数据库。

### Railway
- 自动检测Node.js项目
- 自动设置PORT环境变量
- 支持SQLite（但重启会丢失数据）
- 建议使用PostgreSQL

### Render
```yaml
# render.yaml
services:
  - type: web
    name: blog
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
```

### 自建VPS
使用PM2管理进程：
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name blog

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs blog
```

---

## 环境变量配置

创建 `.env` 文件（不要提交到Git）：
```env
PORT=3000
NODE_ENV=production
DATABASE_PATH=./blog.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

在server.js中使用：
```javascript
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const DATABASE_PATH = process.env.DATABASE_PATH || './blog.db';
```

---

## 生产环境检查清单

部署前检查：
- [ ] 修改了默认密码
- [ ] API_URL配置正确
- [ ] PORT使用环境变量
- [ ] 数据库文件权限正确
- [ ] uploads目录存在且可写
- [ ] CORS配置正确
- [ ] 文件上传大小限制合理
- [ ] 已安装所有依赖
- [ ] 已测试所有功能

部署后检查：
- [ ] 网站可以访问
- [ ] 可以登录
- [ ] 可以发布碎碎念
- [ ] 可以发布文章
- [ ] 可以上传相册
- [ ] 可以发表评论
- [ ] 搜索功能正常
- [ ] 日历功能正常
- [ ] 通知功能正常
- [ ] 移动端显示正常

---

## 快速修复命令

```bash
# 一键修复权限问题
chmod 644 blog.db
chmod 755 uploads
chmod 755 .

# 重启服务
pm2 restart blog

# 查看实时日志
pm2 logs blog --lines 100

# 清理并重新安装依赖
rm -rf node_modules
npm install

# 测试服务器
curl http://localhost:3000
```

---

## 获取帮助

如果以上方法都无法解决问题，请提供以下信息：

1. **托管平台名称**: (Vercel/Railway/Render/VPS等)
2. **错误信息**: 浏览器控制台的完整错误
3. **服务器日志**: PM2或服务器的日志输出
4. **网络请求**: Network标签中失败的请求详情
5. **环境信息**: Node.js版本、操作系统等

---

**最后更新**: 2024-12-07
**状态**: ✅ 已修复API地址和端口配置问题
