# 🚀 Railway 部署 - 5分钟快速开始

## 选择你的方式

### 🎯 方式1: 使用 GitHub（推荐，最简单）

**你需要：**
- GitHub 账号
- Git 软件

**步骤：**
1. 安装 Git → https://git-scm.com/download/win
2. 创建 GitHub 账号 → https://github.com
3. 上传代码到 GitHub
4. 连接 Railway 自动部署

**详细教程：** 看 `RAILWAY-DEPLOY.md` 的方案A

---

### 🎯 方式2: 使用 Railway CLI

**你需要：**
- Railway 账号
- Node.js（你已经有了）

**步骤：**
```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 部署
railway up

# 5. 生成域名
railway domain
```

**详细教程：** 看 `RAILWAY-DEPLOY.md` 的方案B

---

## 🎬 推荐流程（最简单）

### 第1步：安装 Git（5分钟）

1. 访问 https://git-scm.com/download/win
2. 下载并安装
3. 全部选择默认选项
4. 安装完成

### 第2步：创建 GitHub 账号（3分钟）

1. 访问 https://github.com
2. 点击 "Sign up"
3. 填写邮箱、密码、用户名
4. 验证邮箱

### 第3步：上传代码（2分钟）

**在 GitHub 上：**
1. 点击右上角 "+" → "New repository"
2. 名称填 `blog`
3. 选择 Public
4. 点击 "Create repository"
5. **记下仓库地址**，类似：`https://github.com/你的用户名/blog.git`

**在你的电脑上：**
打开命令行（在 D:\blog 文件夹），输入：

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/blog.git
git branch -M main
git push -u origin main
```

如果提示输入密码，需要使用 Personal Access Token：
- GitHub → Settings → Developer settings → Personal access tokens
- Generate new token → 勾选 repo → 生成
- 复制 token 作为密码使用

### 第4步：部署到 Railway（2分钟）

1. 访问 https://railway.app
2. 点击 "Login with GitHub"
3. 授权 Railway
4. 点击 "New Project"
5. 选择 "Deploy from GitHub repo"
6. 选择你的 `blog` 仓库
7. 等待部署完成

### 第5步：获取域名（1分钟）

1. 点击你的项目
2. 点击 "Settings"
3. 找到 "Domains"
4. 点击 "Generate Domain"
5. 复制域名

### 第6步：测试（1分钟）

访问你的 Railway 域名，测试所有功能！

---

## ⚡ 超快速方式（如果你熟悉命令行）

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化并部署
railway init
railway up

# 生成域名
railway domain
```

完成！

---

## 🆘 遇到问题？

### Git 相关
- **"git 不是内部或外部命令"** → 安装 Git 后重启命令行
- **"Permission denied"** → 使用 Personal Access Token 而不是密码

### Railway 相关
- **部署失败** → 运行 `railway logs` 查看错误
- **网站打不开** → 检查域名是否正确生成
- **发布失败** → 查看浏览器 Console 的错误信息

### 查看详细教程
- `RAILWAY-DEPLOY.md` - 完整部署指南
- `DEPLOYMENT-ISSUES.md` - 问题排查指南

---

## 📞 需要帮助？

告诉我：
1. 你选择哪种方式？（GitHub 或 CLI）
2. 卡在哪一步了？
3. 看到什么错误信息？

我会帮你解决！

---

**现在就开始吧！选择一种方式，跟着步骤做，15分钟内完成部署！** 🎉
