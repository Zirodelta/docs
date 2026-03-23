import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'introduction',
        'authentication',
        'quickstart',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/overview',
        'api-reference/series',
        'api-reference/markets',
        'api-reference/trading',
        'api-reference/onchain',
        'api-reference/portfolio',
        'api-reference/deposits-withdrawals',
        'api-reference/leaderboard',
        'api-reference/funding-intervals',
        'api-reference/crowd-data',
        'api-reference/push-notifications',
        'api-reference/websocket',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/building-a-bot',
        'guides/typescript-sdk',
        'guides/python-sdk',
      ],
    },
    {
      type: 'category',
      label: 'Protocol',
      items: [
        'protocol/overview',
        'protocol/lmsr-market-maker',
        'protocol/conditional-tokens',
        'protocol/onchain-program',
        'protocol/permissionless-resolution',
        'protocol/running-a-resolver',
        'protocol/fee-structure',
      ],
    },
  ],
};

export default sidebars;
