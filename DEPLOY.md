# 部署说明

## 项目结构

```
blog/
├── public/              # 静态文件目录
│   ├── index.html      # 前端页面
│   ├── script.js       # 前端JavaScript
│   └── style.css       # 前端样式
├── uploads/            # 上传的照片存储目录
├── node_modules/       # Node.js依赖（部署时需要）
├── .gitignore         # Git忽略文件配置
├── blog.db            # SQLite数据库文件
├── package.json       # 项目依赖配置
├── package-lock.json  # 依赖锁定文件
├── README.md          # 项目说明
└── server.js          # Node.js服务器
```

## 部署前准备

### 1. 必需文件清单
- ✅ `server.js` - 服务器主文件
- ✅ `package.json` - 依赖配置
- ✅ `package-lock.json` - 依赖锁定
- ✅ `public/` - 前端文件目录
- ✅ `uploads/` - 照片存储目录
- ✅ `blog.db` - 数据库文件（可选，首次部署会自动创建）
- ✅ `.gitignore` - Git配置
- ✅ `README.md` - 项目说明

### 2. 不需要上传的文件/目录
- ❌ `node_modules/` - 在服务器上重新安装
- ❌ `.vscode/` - 开发工具配置
- ❌ `.env` - 环境变量（如果有敏感信息）

## 部署步骤

### 方案一：使用Git部署

1. **初始化Git仓库**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **推送到远程仓库**
```bash
git remote add origin <你的仓库地址>
git push -u origin main
```

3. **在服务器上克隆**
```bash
git clone <你的仓库地址>
cd blog
npm install
```

4. **启动服务**
```bash
node server.js
# 或使用 PM2
pm2 start server.js --name blog
```

### 方案二：直接上传文件

1. **压缩项目文件**
   - 排除 `node_modules/` 目录
   - 排除 `.vscode/` 目录

2. **上传到服务器**
   - 使用FTP/SFTP上传
   - 或使用服务器面板上传

3. **在服务器上安装依赖**
```bash
cd /path/to/blog
npm install
```

4. **启动服务**
```bash
node server.js
```

## 环境要求

- **Node.js**: v14.0.0 或更高版本
- **npm**: v6.0.0 或更高版本
- **端口**: 3000（可在server.js中修改）
- **磁盘空间**: 至少100MB（用于照片存储）

## 配置修改

### 修改端口
编辑 `server.js`，找到：
```javascript
const PORT = process.env.PORT || 3000;
```
修改为你需要的端口。

### 修改密码
编辑 `public/script.js`，找到：
```javascript
const PASSWORDS = {
    male: 'sr',
    female: 'nxz'
};
```
修改为你的密码。

### 修改计时器起始日期
编辑 `public/script.js`，找到：
```javascript
const startDate = new Date('2025-12-01T00:00:00+08:00');
```
修改为你的起始日期。

## 使用PM2管理进程（推荐）

### 安装PM2
```bash
npm install -g pm2
```

### 启动应用
```bash
pm2 start server.js --name blog
```

### 常用命令
```bash
pm2 list              # 查看所有进程
pm2 logs blog         # 查看日志
pm2 restart blog      # 重启应用
pm2 stop blog         # 停止应用
pm2 delete blog       # 删除应用
pm2 startup           # 设置开机自启
pm2 save              # 保存当前进程列表
```

## 反向代理配置（可选）

### Nginx配置示例
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache配置示例
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

## 数据备份

### 备份数据库
```bash
cp blog.db blog.db.backup
```

### 备份照片
```bash
tar -czf uploads-backup.tar.gz uploads/
```

### 定期备份脚本
创建 `backup.sh`：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp blog.db backups/blog_$DATE.db
tar -czf backups/uploads_$DATE.tar.gz uploads/
# 删除30天前的备份
find backups/ -name "*.db" -mtime +30 -delete
find backups/ -name "*.tar.gz" -mtime +30 -delete
```

设置定时任务：
```bash
crontab -e
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

## 故障排查

### 端口被占用
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F

# Linux
lsof -i :3000
kill -9 <进程ID>
```

### 数据库权限问题
```bash
chmod 644 blog.db
chown www-data:www-data blog.db
```

### 照片上传失败
```bash
chmod 755 uploads/
chown www-data:www-data uploads/
```

## 安全建议

1. **修改默认密码** - 不要使用默认的 'sr' 和 'nxz'
2. **使用HTTPS** - 配置SSL证书
3. **限制上传大小** - 防止恶意上传
4. **定期备份** - 避免数据丢失
5. **更新依赖** - 定期运行 `npm update`
6. **防火墙配置** - 只开放必要的端口

## 性能优化

1. **启用Gzip压缩** - 在Nginx/Apache中配置
2. **静态文件CDN** - 将照片存储到CDN
3. **数据库优化** - 定期清理和优化
4. **缓存策略** - 配置浏览器缓存

## 监控和日志

### 查看应用日志
```bash
pm2 logs blog
```

### 查看系统资源
```bash
pm2 monit
```

### 错误日志
应用错误会输出到控制台，使用PM2可以自动记录到日志文件。

## 联系支持

如有问题，请检查：
1. Node.js版本是否符合要求
2. 端口是否被占用
3. 文件权限是否正确
4. 依赖是否完整安装

## 更新日志

- 2024-12-07: 初始版本
- 清理了所有开发文档
- 准备生产环境部署
