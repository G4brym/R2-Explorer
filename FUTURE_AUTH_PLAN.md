# Future Authentication & Authorization Plan

## Current State (Manual Approach)

Currently, adding a new health group requires manual code changes in 2 places:

1. **Add user credentials** in `packages/worker/dev/index.ts` (basicAuth array)
2. **Add health group mapping** in `packages/worker/src/foundation/middlewares/healthGroupIsolation.ts` (healthGroupMapping object)

This works but doesn't scale well as we add more health groups.

---

## Option A: Configuration-Based Approach (Simpler)

### Overview
Move credentials and mappings to environment variables or KV storage instead of hardcoded values.

### Implementation Steps

1. **Create KV Namespace for User Management**
   ```bash
   wrangler kv:namespace create "SPENDRULE_USERS"
   ```

2. **Store User Data in KV**
   ```json
   {
     "username": "endeavor_user",
     "password_hash": "bcrypt_hashed_password",
     "health_group": "endeavor",
     "role": "user",
     "created_at": "2025-10-02T00:00:00Z"
   }
   ```

3. **Update Authentication Middleware**
   - Replace hardcoded basicAuth array with KV lookup
   - Hash passwords using bcrypt or similar
   - Cache user data for performance

4. **Create Admin CLI Tool**
   ```bash
   npm run admin:add-user -- --username endeavor_user --password xxx --group endeavor
   npm run admin:list-users
   npm run admin:delete-user -- --username test_user
   ```

### Pros
- No code changes needed for new health groups
- Secure password hashing
- Easy to manage via CLI
- Works with existing architecture

### Cons
- Still manual CLI operations
- No web UI for management
- Passwords stored in KV (even if hashed)

### Estimated Time: 4-6 hours

---

## Option B: External Auth Service (Most Scalable)

### Overview
Use a dedicated authentication service like Auth0, Clerk, or WorkOS to manage users and permissions.

### Recommended Services

#### 1. **Auth0** (Enterprise-focused)
- Built-in RBAC (Role-Based Access Control)
- Healthcare compliance features (HIPAA-ready with Enterprise plan)
- SSO support for hospitals
- Good for multi-tenant architecture

#### 2. **Clerk** (Developer-friendly)
- Modern API and good DX
- Organization/tenant support built-in
- Easy to add health group metadata
- Generous free tier

#### 3. **WorkOS** (B2B-focused)
- Built for multi-tenant SaaS
- Enterprise SSO (SAML, OKTA)
- Directory sync (SCIM)
- Best for hospitals with existing SSO

### Implementation Steps

1. **Choose and Set Up Auth Provider**
   - Create account and configure application
   - Set up organizations (one per health group)
   - Configure RBAC roles (user, admin)

2. **Update Worker Authentication**
   ```typescript
   // Replace basicAuth middleware with JWT verification
   app.use("/api/*", async (c, next) => {
     const token = c.req.header("Authorization")?.replace("Bearer ", "");
     const user = await verifyAuthToken(token, c.env.AUTH_SECRET);
     c.set("authentication_username", user.username);
     c.set("user_health_group", user.organization);
     await next();
   });
   ```

3. **Update Dashboard**
   - Add Auth provider SDK
   - Replace basic auth login with OAuth flow
   - Handle token refresh and session management

4. **Create Admin Interface**
   - Build admin dashboard to manage health groups
   - Invite users with email
   - Assign health group permissions
   - View audit logs

### Pros
- No user management code to maintain
- Professional auth UX (SSO, MFA, etc.)
- Audit logs and compliance features
- Easy to add new health groups via UI
- Can integrate with hospital SSO systems

### Cons
- Additional monthly cost ($25-100/month for low volume)
- External dependency
- More complex initial setup

### Estimated Time: 8-12 hours + learning curve

---

## Option C: Custom Admin Portal (Middle Ground)

### Overview
Build a simple admin portal within the existing application using KV for storage.

### Implementation Steps

1. **Create Admin-Only Endpoints**
   ```typescript
   // POST /api/admin/users - Create new user
   // GET /api/admin/users - List all users
   // DELETE /api/admin/users/:username - Delete user
   // POST /api/admin/health-groups - Create health group
   ```

2. **Build Admin Dashboard UI**
   - Add new route `/admin` in Vue dashboard
   - Form to add users with username/password/health group
   - List of existing users with delete action
   - Health group management

3. **Store in KV with Encryption**
   ```typescript
   // Use Web Crypto API to encrypt passwords
   const passwordHash = await crypto.subtle.digest(
     "SHA-256",
     new TextEncoder().encode(password + salt)
   );
   ```

4. **Auto-Create Folder Structure**
   - When adding health group, automatically create:
     - `{health_group}/contracts/`
     - `{health_group}/invoices/`
     - `{health_group}/workflows/`
     - `{health_group}/other/`

### Pros
- Self-contained (no external services)
- Custom to your exact needs
- Web UI for ease of use
- No ongoing costs

### Cons
- You maintain security code
- Basic auth still (no SSO/MFA)
- More code to maintain

### Estimated Time: 6-10 hours

---

## Recommendation

**For SpendRule's current stage:**

### Phase 1 (Now - Next 1-2 months): Option A (Config-Based)
- Quick to implement
- Solves immediate scaling issues
- Low risk, minimal code changes
- Cost: Free

### Phase 2 (When you have 5+ health groups): Option C (Admin Portal)
- Better UX for managing users
- Self-service for adding health groups
- Still no external dependencies
- Cost: Free

### Phase 3 (Enterprise/Scale): Option B (External Auth)
- When hospitals require SSO
- When compliance audits need enterprise auth features
- When managing 20+ health groups
- Cost: $50-200/month

---

## Next Steps (Recommended Order)

1. **Immediate (This week)**
   - ✅ Add Endeavor manually (done)
   - Test Endeavor user access
   - Document the manual process

2. **Short-term (Next 2 weeks) - Implement Option A**
   - Create KV namespace for users
   - Build CLI tool for user management
   - Migrate existing users to KV
   - Test and document

3. **Medium-term (1-2 months) - Add Option C**
   - Build admin UI in dashboard
   - Add user management endpoints
   - Add auto folder creation
   - Security review

4. **Long-term (3-6 months) - Evaluate Option B**
   - Research auth providers (Auth0, Clerk, WorkOS)
   - Calculate ROI based on health group count
   - Plan migration if beneficial

---

## Security Considerations

### Current State
- ⚠️ Passwords in code (even in private repo, not ideal)
- ⚠️ No password rotation mechanism
- ✅ Health group isolation working
- ✅ Basic auth over HTTPS

### Must-Haves for Any Solution
- ✅ Password hashing (bcrypt, argon2)
- ✅ HTTPS only (already enforced by Cloudflare)
- ✅ Health group isolation (already implemented)
- ✅ Audit logging (add to any solution)
- ✅ Password rotation capability
- ✅ Account lockout after failed attempts

### Nice-to-Haves for Enterprise
- SSO integration (SAML/OIDC)
- Multi-factor authentication (MFA)
- Session management
- IP allowlisting
- HIPAA compliance features

---

## Cost Analysis

| Solution | Initial Setup | Monthly Cost | Maintenance | Scalability |
|----------|--------------|--------------|-------------|-------------|
| **Option A: Config-Based** | 4-6 hours | $0 | Low | Medium |
| **Option B: External Auth** | 8-12 hours | $25-200 | Very Low | High |
| **Option C: Admin Portal** | 6-10 hours | $0 | Medium | Medium |

---

## Questions to Consider

1. **How many health groups do you expect in the next 6 months?**
   - < 5: Stay with current or Option A
   - 5-15: Option C
   - > 15: Option B

2. **Will hospitals require SSO integration?**
   - No: Option A or C
   - Yes: Option B (required)

3. **What's your compliance requirement level?**
   - Basic: Any option
   - HIPAA/Enterprise: Option B with enterprise plan

4. **Budget for auth services?**
   - $0: Option A or C
   - $50-200/month: Option B

---

## Implementation Checklist

When you're ready to implement any option:

- [ ] Choose the option based on requirements
- [ ] Set up development environment
- [ ] Implement authentication changes
- [ ] Add comprehensive tests
- [ ] Security review and penetration testing
- [ ] Documentation for admins
- [ ] Migration plan for existing users
- [ ] Rollback plan
- [ ] Deploy to staging first
- [ ] Monitor for issues
- [ ] Deploy to production

---

**Created:** 2025-10-02
**Status:** Planning Document
**Next Review:** After adding 2-3 more health groups
