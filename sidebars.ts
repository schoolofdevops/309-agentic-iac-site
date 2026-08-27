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
      label: 'Section 2 — Build Your First IaC Change with an AI Coding Agent',
      items: [
        'm2-first-iac-change-ai-coding-agent/lesson',
        'm2-first-iac-change-ai-coding-agent/lab',
        'm2-first-iac-change-ai-coding-agent/operator-challenge',
        'm2-first-iac-change-ai-coding-agent/deep-dive',
        'm2-first-iac-change-ai-coding-agent/quiz',
      ],
    },
    {
      type: 'category',
      label: 'Section 3 — Plan Your IaC Change Before the Agent Writes Code',
      items: [
        'm3-plan-iac-before-agent-codes/lab',
        'm3-plan-iac-before-agent-codes/operator-challenge',
      ],
    },
  ],
};

export default sidebars;
