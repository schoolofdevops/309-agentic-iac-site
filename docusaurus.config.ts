import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Agentic Infrastructure as Code',
  tagline: 'Plan, build, verify, and govern infrastructure changes with AI agents.',
  favicon: 'img/favicon.ico',

  url: 'https://schoolofdevops.github.io',
  baseUrl: '/309-agentic-iac-site/',
  organizationName: 'schoolofdevops',
  projectName: '309-agentic-iac',

  onBrokenLinks: 'throw',

  future: { v4: true, faster: true },

  i18n: { defaultLocale: 'en', locales: ['en'] },

  markdown: { mermaid: true, hooks: { onBrokenMarkdownLinks: 'warn' } },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    ['classic', {
      docs: { sidebarPath: './sidebars.ts', routeBasePath: 'docs' },
      blog: false,
      theme: { customCss: './src/css/custom.css' },
    } satisfies Preset.Options],
  ],

  themeConfig: {
    navbar: {
      title: 'Agentic Infrastructure as Code',
      items: [
        { type: 'docSidebar', sidebarId: 'courseSidebar', position: 'left', label: 'Course' },
        { href: 'https://github.com/schoolofdevops/309-agentic-iac', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        { title: 'Course', items: [{ label: 'Introduction', to: '/docs/intro' }] },
        { title: 'School of DevOps & AI', items: [
          { label: 'GitHub', href: 'https://github.com/schoolofdevops' },
        ]},
      ],
      copyright: `Copyright © ${new Date().getFullYear()} School of DevOps & AI. Built with Docusaurus.`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
};

export default config;
