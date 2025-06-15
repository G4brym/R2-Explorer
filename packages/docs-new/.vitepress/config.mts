import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "workers-qb",
  text: "Zero dependencies Query Builder for Cloudflare Workers",
  cleanUrls: true,
  head: [['link', {rel: 'icon', type: "image/png", href: 'https://raw.githubusercontent.com/G4brym/workers-qb/refs/heads/main/docs/assets/logo-icon.png'}]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'https://raw.githubusercontent.com/G4brym/workers-qb/refs/heads/main/docs/assets/logo-icon.png',
    outline: [2, 3],
    nav: [
      {text: 'Home', link: '/'},
      {text: 'Docs', link: '/introduction'}
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          {text: 'Introduction', link: '/introduction'},
          {text: 'Basic Queries', link: '/basic-queries'},
          {text: 'Advanced Queries', link: '/advanced-queries'},
          {text: 'Migrations', link: '/migrations'},
          {text: 'Type Checking', link: '/type-check'},
        ]
      },
      {
        text: 'Databases',
        items: [
          {text: 'D1', link: '/databases/d1'},
          {text: 'Durable Objects', link: '/databases/do'},
          {text: 'PostgreSQL', link: '/databases/postgresql'},
          {text: 'Bring your own', link: '/databases/byodb'},
        ]
      },
    ],
    socialLinks: [
      {icon: 'github', link: 'https://github.com/G4brym/R2-Explorer'},
      {icon: 'x', link: 'https://x.com/G4brym'}
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Gabriel Massadas'
    }
  }
})



export default {
  // site-level options
  title: 'R2 Explorer',
  description: 'A Google Drive Interface for your Cloudflare R2 Buckets',
  head: [['link', { rel: 'icon', href: '/assets/logo.svg' }]],

  themeConfig: {
    // theme-level options
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started/creating-a-new-project' },
      { text: 'Email Explorer', link: '/guides/setup-email-explorer/' },
      { text: 'Live Demo', link: 'https://demo.r2explorer.com/' },
    ],
    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Creating a New Project', link: '/getting-started/creating-a-new-project' },
            { text: 'Add R2 Buckets', link: '/getting-started/add-r2-buckets' },
            { text: 'Configuration', link: '/getting-started/configuration' },
            { text: 'Security', link: '/getting-started/security' },
            { text: 'Deploying', link: '/getting-started/deploying' },
            { text: 'Updating Your Project', link: '/getting-started/updating-your-project' }
          ]
        },
        {
          text: 'Guides',
          items: [
            { text: 'Setup Email Explorer', link: '/guides/setup-email-explorer' },
            { text: 'Migrating to 1.0', link: '/guides/migrating-to-1.0' },
            { text: 'Migrating to 1.1', link: '/guides/migrating-to-1.1' }
          ]
        }
      ],
      // Fallback for other sections if needed, or a general sidebar
      '/guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'Setup Email Explorer', link: '/guides/setup-email-explorer' },
            { text: 'Migrating to 1.0', link: '/guides/migrating-to-1.0' },
            { text: 'Migrating to 1.1', link: '/guides/migrating-to-1.1' }
          ]
        }
      ]
    },
    logo: '/assets/logo.svg', // Assuming assets will be in public/assets
    socialLinks: [
      { icon: 'github', link: 'https://github.com/G4brym/R2-Explorer' }
    ],
    editLink: {
      pattern: 'https://github.com/G4brym/R2-Explorer/edit/main/packages/docs-new/:path',
      text: 'Edit this page on GitHub'
    }
  }
}
