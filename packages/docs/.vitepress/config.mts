import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'R2 Explorer',
  description: 'A Google Drive Interface for your Cloudflare R2 Buckets',
  head: [['link', { rel: 'icon', href: '/assets/logo.svg' }]],
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/assets/logo.svg', // Assuming assets will be in public/assets
    outline: [2, 3],
        nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started/creating-a-new-project' },
      { text: 'Email Explorer', link: '/guides/setup-email-explorer/' },
      { text: 'Live Demo', link: 'https://demo.r2explorer.com/' },
    ],
    sidebar:  [
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
          ]
        }
      ],
    socialLinks: [
      {icon: 'github', link: 'https://github.com/G4brym/R2-Explorer'},
      {icon: 'x', link: 'https://x.com/G4brym'}
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Gabriel Massadas'
    },
    editLink: {
      pattern: 'https://github.com/G4brym/R2-Explorer/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
