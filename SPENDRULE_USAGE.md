# SpendRule Document Management System - User Guide

## Overview

The SpendRule Document Management System provides a secure, Google Drive-like interface for healthcare organizations to upload, organize, and manage contracts, invoices, and workflow diagrams.

## Getting Started

### Login
1. Navigate to your SpendRule deployment URL
2. Enter your credentials:
   - **Henry Ford Health**: Username `henryford_user`, Password `HF_Secure_2025`
   - **Administrators**: Username `spendrule_admin`, Password `Admin_2025`

### Interface Overview
- **Header**: Shows "SpendRule Document Manager" with health and safety icon
- **Sidebar**: Navigation and quick actions
- **Main Area**: File browser with drag-and-drop support
- **Breadcrumbs**: Shows your current location in the folder structure

## Auto-Organization System

### How It Works
When you upload files, the system automatically detects the document type based on the filename and suggests the appropriate folder:

### Document Categories

#### 📄 Contracts
**Folder**: `contracts/`  
**Keywords**: contract, agreement, msa, sow  
**Examples**:
- `Henry_Ford_MSA_2024.pdf` → `henry_ford/contracts/`
- `Vendor_Service_Agreement.docx` → `henry_ford/contracts/`

#### 🧾 Invoices  
**Folder**: `invoices/`  
**Keywords**: invoice, inv, bill, statement  
**Examples**:
- `March_2024_Invoice.pdf` → `henry_ford/invoices/`
- `Medical_Equipment_Bill.xlsx` → `henry_ford/invoices/`

#### 🔄 Workflows
**Folder**: `workflows/`  
**Keywords**: workflow, process, diagram, flow  
**Examples**:
- `Patient_Care_Workflow.pdf` → `henry_ford/workflows/`
- `Approval_Process_Diagram.vsd` → `henry_ford/workflows/`

#### 📁 Other
**Folder**: `other/`  
**Files**: Everything else  
**Examples**:
- `Meeting_Notes.docx` → `henry_ford/other/`
- `Presentation.pptx` → `henry_ford/other/`

## File Operations

### Uploading Files

#### Method 1: Drag and Drop
1. Simply drag files from your computer into the main area
2. The system will show an auto-organization hint
3. Choose to upload to the suggested location or override

#### Method 2: Click to Upload
1. Click the upload button in the interface
2. Select files from your computer
3. Follow the auto-organization prompts

### Upload Process
1. **Analysis**: System detects document type from filename
2. **Suggestion**: Shows recommended folder location
3. **Confirmation**: You can accept suggestion or choose different location
4. **Upload**: File is uploaded with metadata tracking
5. **Confirmation**: Success message with final location

### Viewing Files
- **Click once**: Select file to see details
- **Double-click**: Open file for preview
- **Right-click**: Access context menu with options

### Supported File Types

#### Fully Supported (In-browser preview)
- **PDFs**: Full preview and navigation
- **Images**: PNG, JPG, JPEG, GIF, BMP, WebP
- **Text Files**: TXT, MD, CSV, JSON, HTML
- **Documents**: Basic text content preview

#### Partially Supported (Download to view)
- **Visio Files**: VSD, VSDX, VSDM (download button provided)
- **Office Files**: DOCX, XLSX, PPTX (download to view)
- **Archive Files**: ZIP, RAR (download to extract)

## Folder Management

### Creating Subfolders
You can create custom subfolders within each category to organize by vendor:

**Example Organization**:
```
henry_ford/
├── contracts/
│   ├── Epic_Systems/
│   ├── Cerner/
│   └── Medical_Devices_Inc/
├── invoices/
│   ├── Pharmacy_Vendors/
│   ├── Equipment_Suppliers/
│   └── Service_Providers/
├── workflows/
│   ├── Patient_Care/
│   ├── Administrative/
│   └── Quality_Assurance/
└── other/
    ├── Policies/
    ├── Training/
    └── Meetings/
```

### Creating Folders
1. Right-click in the main area
2. Select "Create Folder"
3. Enter folder name
4. Click "Create"

## File Management

### Renaming Files
1. Right-click on file
2. Select "Rename"
3. Enter new name
4. Click "Save"

### Moving Files
1. Right-click on file
2. Select "Move"
3. Choose destination folder
4. Click "Move"

### Deleting Files
1. Right-click on file
2. Select "Delete"
3. Confirm deletion
4. File is permanently removed

### File Metadata
Each file includes metadata:
- **Health Group**: Your organization (e.g., henry_ford)
- **Document Type**: contracts, invoices, workflows, other
- **Upload Date**: When file was added
- **File Size**: Size in MB/KB
- **Original Filename**: Preserves original name

## Security and Access Control

### Health Group Isolation
- **Henry Ford Users**: Can only see files in `henry_ford/` folder
- **Other Health Groups**: Each group has isolated access to their folder
- **Administrators**: Can view all health group folders

### File Privacy
- Files are stored in Cloudflare R2 with enterprise-grade security
- Access requires authentication
- All transfers use HTTPS encryption
- Files are not publicly accessible

## Best Practices

### File Naming
- Use descriptive names that include keywords for auto-categorization
- Include dates when relevant: `Invoice_March_2024.pdf`
- Avoid special characters: `< > : " / \ | ? *`
- Use underscores or hyphens instead of spaces

### Organization Tips
1. **Use Subfolders**: Create vendor-specific subfolders within each category
2. **Consistent Naming**: Develop naming conventions for your organization
3. **Regular Cleanup**: Periodically review and organize files
4. **Check Auto-categorization**: Verify files are in correct categories

### Workflow Diagrams
- Supported formats: PDF, PNG, JPG, Visio files
- For complex diagrams, consider PDF format for best compatibility
- Include "workflow", "process", or "diagram" in filename for auto-categorization

## Troubleshooting

### Common Issues

#### Upload Problems
- **File too large**: Maximum file size is 200MB
- **Network issues**: Check internet connection
- **Browser issues**: Try refreshing the page

#### Access Issues
- **Can't see files**: Verify you're in the correct health group folder
- **Login problems**: Check username/password with administrator

#### Preview Issues
- **File won't preview**: Some file types require download to view
- **Slow loading**: Large files may take time to load
- **Browser compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)

### Getting Help
1. **Check Error Messages**: Read any error messages carefully
2. **Try Browser Refresh**: Simple refresh often resolves issues
3. **Contact Administrator**: Reach out to your system administrator
4. **Document Issues**: Note exactly what you were doing when problems occurred

## Tips for Efficient Use

### Power User Features
- **Keyboard Shortcuts**: Use standard browser shortcuts for navigation
- **Bulk Operations**: Select multiple files for batch operations
- **Search**: Use browser search (Ctrl+F) to find files quickly
- **Bookmarks**: Bookmark frequently used folders

### Mobile Access
- The system works on mobile devices
- Upload from mobile camera or gallery
- Touch-friendly interface for tablets
- Responsive design adapts to screen size

### Integration Ideas
- **Email Integration**: Save email attachments directly to appropriate folders
- **Scanner Apps**: Use mobile scanning apps to create PDFs
- **Version Control**: Use consistent naming for document versions
- **Backup Strategy**: Regularly download important documents for local backup

## Advanced Features

### Batch Upload
- Select multiple files at once
- All files will be auto-categorized
- Progress tracking for large uploads

### File Search
- Use browser search to find files
- Search by filename, folder, or date
- Filter by document type

### Download Options
- Individual file download
- Folder download (where supported)
- Bulk download for multiple selections

This user guide covers all major features of the SpendRule Document Management System. For additional support or questions about specific use cases, contact your system administrator.