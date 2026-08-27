import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  courseSidebar: [
    'intro',
    'course-build-status',
    {
      type: 'category',
      label: 'Setup',
      items: ['setup/prerequisites', 'setup/environment'],
    },
    {
      type: 'category',
      label: 'Section 1 — Agentic IaC Fundamentals',
      items: [
        'm1-welcome-agentic-infrastructure-as-code/lesson',
        'm1-welcome-agentic-infrastructure-as-code/lab',
        'm1-welcome-agentic-infrastructure-as-code/operator-challenge',
        'm1-welcome-agentic-infrastructure-as-code/quiz',
      ],
    },
    {
      type: 'category',
      label: 'Section 2 — Governed Agent Workflows for IaC',
      items: [
        'm2-agentic-iac-fundamentals/lesson',
        'm2-agentic-iac-fundamentals/lab',
        'm2-agentic-iac-fundamentals/operator-challenge',
        'm2-agentic-iac-fundamentals/deep-dive',
        'm2-agentic-iac-fundamentals/quiz',
      ],
    },
  ],
};

export default sidebars;
