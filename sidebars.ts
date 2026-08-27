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
        'm3-plan-iac-before-agent-codes/lesson',
        'm3-plan-iac-before-agent-codes/lab',
        'm3-plan-iac-before-agent-codes/operator-challenge',
        'm3-plan-iac-before-agent-codes/deep-dive',
        'm3-plan-iac-before-agent-codes/quiz',
      ],
    },
    {
      type: 'category',
      label: 'Section 4 — Give Your IaC Agent the Right Context',
      items: [
        'm4-give-iac-agent-right-context/lesson',
        'm4-give-iac-agent-right-context/lab',
        'm4-give-iac-agent-right-context/operator-challenge',
        'm4-give-iac-agent-right-context/deep-dive',
        'm4-give-iac-agent-right-context/quiz',
      ],
    },
    {
      type: 'category',
      label: 'Section 5 — Connect Your IaC Agent to Tools, Skills, and MCP',
      items: [
        'm5-connect-iac-agent-tools-skills-mcp/lesson',
        'm5-connect-iac-agent-tools-skills-mcp/lab',
        'm5-connect-iac-agent-tools-skills-mcp/operator-challenge',
        'm5-connect-iac-agent-tools-skills-mcp/deep-dive',
        'm5-connect-iac-agent-tools-skills-mcp/quiz',
      ],
    },
    {
      type: 'category',
      label: 'Section 6 — Build, Test, and Optimize Reliable IaC Agent Workflows',
      items: [
        'm6-build-test-optimize-reliable-iac-agent-workflows/lesson',
        'm6-build-test-optimize-reliable-iac-agent-workflows/lab',
        'm6-build-test-optimize-reliable-iac-agent-workflows/operator-challenge',
        'm6-build-test-optimize-reliable-iac-agent-workflows/deep-dive',
        'm6-build-test-optimize-reliable-iac-agent-workflows/quiz',
      ],
    },
    {
      type: 'category',
      label: 'Section 7 — Build Infrastructure with Terraform, OpenTofu, and AI Agents',
      items: [
        'm7-build-infrastructure-terraform-opentofu-ai/lesson',
        'm7-build-infrastructure-terraform-opentofu-ai/lab',
        'm7-build-infrastructure-terraform-opentofu-ai/operator-challenge',
        'm7-build-infrastructure-terraform-opentofu-ai/deep-dive',
        'm7-build-infrastructure-terraform-opentofu-ai/quiz',
      ],
    },
    {
      type: 'category',
      label: 'Section 8 — Test and Secure AI-Generated Infrastructure Code',
      items: [
        'm8-test-secure-ai-generated-infrastructure/lesson',
        'm8-test-secure-ai-generated-infrastructure/lab',
        'm8-test-secure-ai-generated-infrastructure/operator-challenge',
        'm8-test-secure-ai-generated-infrastructure/deep-dive',
        'm8-test-secure-ai-generated-infrastructure/quiz',
      ],
    },
  ],
};

export default sidebars;
