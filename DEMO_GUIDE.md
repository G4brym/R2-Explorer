# SpendRule Document Management System - Demo Guide

## Demo Credentials

### Henry Ford Health User
- **Username**: `henryford_user`
- **Password**: `HF_Secure_2025`
- **Access**: Henry Ford documents only (henry_ford/ folder)

### Admin User  
- **Username**: `spendrule_admin`
- **Password**: `Admin_2025`
- **Access**: Full system access, all health groups

## Demo Features

### 1. Auto-Organization 
Upload files with these keywords to see automatic categorization:
- **Invoices**: "invoice", "bill", "statement" → Goes to `invoices/` folder
- **Contracts**: "contract", "agreement", "msa" → Goes to `contracts/` folder  
- **Workflows**: "workflow", "process", "diagram" → Goes to `workflows/` folder
- **Other**: Everything else → Goes to `other/` folder

### 2. File Operations
- **Upload**: Drag & drop or click to upload files
- **Preview**: Click files to preview (PDFs, images, text)
- **Download**: Right-click context menu or download button
- **Rename**: Right-click → Rename
- **Delete**: Right-click → Delete
- **Move**: Drag files between folders

### 3. View Modes
- **Folder View**: Navigate through organized folders (default)
- **Show All Files**: Click button to see all files at once (Google Drive style)

### 4. Search & Filter
- Search files by name
- Filter by file type
- Sort by date, size, name

## Sample Test Files

Try uploading files with these names to test auto-categorization:
- `Henry Ford Invoice March 2024.pdf`
- `Service Agreement HF 2024.pdf` 
- `Patient Workflow Diagram.pdf`
- `Lab Results Report.pdf`

## Health Group Isolation Demo

1. **Login as `henryford_user`**:
   - Can only see/access `henry_ford/` folder
   - Cannot access other health groups
   - Files auto-organize within their folder

2. **Login as `spendrule_admin`**:
   - Full access to all folders
   - Can manage files across health groups
   - Can add new health groups

## Production Features
- Secure Cloudflare R2 storage
- Scalable architecture
- Mobile responsive design
- Dark/light mode toggle
- Bulk file operations
- Advanced permissions system

Contact for production deployment and additional health group setup.