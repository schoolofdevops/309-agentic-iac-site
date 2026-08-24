import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  courseSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Setup',
      items: ['setup/prerequisites', 'setup/environment'],
    },
    {
      type: 'category',
      label: "Module 1",
      items: ['m1-first-governed-agentic-iac-change/lesson', 'm1-first-governed-agentic-iac-change/lab', 'm1-first-governed-agentic-iac-change/quiz', 'm1-first-governed-agentic-iac-change/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 2",
      items: ['m2-model-infrastructure-before-generation/lesson', 'm2-model-infrastructure-before-generation/lab', 'm2-model-infrastructure-before-generation/quiz', 'm2-model-infrastructure-before-generation/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 3",
      items: ['m3-design-production-ai-workload-platform/lesson', 'm3-design-production-ai-workload-platform/lab', 'm3-design-production-ai-workload-platform/quiz', 'm3-design-production-ai-workload-platform/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 4",
      items: ['m4-claude-code-codex-hermes/lesson', 'm4-claude-code-codex-hermes/lab', 'm4-claude-code-codex-hermes/quiz', 'm4-claude-code-codex-hermes/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 5",
      items: ['m5-context-and-memory-engineering/lesson', 'm5-context-and-memory-engineering/lab', 'm5-context-and-memory-engineering/quiz', 'm5-context-and-memory-engineering/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 6",
      items: ['m6-agent-skills-and-mcp/lesson', 'm6-agent-skills-and-mcp/lab', 'm6-agent-skills-and-mcp/quiz', 'm6-agent-skills-and-mcp/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 7",
      items: ['m7-harness-engineering-with-superpowers/lesson', 'm7-harness-engineering-with-superpowers/lab', 'm7-harness-engineering-with-superpowers/quiz', 'm7-harness-engineering-with-superpowers/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 8",
      items: ['m8-terraform-cloud-foundation/lesson', 'm8-terraform-cloud-foundation/lab', 'm8-terraform-cloud-foundation/quiz', 'm8-terraform-cloud-foundation/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 9",
      items: ['m9-verify-secure-and-cost-check-iac/lesson', 'm9-verify-secure-and-cost-check-iac/lab', 'm9-verify-secure-and-cost-check-iac/quiz', 'm9-verify-secure-and-cost-check-iac/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 10",
      items: ['m10-kubernetes-and-helm-delivery/lesson', 'm10-kubernetes-and-helm-delivery/lab', 'm10-kubernetes-and-helm-delivery/quiz', 'm10-kubernetes-and-helm-delivery/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 11",
      items: ['m11-govern-deployment-through-git/lesson', 'm11-govern-deployment-through-git/lab', 'm11-govern-deployment-through-git/quiz', 'm11-govern-deployment-through-git/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 12",
      items: ['m12-operate-with-hermes/lesson', 'm12-operate-with-hermes/lab', 'm12-operate-with-hermes/quiz', 'm12-operate-with-hermes/deep-dive'],
    },
    {
      type: 'category',
      label: "Module 13",
      items: ['m13-capstone-governed-ai-platform-change/lesson', 'm13-capstone-governed-ai-platform-change/lab', 'm13-capstone-governed-ai-platform-change/quiz', 'm13-capstone-governed-ai-platform-change/deep-dive'],
    },
  ],
};

export default sidebars;
