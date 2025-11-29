# Sharable Links

Sharable Links allow you to create secure, public URLs for files stored in your R2 buckets. Share files with anyone without requiring them to authenticate or have access to your R2 Explorer instance.

![Sharable Links Overview](/assets/sharable-links.png)

## Overview

With Sharable Links, you can:

- **Share files publicly** - Generate a unique URL that works without authentication
- **Protect with passwords** - Optionally require a password to access shared files
- **Set expiration dates** - Configure when links automatically expire
- **Limit downloads** - Control how many times a file can be downloaded
- **Manage all links** - View and revoke active share links from the dashboard

## How It Works

When you create a sharable link:

1. R2 Explorer generates a unique 10-character share ID
2. Share metadata is stored in your R2 bucket under `.r2-explorer/sharable-links/`
3. A public URL is created: `https://your-domain.com/share/{shareId}`
4. Anyone with the link can access the file (subject to your security settings)

The actual file remains in your R2 bucket - the share link provides controlled, temporary access without moving or copying the file.

:::warning Cloudflare Access Users
If your R2 Explorer is protected by Cloudflare Access, you need to configure a bypass policy for share links to work publicly.

**Setup Steps:**

1. Go to your Cloudflare Zero Trust dashboard
2. Navigate to **Access** → **Applications**
3. Create a new **Self-hosted application** (or edit your existing R2 Explorer application)
4. In the application settings:
   - **Public hostname**: Your R2 Explorer domain
   - **Path**: `/share/*`
5. Create an access policy:
   - **Policy name**: "Bypass for Public Shares"
   - **Action**: **Bypass**
   - **Session duration**: No session

This ensures that `/share/*` endpoints are publicly accessible while keeping the rest of your R2 Explorer protected by Cloudflare Access.
:::

## Creating a Sharable Link

### From the Dashboard

1. **Right-click** on any file in your R2 Explorer interface
2. Select **"Share File"** from the context menu
3. Configure your share options:
   - **Expiration Time** (optional): Set when the link expires (in seconds)
   - **Password** (optional): Require a password to access the file
   - **Max Downloads** (optional): Limit how many times the file can be downloaded
4. Click **"Create Share Link"**
5. Copy the generated URL and share it

### Via API

Create a share link programmatically:

```bash
curl -X POST https://your-domain.com/api/buckets/{bucket}/{base64Key}/share \
  -H "Content-Type: application/json" \
  -d '{
    "expiresIn": 3600,
    "password": "secret123",
    "maxDownloads": 10
  }'
```

**Response:**
```json
{
  "shareId": "abc123xyz9",
  "shareUrl": "https://your-domain.com/share/abc123xyz9",
  "expiresAt": 1735574400000
}
```

## Share Options Explained

### Expiration Time

Control how long the share link remains valid:

- **Format**: Time in seconds (relative to creation time)
- **Example**: `3600` = 1 hour, `86400` = 24 hours
- **Default**: No expiration (link works indefinitely)

When a link expires, anyone attempting to access it receives a `410 Gone` response.

### Password Protection

Add an extra layer of security:

- **Format**: Plain text string (automatically hashed with SHA-256)
- **Access**: Users must provide `?password=yourpassword` in the URL
- **Security**: Passwords are never stored in plain text

**Example usage:**
```
https://your-domain.com/share/abc123xyz9?password=secret123
```

### Download Limits

Restrict how many times a file can be downloaded:

- **Format**: Integer number
- **Example**: `5` = file can be downloaded 5 times
- **Behavior**: After limit is reached, the link returns `403 Forbidden`
- **Tracking**: Download counter increments on each successful access

## Accessing a Shared File

### Without Password

Simply open the share URL in any browser:
```
https://your-domain.com/share/abc123xyz9
```

### With Password

Append the password as a query parameter:
```
https://your-domain.com/share/abc123xyz9?password=secret123
```

The browser will download the file directly with the original filename and content type preserved.

## Managing Share Links

### View All Active Links

From the dashboard:
1. Navigate to any bucket
2. Open the **Share Links Manager** (icon in the toolbar)
3. View all active shares for files in that bucket

Each entry shows:
- File name and path
- Share ID and URL
- Creation date
- Expiration status
- Password protection status
- Download count (if limited)

### Revoke a Share Link

To revoke access to a shared file:

1. Open the **Share Links Manager**
2. Find the link you want to revoke
3. Click the **Delete/Revoke** button

Or via API:
```bash
curl -X DELETE https://your-domain.com/api/buckets/{bucket}/share/{shareId}
```

When a link is revoked:
- The share metadata is deleted from R2
- The public URL immediately returns `404 Not Found`
- The original file remains untouched in your bucket

## API Reference

### Create Share Link

**Endpoint:** `POST /api/buckets/:bucket/:key/share`

**Request Body:**
```json
{
  "expiresIn": 3600,        // Optional: seconds until expiration
  "password": "string",      // Optional: password protection
  "maxDownloads": 10         // Optional: download limit
}
```

**Response:** `200 OK`
```json
{
  "shareId": "abc123xyz9",
  "shareUrl": "https://your-domain.com/share/abc123xyz9",
  "expiresAt": 1735574400000  // Optional: timestamp in ms
}
```

### Access Shared File

**Endpoint:** `GET /share/:shareId`

**Query Parameters:**
- `password` (optional): Required if share is password-protected

**Response:** `200 OK` - File download with original content-type

**Error Responses:**
- `401 Unauthorized` - Password required or incorrect
- `403 Forbidden` - Download limit exceeded
- `404 Not Found` - Share ID doesn't exist or was revoked
- `410 Gone` - Share link has expired

### List Share Links

**Endpoint:** `GET /api/buckets/:bucket/shares`

**Response:** `200 OK`
```json
{
  "shares": [
    {
      "shareId": "abc123xyz9",
      "shareUrl": "https://your-domain.com/share/abc123xyz9",
      "key": "documents/report.pdf",
      "createdAt": 1735570800000,
      "expiresAt": 1735574400000,
      "isExpired": false,
      "hasPassword": true,
      "maxDownloads": 10,
      "currentDownloads": 3
    }
  ]
}
```

### Delete Share Link

**Endpoint:** `DELETE /api/buckets/:bucket/share/:shareId`

**Response:** `200 OK`
```json
{
  "success": true
}
```

## Security Considerations

### Authentication Bypass

- Share links intentionally bypass authentication to allow public access
- The `/share/:shareId` endpoint does not require Basic Auth or Cloudflare Access
- Use passwords and expiration times for sensitive files

### Password Security

- Passwords are hashed with SHA-256 before storage
- Never stored in plain text in your R2 bucket
- Use strong passwords for sensitive files

### Storage Location

Share metadata is stored at:
```
.r2-explorer/sharable-links/{shareId}.json
```

This prefix is hidden from the dashboard UI by default.

### Best Practices

1. **Use expiration times** for temporary shares
2. **Enable password protection** for sensitive files
3. **Set download limits** to prevent abuse
4. **Regularly audit** active share links
5. **Revoke unused links** to minimize exposure

## Common Use Cases

### Temporary File Sharing

Share a file for 24 hours:
```json
{
  "expiresIn": 86400
}
```

### One-Time Download

Allow file to be downloaded only once:
```json
{
  "maxDownloads": 1
}
```

### Secure Client Delivery

Share with password and expiration:
```json
{
  "expiresIn": 3600,
  "password": "client-specific-password",
  "maxDownloads": 5
}
```

### Public Asset Hosting

Create permanent public links (no restrictions):
```json
{}
```

## Troubleshooting

### Link Returns 404

**Possible causes:**
- Share ID is incorrect
- Link was revoked/deleted
- File was deleted from R2 (but share metadata still exists)

**Solution:** Verify the share ID in the Share Links Manager

### Link Returns 401

**Possible causes:**
- Password is required but not provided
- Incorrect password supplied

**Solution:** Include `?password=your-password` in the URL

### Link Returns 410

**Cause:** Share link has expired

**Solution:** Create a new share link with updated expiration time

### Link Returns 403

**Cause:** Download limit exceeded

**Solution:** Either:
- Create a new share link with a higher limit
- Revoke and recreate the share to reset the counter

## Integration Examples

### Generate Share Link in JavaScript

```javascript
async function createShareLink(bucket, fileKey, options = {}) {
  const base64Key = btoa(fileKey);

  const response = await fetch(
    `https://your-domain.com/api/buckets/${bucket}/${base64Key}/share`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('username:password')
      },
      body: JSON.stringify(options)
    }
  );

  return await response.json();
}

// Usage
const share = await createShareLink('my-bucket', 'docs/report.pdf', {
  expiresIn: 3600,
  maxDownloads: 10
});
console.log('Share URL:', share.shareUrl);
```

### List All Shares in Python

```python
import requests
import base64

def list_shares(bucket, auth_username, auth_password):
    auth = base64.b64encode(
        f"{auth_username}:{auth_password}".encode()
    ).decode()

    response = requests.get(
        f"https://your-domain.com/api/buckets/{bucket}/shares",
        headers={"Authorization": f"Basic {auth}"}
    )

    return response.json()

# Usage
shares = list_shares('my-bucket', 'admin', 'secret')
for share in shares['shares']:
    print(f"{share['key']}: {share['shareUrl']}")
```

## Technical Details

### Share ID Generation

- 10 characters long
- Alphanumeric (a-z, A-Z, 0-9)
- Cryptographically random
- ~3.6 trillion possible combinations

### Metadata Storage Format

Share metadata JSON structure:
```json
{
  "shareId": "abc123xyz9",
  "bucket": "my-bucket",
  "key": "documents/report.pdf",
  "createdAt": 1735570800000,
  "expiresAt": 1735574400000,
  "passwordHash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "maxDownloads": 10,
  "currentDownloads": 0
}
```

### Performance

- Share link lookups scan all buckets to find the share metadata
- For optimal performance with many buckets, consider organizing shares
- Metadata files are small (~500 bytes) and cached by R2

## Limitations

- Share IDs must be unique across all buckets
- Maximum of 1 million share links per R2 account (R2 object limit per prefix)
- No built-in preview for shared files (direct download only)
- Download counter increments on request, not completed download

## Need Help?

- 📚 Full API Documentation: [API Reference](#api-reference)
- 💬 Ask questions: [GitHub Discussions](https://github.com/G4brym/R2-Explorer/discussions)
- 🐛 Report issues: [GitHub Issues](https://github.com/G4brym/R2-Explorer/issues)
