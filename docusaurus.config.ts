import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Settled Docs',
  tagline: 'Protocol documentation for Settled prediction markets',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.settled.pro',
  baseUrl: '/',

  organizationName: 'Zirodelta',
  projectName: 'docs',

  onBrokenLinks: 'throw',

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
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Settled',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'API Reference',
          docsPluginId: 'default',
        },
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Protocol',
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
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/',
            },
            {
              label: 'API Reference',
              to: '/api-reference/overview',
            },
            {
              label: 'Protocol',
              to: '/protocol/overview',
            },
          ],
        },
        {
          title: 'Links',
          items: [
            {
              label: 'settled.pro',
              href: 'https://settled.pro',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Zirodelta',
            },
            {
              label: 'X (@zirodelta)',
              href: 'https://x.com/zirodelta',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Zirodelta. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'rust', 'go', 'toml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
