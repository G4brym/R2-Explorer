---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "R2 Explorer"
  image: /assets/r2-explorer-logo.png
  tagline: A Google Drive Interface for your Cloudflare R2 Buckets!
  actions:
    - theme: brand
      text: Getting Started
      link: /getting-started/creating-a-new-project.md
    - theme: alt
      text: Features
      link: /#features

features:
  - title: 🔒 Secure Access Control
    details: Implement Basic Authentication or integrate with Cloudflare Access for robust security.
    link: /getting-started/security.md
  - title: 📁 Flexible R2 Bucket Management
    details: Configure and manage access to multiple R2 buckets with customizable bindings.
    link: /getting-started/add-r2-buckets.md
  - title: ✍️ Read/Write Operations
    details: Enable write operations for file uploads, folder creation, and modifications (default is readonly).
    link: /getting-started/configuration.md#disabling-readonly-mode
  - title: 📧 Integrated Email Explorer
    details: Receive, view, and manage emails via Cloudflare Email Routing, stored directly in R2.
    link: /guides/setup-email-explorer.md
  - title: ⚙️ Customizable Configuration
    details: Tailor R2 Explorer with options for CORS, caching, and specific feature settings.
    link: /getting-started/configuration.md
  - title: 🚀 Easy Deployment & Updates
    details: Deploy via GitHub Actions, CLI, or manual template, with custom domain support and update notifications.
    link: /getting-started/deploying.md
---
