import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Settled Documentation',
  tagline: 'On-chain prediction markets for funding rates',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://docs.settled.pro',
  baseUrl: '/',

  organizationName: 'Zirodelta',
  projectName: 'docs',

  onBrokenLinks: 'throw',

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/img/apple-touch-icon.png',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#0a0a0a',
      },
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/Zirodelta/docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/og-docs.jpg',
    metadata: [
      { name: 'og:type', content: 'website' },
      { name: 'og:site_name', content: 'Settled Documentation' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@zirodelta' },
      { name: 'twitter:creator', content: '@zirodelta' },
    ],
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Settled',
      logo: {
        alt: 'Settled Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/api-reference/overview',
          position: 'left',
          label: 'API',
        },
        {
          to: '/protocol/overview',
          position: 'left',
          label: 'Protocol',
        },
        {
          href: 'https://settled.pro',
          label: 'App',
          position: 'right',
        },
        {
          href: 'https://github.com/Zirodelta',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Introduction', to: '/' },
            { label: 'Quickstart', to: '/quickstart' },
            { label: 'API Reference', to: '/api-reference/overview' },
            { label: 'Protocol', to: '/protocol/overview' },
          ],
        },
        {
          title: 'Guides',
          items: [
            { label: 'Building a Bot', to: '/guides/building-a-bot' },
            { label: 'TypeScript SDK', to: '/guides/typescript-sdk' },
            { label: 'Python SDK', to: '/guides/python-sdk' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'settled.pro', href: 'https://settled.pro' },
            { label: 'GitHub', href: 'https://github.com/Zirodelta' },
            { label: 'X (@zirodelta)', href: 'https://x.com/zirodelta' },
            { label: 'Discord', href: 'https://discord.gg/Ur85YWJbd' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Zirodelta. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'rust', 'go', 'toml', 'python'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
