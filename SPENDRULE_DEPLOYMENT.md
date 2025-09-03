# SpendRule Document Management System - Deployment Guide

## Overview

The SpendRule Document Management System is built on the R2-Explorer framework and provides a secure, healthcare-focused document management solution with auto-categorization and health group isolation.

## Prerequisites

- Cloudflare account with:
  - R2 storage enabled
  - Workers & Pages enabled
- Node.js 18+ and pnpm installed
- Git repository access

## Step 1: Clone and Setup Repository

```bash
# Fork or clone the R2-Explorer repository
git clone https://github.com/your-username/R2-Explorer.git
cd R2-Explorer

# Install dependencies
pnpm install
```

## Step 2: Create R2 Bucket

1. Log into Cloudflare Dashboard
2. Go to R2 Object Storage
3. Create a new bucket named `secure-uploads`
4. Note your Account ID and R2 Token

## Step 3: Configure Environment

```bash
# Copy the wrangler configuration
cp wrangler.toml.example wrangler.toml

# Update wrangler.toml with your settings:
# - Account ID
# - Bucket bindings
```

## Step 4: Deploy Worker

```bash
# Build the worker
pnpm build-worker

# Deploy to Cloudflare Workers
cd packages/worker/dev
pnpm deploy
```

## Step 5: Deploy Dashboard

```bash
# Build the dashboard
pnpm build-dashboard

# Deploy to Cloudflare Pages
cd packages/dashboard
pnpm deploy
```

## Step 6: Create Initial Folder Structure

After deployment, use the admin account to create the initial folder structure:

1. Login with: `spendrule_admin` / `Admin_2025`
2. Navigate to the `secure-uploads` bucket
3. Create the following folders:
   ```
   henry_ford/
   henry_ford/contracts/
   henry_ford/invoices/
   henry_ford/workflows/
   henry_ford/other/
   ```

## Step 7: Test the System

1. **Admin Test**: Login with admin credentials and verify you can see all folders
2. **Henry Ford Test**: Login with `henryford_user` / `HF_Secure_2025` and verify:
   - You only see the `henry_ford/` folder
   - You can upload files
   - Files are auto-categorized correctly

## Authentication Configuration

The system is configured with these users:

### Health Group Users
- **Username**: `henryford_user`
- **Password**: `HF_Secure_2025`
- **Access**: Only `henry_ford/` folder and subfolders

### Admin Users  
- **Username**: `spendrule_admin`
- **Password**: `Admin_2025`
- **Access**: Full system access, can see all health groups

## Adding New Health Groups

To add a new health group (e.g., "mayo_clinic"):

1. **Update Worker Configuration** (`packages/worker/dev/index.ts`):
   ```javascript
   basicAuth: [
     // ... existing users ...
     {
       username: "mayoclinic_user",
       password: "Mayo_Secure_2025",
     },
   ]
   ```

2. **Update Health Group Mapping** (`packages/worker/src/foundation/middlewares/healthGroupIsolation.ts`):
   ```javascript
   const healthGroupMapping: Record<string, string> = {
     henryford_user: "henry_ford",
     mayoclinic_user: "mayo_clinic", // Add this line
   };
   ```

3. **Create Folder Structure**:
   - Login as admin
   - Create folders: `mayo_clinic/contracts/`, `mayo_clinic/invoices/`, `mayo_clinic/workflows/`, `mayo_clinic/other/`

4. **Redeploy**:
   ```bash
   pnpm build-worker
   cd packages/worker/dev && pnpm deploy
   ```

## Security Features

- **Health Group Isolation**: Users can only access their designated folder
- **Basic Authentication**: Secure login with username/password
- **Auto-categorization**: Prevents files from being placed in wrong categories
- **Cloudflare Infrastructure**: Enterprise-grade security and performance

## Monitoring and Maintenance

### View Logs
```bash
wrangler tail
```

### Update System
```bash
git pull origin main
pnpm install
pnpm build
# Deploy both worker and dashboard
```

### Backup Data
R2 data is automatically replicated by Cloudflare, but consider:
- Regular exports of important documents
- Database backups if using additional storage

## Troubleshooting

### Common Issues

1. **Login Issues**: 
   - Verify credentials in `packages/worker/dev/index.ts`
   - Check browser network tab for 401 errors

2. **Upload Issues**:
   - Verify R2 bucket permissions
   - Check worker logs for errors

3. **Access Denied**:
   - Verify health group mapping is correct
   - Ensure user is trying to access correct folder

### Support

- Check worker logs: `wrangler tail`
- Review browser console for frontend issues
- Verify R2 bucket permissions and bindings

## Production Considerations

### Security Enhancements
- Use Cloudflare Access for additional authentication layers
- Enable Cloudflare Bot Management
- Configure rate limiting

### Performance Optimization
- Enable Cloudflare caching for static assets
- Use Cloudflare Images for image optimization
- Configure R2 custom domains

### Compliance
- Enable audit logging
- Configure data retention policies
- Implement backup procedures

## Cost Optimization

- R2 storage: $0.015/GB/month
- Worker requests: 100,000 free, then $0.50/million
- Pages hosting: Free tier available
- Estimated cost for typical healthcare deployment: $10-50/month