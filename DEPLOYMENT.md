# 🚀 NeighborConnect Deployment Guide

This guide will help you deploy your NeighborConnect messaging app to the cloud. I've set up your app to work with multiple deployment platforms.

## 📋 Prerequisites

- Node.js installed locally
- Git repository (your code should be in a Git repo)
- Account on your chosen deployment platform

## 🎯 Recommended Deployment Platforms

### 1. **Railway** (Recommended) ⭐
**Best for:** Full-stack apps with databases
- ✅ Built-in PostgreSQL database
- ✅ Automatic deployments from Git
- ✅ Free tier available
- ✅ Easy environment variable management

### 2. **Render**
**Best for:** Simple deployments
- ✅ Free tier available
- ✅ Automatic deployments
- ⚠️ Need external database (PostgreSQL)

### 3. **Vercel**
**Best for:** Frontend-focused apps
- ✅ Excellent performance
- ⚠️ Limited for Socket.IO apps
- ⚠️ Need external database

## 🚀 Deployment Steps

### Option 1: Railway (Recommended)

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy your app**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your NeighborConnect repository
   - Railway will automatically detect it's a Node.js app

3. **Add PostgreSQL Database**
   - In your project dashboard, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically set the `DATABASE_URL` environment variable

4. **Set Environment Variables**
   - Go to your app's "Variables" tab
   - Add these variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-super-secret-jwt-key-here
     ```
   - Railway automatically provides `DATABASE_URL`

5. **Deploy**
   - Railway will automatically deploy when you push to your main branch
   - Your app will be available at `https://your-app-name.railway.app`

### Option 2: Render

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create a Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Build Command:** `npm install`
     - **Start Command:** `node server.js`
     - **Environment:** Node

3. **Add PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Note the connection details

4. **Set Environment Variables**
   - In your web service settings, go to "Environment"
   - Add:
     ```
     NODE_ENV=production
     DATABASE_URL=postgresql://username:password@host:port/database
     JWT_SECRET=your-super-secret-jwt-key-here
     ```

5. **Deploy**
   - Render will automatically deploy
   - Your app will be available at `https://your-app-name.onrender.com`

### Option 3: Vercel

⚠️ **Note:** Vercel has limitations with Socket.IO and databases. Consider Railway or Render instead.

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set up external database** (required)
   - Use Railway PostgreSQL or Supabase
   - Set `DATABASE_URL` environment variable

## 🔧 Local Development

To test your app locally with the new database setup:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **For local development (SQLite)**
   ```bash
   npm run dev
   ```

3. **For production testing (PostgreSQL)**
   - Set up a local PostgreSQL database
   - Create a `.env` file with:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/neighborconnect
     NODE_ENV=production
     JWT_SECRET=your-secret-key
     ```
   - Run: `npm start`

## 🌐 Accessing Your Deployed App

Once deployed, your app will be available at:
- **Railway:** `https://your-app-name.railway.app`
- **Render:** `https://your-app-name.onrender.com`
- **Vercel:** `https://your-app-name.vercel.app`

## 🔍 Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Ensure `DATABASE_URL` is set correctly
   - Check if your database service is running

2. **Socket.IO Issues**
   - Make sure your platform supports WebSockets
   - Check CORS settings

3. **Build Failures**
   - Ensure all dependencies are in `package.json`
   - Check Node.js version compatibility

### Checking Logs:
- **Railway:** Project dashboard → "Deployments" → Click deployment → "View Logs"
- **Render:** Service dashboard → "Logs" tab
- **Vercel:** Project dashboard → "Functions" → View logs

## 📱 Testing Your Deployed App

1. **Health Check**
   - Visit `https://your-app-url/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Test Registration**
   - Go to your app URL
   - Try creating a new account

3. **Test Messaging**
   - Create two accounts
   - Start a conversation
   - Send messages between accounts

## 🔒 Security Notes

- **Never commit `.env` files** to Git
- **Use strong JWT secrets** in production
- **Enable HTTPS** (most platforms do this automatically)
- **Set up proper CORS** for your domain

## 📈 Monitoring & Maintenance

- **Railway:** Built-in monitoring dashboard
- **Render:** Service metrics in dashboard
- **Vercel:** Analytics in project dashboard

## 🆘 Need Help?

If you run into issues:
1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Test locally first
4. Check the platform's documentation

---

**🎉 Congratulations!** Your NeighborConnect app should now be live on the internet!
