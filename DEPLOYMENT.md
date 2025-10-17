# HN Scout - Deployment Guide

## Quick Deploy to Vercel

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial HN Scout implementation"
git branch -M main
git remote add origin https://github.com/yourusername/hn-scout.git
git push -u origin main
```

2. **Deploy on Vercel**
- Visit [vercel.com](https://vercel.com) and sign in
- Click "New Project"
- Import your GitHub repository
- Vercel will auto-detect Next.js and deploy!

## Environment Setup (if needed)
No environment variables are required for the basic functionality since we're using the public Hacker News API.

## Live Demo
After deployment, your app will be available at: `https://your-project-name.vercel.app`

## Custom Domain (Optional)
In Vercel dashboard:
1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Performance Monitoring
- Enable Vercel Analytics in your project settings
- Monitor Core Web Vitals and user experience metrics
- Set up alerts for performance degradation

That's it! Your HN Scout app is now live and accessible to users worldwide! 🚀