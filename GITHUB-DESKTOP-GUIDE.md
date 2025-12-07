# 🚀 使用 GitHub Desktop 部署到 Railway

## 📥 第1步：下载并安装 GitHub Desktop（5分钟）

### 1.1 下载
1. **访问** https://desktop.github.com
2. **点击** "Download for Windows"
3. **等待下载完成**

### 1.2 安装
1. **双击** 下载的文件 `GitHubDesktopSetup.exe`
2. **等待自动安装**（会自动完成，不需要点击任何按钮）
3. **安装完成后会自动打开 GitHub Desktop**

---

## 🔐 第2步：登录 GitHub（2分钟）

### 2.1 如果你已有 GitHub 账号

1. **在 GitHub Desktop 欢迎界面**
2. **点击** "Sign in to GitHub.com"
3. **在浏览器中登录** 你的 GitHub 账号
4. **点击** "Authorize desktop"
5. **返回 GitHub Desktop**，应该显示已登录

### 2.2 如果你还没有 GitHub 账号

1. **点击** "Create your free account"
2. **在浏览器中注册** GitHub 账号
3. **验证邮箱**
4. **返回 GitHub Desktop**
5. **点击** "Sign in to GitHub.com"
6. **授权**

---

## 📁 第3步：添加你的项目（2分钟）

### 3.1 添加本地仓库

1. **在 GitHub Desktop 中**
2. **点击** "File" → "Add local repository"
3. **点击** "Choose..." 按钮
4. **选择** `D:\blog` 文件夹
5. **点击** "选择文件夹"

### 3.2 初始化仓库（如果提示）

如果显示 "This directory does not appear to be a Git repository"：

1. **点击** "create a repository"
2. **在弹出窗口中：**
   - Name: `blog`（已自动填写）
   - Description: `双人博客系统`
   - **不要勾选** "Initialize this repository with a README"
   - Git ignore: `Node`
   - License: `None`
3. **点击** "Create repository"

---

## ☁️ 第4步：发布到 GitHub（2分钟）

### 4.1 提交更改

1. **在左下角看到所有文件列表**
2. **在 "Summary" 框中输入：** `Initial commit`
3. **点击** "Commit to main" 按钮

### 4.2 发布仓库

1. **点击顶部的** "Publish repository" 按钮
2. **在弹出窗口中：**
   - Name: `blog`
   - Description: `双人博客系统`
   - **取消勾选** "Keep this code private"（或保持勾选，都可以）
3. **点击** "Publish repository"
4. **等待上传完成**（可能需要1-2分钟）

### 4.3 验证上传成功

1. **点击** "Repository" → "View on GitHub"
2. **浏览器会打开** 你的 GitHub 仓库
3. **应该能看到** 所有项目文件

---

## 🚂 第5步：部署到 Railway（3分钟）

### 5.1 访问 Railway

1. **打开浏览器**
2. **访问** https://railway.app
3. **点击** "Login"

### 5.2 登录 Railway

**选择登录方式：**

**方式1: GitHub 登录（推荐）**
1. **点击** "Login with GitHub"
2. **授权** Railway 访问你的 GitHub
3. **完成登录**

**方式2: Google 登录**
1. **点击** "Login with Google"
2. **选择** 你的 Google 账号
3. **完成登录**

**方式3: Email 登录**
1. **点击** "Login with Email"
2. **输入** 邮箱
3. **查收** 验证邮件
4. **点击** 邮件中的链接

### 5.3 创建新项目

1. **登录后，点击** "New Project"
2. **选择** "Deploy from GitHub repo"
3. **如果是第一次，需要授权：**
   - 点击 "Configure GitHub App"
   - 选择 "All repositories" 或 "Only select repositories"
   - 如果选择后者，勾选 `blog` 仓库
   - 点击 "Install & Authorize"
4. **返回 Railway，刷新页面**
5. **再次点击** "Deploy from GitHub repo"
6. **选择** 你的 `blog` 仓库

### 5.4 等待部署

1. **Railway 会自动开始部署**
2. **你会看到部署日志滚动**
3. **等待显示** "Success" ✅（大约1-2分钟）

---

## 🌐 第6步：获取域名（1分钟）

### 6.1 生成域名

1. **部署成功后，点击** 你的项目（如果不在项目页面）
2. **点击** "Settings" 标签
3. **向下滚动找到** "Domains" 部分
4. **点击** "Generate Domain" 按钮
5. **等待几秒**，域名会自动生成

### 6.2 复制域名

1. **域名格式类似：** `blog-production-xxxx.up.railway.app`
2. **点击域名旁边的复制图标** 📋
3. **或者手动复制域名**

---

## ✅ 第7步：测试你的网站（2分钟）

### 7.1 访问网站

1. **在浏览器中打开** 你的 Railway 域名
2. **应该看到** 你的博客首页
3. **如果看到错误页面**，等待1-2分钟再试（服务器可能还在启动）

### 7.2 测试功能

1. **点击** 登录按钮（♂♀）
2. **选择** 男性或女性
3. **输入密码**：
   - 男性：`sr`
   - 女性：`nxz`
4. **登录成功后，测试发布：**
   - 发布一条碎碎念
   - 发布一篇文章
   - 上传一个相册

### 7.3 如果发布失败

**按 F12 打开控制台，查看错误信息，然后：**

1. **回到 Railway 控制台**
2. **点击** "Deployments" 标签
3. **点击** 最新的部署
4. **查看** "Deploy Logs"
5. **找到错误信息**

---

## 🔄 第8步：更新代码（以后使用）

### 当你修改代码后：

1. **打开 GitHub Desktop**
2. **会自动显示** 所有修改的文件
3. **在 Summary 框输入：** 描述你的修改（如 "修复bug"）
4. **点击** "Commit to main"
5. **点击** "Push origin"
6. **Railway 会自动检测并重新部署**（1-2分钟）

---

## 📊 Railway 控制台功能

### 查看日志
1. **点击** 你的项目
2. **点击** "Deployments"
3. **点击** 最新的部署
4. **查看** "Deploy Logs" 或 "Build Logs"

### 查看环境变量
1. **点击** "Variables" 标签
2. **可以添加** 自定义环境变量

### 重新部署
1. **点击** "Deployments"
2. **点击** 最新部署右侧的 "..." 菜单
3. **选择** "Redeploy"

---

## 🆘 常见问题

### 问题1: GitHub Desktop 无法登录
**解决：**
- 检查网络连接
- 尝试使用浏览器登录 GitHub
- 重启 GitHub Desktop

### 问题2: 上传到 GitHub 失败
**解决：**
- 检查文件大小（单个文件不超过100MB）
- 检查网络连接
- 尝试重新发布

### 问题3: Railway 部署失败
**解决：**
1. 查看 Deploy Logs
2. 常见错误：
   - 端口配置：确保使用 `process.env.PORT`
   - 依赖安装：检查 package.json
   - 启动命令：确保 start 脚本正确

### 问题4: 网站无法访问
**解决：**
- 等待1-2分钟（服务器启动需要时间）
- 检查域名是否正确
- 查看 Railway 日志是否有错误

### 问题5: 发布内容失败
**解决：**
- 按 F12 查看浏览器控制台错误
- 检查 API 地址是否正确
- 查看 Railway 日志

---

## 🎉 完成！

恭喜！你的博客已经成功部署到 Railway！

**你现在可以：**
- ✅ 通过 Railway 域名访问博客
- ✅ 发布碎碎念、文章、相册
- ✅ 随时修改代码并自动部署
- ✅ 分享给朋友使用

**下一步：**
- 修改默认密码（在 `public/script.js` 中）
- 自定义域名（在 Railway Settings 中）
- 定期备份数据

---

## 📞 需要帮助？

如果遇到任何问题：
1. 查看 Railway Deploy Logs
2. 查看浏览器 Console 错误
3. 告诉我具体的错误信息

**祝你使用愉快！** 🎊
