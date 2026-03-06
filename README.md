# 海洋防御战 (Ocean Defense)

一个基于 React + Vite + Tailwind CSS 开发的海洋防御射击游戏。

## 部署到 GitHub & Vercel 指南

### 1. 上传到 GitHub
1. 在 GitHub 上创建一个新的仓库。
2. 在本地终端执行以下命令（如果您已经在本地）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <您的仓库地址>
   git push -u origin main
   ```

### 2. 部署到 Vercel
1. 登录 [Vercel](https://vercel.com/)。
2. 点击 **"Add New"** -> **"Project"**。
3. 导入您刚刚创建的 GitHub 仓库。
4. **关键步骤：配置环境变量**
   - 在 "Environment Variables" 部分，添加 `GEMINI_API_KEY`。
   - 值为您在 Google AI Studio 获得的 API Key。
5. 点击 **"Deploy"**。

## 技术栈
- **Frontend**: React 19, Vite, Tailwind CSS
- **Animation**: Canvas API, Motion
- **Icons**: Lucide React

## 游戏特性
- 实时物理模拟
- 动态天气与昼夜系统
- 智能敌机 AI
- 升级系统与多种防御塔
