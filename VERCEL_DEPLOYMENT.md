# Vercel Deployment Guide

## Prerequisites
- Supabase project set up with all SQL scripts run
- Environment variables ready
- Git repository initialized

## Step 1: Restructure Repository

### Option A: Run PowerShell Script (Recommended)
```powershell
cd "c:\Users\91982\Desktop\Phase 1.2"
.\restructure.ps1
```

### Option B: Manual Steps
1. Stop the dev server (Ctrl+C)
2. Move all files from `project-collabo-main/project-collabo-main/` to root
3. Delete `project-collabo-main/` folder
4. Delete `project-collabo-main.zip`
5. Delete root `node_modules/`
6. Run `npm install`

## Step 2: Verify Configuration Files

Check that these files exist in the root:
- ✅ `.gitignore` - Excludes node_modules, .env, dist
- ✅ `vercel.json` - SPA routing configuration
- ✅ `package.json` - Vite in dependencies (not devDependencies)
- ✅ `index.html` - Entry point
- ✅ `vite.config.ts` - Vite configuration
- ✅ `src/` - Source code folder

## Step 3: Clean Git History

```bash
# Remove node_modules from git tracking
git rm -r --cached node_modules

# Remove .zip file from git tracking
git rm --cached project-collabo-main.zip

# Add all changes
git add .

# Commit
git commit -m "Restructure for Vercel deployment"
```

## Step 4: Test Build Locally

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

If the build succeeds, you're ready for deployment!

## Step 5: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Method 2: Vercel Dashboard
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## Step 6: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 7: Deploy

Click "Deploy" and wait for the build to complete!

## Troubleshooting

### Build Fails
- Check that `vite` is in `dependencies` (not `devDependencies`)
- Verify all environment variables are set
- Check build logs for specific errors

### 404 on Refresh
- Ensure `vercel.json` exists with SPA routing configuration
- Redeploy after adding `vercel.json`

### Environment Variables Not Working
- Ensure they start with `VITE_`
- Redeploy after adding/changing variables
- Check they're set in Vercel Dashboard

## Post-Deployment Checklist

- [ ] Test login/registration
- [ ] Test project creation
- [ ] Test file uploads (ensure Supabase storage is set up)
- [ ] Test all pages (Profile, Portfolio, Dashboard)
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)

## Continuous Deployment

Once connected to Git:
1. Push changes to your repository
2. Vercel automatically builds and deploys
3. Preview deployments for pull requests

## Support

If you encounter issues:
- Check Vercel build logs
- Verify Supabase connection
- Ensure all SQL scripts were run
- Check browser console for errors

---

**Your app will be live at**: `https://your-project-name.vercel.app`
