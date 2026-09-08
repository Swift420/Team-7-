import { Article, ArticleCategory } from '../types';

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  {
    id: 'all',
    name: 'All Articles',
    slug: 'all',
    description: 'Explore all published stories, guides, and engineering articles.'
  },
  {
    id: 'data-tech',
    name: 'Data & Tech',
    slug: 'data-tech',
    description: 'Deep dives into data pipelines, real-time metrics, and systems architecture.'
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    slug: 'ai-ml',
    description: 'Practical guides and editorial perspectives on next-generation intelligence.'
  },
  {
    id: 'design-ux',
    name: 'Design & UX',
    slug: 'design-ux',
    description: 'Data storytelling, visual hierarchy, color theory, and interface craft.'
  },
  {
    id: 'editorials',
    name: 'Editorial Insights',
    slug: 'editorials',
    description: 'Essays on modern publishing, research methodologies, and industry trends.'
  },
  {
    id: 'editor-desk',
    name: 'Editor Desk & Drafts',
    slug: 'editor-desk',
    description: 'Restricted area for editors to review drafts, scheduled pieces, and publication queues.',
    restrictedToEditors: true
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'The Architecture of Modern Real-Time Data Dashboards',
    subtitle: 'Bridging WebSocket streams, reactive UI primitives, and high-frequency rendering in 2026',
    excerpt: 'How modern engineering teams build sub-100ms analytics engines with React 19, Vite, and Node.js without overwhelming client-side garbage collection.',
    category: 'Data & Tech',
    tags: ['React', 'TypeScript', 'Data Viz', 'Performance'],
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    readTimeMinutes: 6,
    publishedAt: '2026-09-02',
    views: 4820,
    likes: 312,
    featured: true,
    status: 'published',
    author: {
      id: 'user-editor-1',
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      role: 'Lead Editor, Tech & Data'
    },
    content: `## The Evolution of Analytics Frontends

Modern data engineering has reached an inflection point. With high-frequency data arriving from sensor fleets, user telemetry, and microservices, traditional request-response polling is no longer viable for mission-critical dashboards.

### 1. The Bottleneck: Unbounded Re-renders
When hundreds of datapoints stream per second, naïve state updates trigger massive tree reconciliation. In React 19, leveraging transitions and selective memoization allows UI thread responsiveness even under intense load.

\`\`\`typescript
// Concurrent-friendly batch stream processing
startTransition(() => {
  setMetricsBuffer((prev) => aggregateWindow(prev, incomingBatch));
});
\`\`\`

### 2. Canvas vs SVG for Large Datasets
While SVG primitives provide crisp vector rendering and easy CSS animations, Canvas or WebGL are essential when plotting more than 10,000 points simultaneously. Hybrid architectures combine SVG for interactive overlays (tooltips, crosshairs) and Canvas for the heavy background data paths.

### 3. Key Takeaways
- Decouple ingest cadence from the 60fps render loop with buffered frames.
- Treat data transformations as worker tasks via Web Workers.
- Optimize chart render cycles to avoid CPU spikes on mobile devices.`
  },
  {
    id: 'art-2',
    title: 'Designing for Clarity: 7 Principles of Modern Dashboard UX',
    subtitle: 'Turning chaotic multi-dimensional data into intuitive visual hierarchies for decision makers',
    excerpt: 'Visual clutter kills decision-making. We explore spatial rhythm, progressive disclosure, and contextual color palettes that guide executives to key takeaways.',
    category: 'Design & UX',
    tags: ['UX Design', 'Information Architecture', 'Design Systems'],
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    readTimeMinutes: 5,
    publishedAt: '2026-08-28',
    views: 3190,
    likes: 245,
    featured: false,
    status: 'published',
    author: {
      id: 'user-editor-3',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      role: 'Visual Journalism & AI Editor'
    },
    content: `## Information Architecture in Data Visualization

The best charts are the ones that never force the viewer to read a manual. When designing analytical user experiences, clarity must always supersede visual flair.

### The 7 Core Tenets:
1. **Establish a Primary Metric Focal Point:** Give the eye a single anchor before presenting subsidiary trends.
2. **Standardize Color Semantics:** Reserve red and green strictly for status indicators, not arbitrary category flavors.
3. **Progressive Disclosure:** Provide immediate summaries at a glance, allowing users to drill down into raw tables on demand.
4. **Context Over Raw Digits:** A number like $1.2M is meaningless without comparative benchmarks (e.g. +18.4% YoY or vs budget).
5. **Generous White Space:** Clustered cards create cognitive fatigue; let charts breathe with at least 1.5rem padding.
6. **Accessible Contrast Ratios:** Ensure minimum 4.5:1 contrast for all text and key visualization lines.
7. **Responsive Scaling:** Charts must intelligently simplify ticks and legends on smaller viewports.`
  },
  {
    id: 'art-3',
    title: 'Autonomous AI Agents in Enterprise Decision Pipelines',
    subtitle: 'From static dashboards to active conversational intelligence and automated anomaly remediation',
    excerpt: 'A comprehensive investigation into how agentic workflows are replacing scheduled manual reports with autonomous proactive alerts and scenario simulations.',
    category: 'AI & Machine Learning',
    tags: ['AI Agents', 'Automation', 'Enterprise', 'LLMs'],
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    readTimeMinutes: 8,
    publishedAt: '2026-08-20',
    views: 6410,
    likes: 580,
    featured: true,
    status: 'published',
    author: {
      id: 'user-editor-2',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      role: 'Senior Investigative Editor'
    },
    content: `## Beyond the Passive Dashboard

For two decades, business intelligence has followed a predictable paradigm: engineers collect data, analysts query data, and stakeholders look at a dashboard. But this model assumes humans have the attention span to continuously monitor hundreds of metrics.

### Enter Multi-Agent Orchestration
Next-generation platforms do not simply render curves—they inspect trends, diagnose root causes, and draft actionable mitigation plans before human operators even log on.

> "The dashboard of the future is an agent that alerts you only when your mental intervention is strictly required, backed with synthetic simulations of the alternatives."

### Practical Applications We See Today:
- **Autonomous Anomaly Detection:** Isolating seasonal fluctuations from actual payment gateway drops.
- **Root-Cause Attribution:** Automatically cross-referencing deploy logs with metric deviations.
- **Automated Briefings:** Synthesizing daily performance summaries tailored to specific executive roles.`
  },
  {
    id: 'art-4',
    title: 'The Rise of Computational Storytelling in Newsrooms',
    subtitle: 'How investigative journalists are leveraging code, datasets, and interactivity to expose truth',
    excerpt: 'An inside look at how leading news organizations blend code, cartography, and narrative craft to empower readers to verify findings independently.',
    category: 'Editorial Insights',
    tags: ['Journalism', 'Data Viz', 'Ethics', 'Storytelling'],
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
    readTimeMinutes: 7,
    publishedAt: '2026-08-14',
    views: 2950,
    likes: 198,
    featured: false,
    status: 'published',
    author: {
      id: 'user-editor-2',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      role: 'Senior Investigative Editor'
    },
    content: `## The Modern Digital Newsroom

Data journalism is no longer an auxiliary department; it is the backbone of investigative reporting. When complex societal issues are captured in multi-gigabyte datasets, computational fluency becomes synonymous with editorial rigor.

### Trust Through Reproducibility
When readers can filter the exact dataset, inspect methodology notes, and manipulate charts within the article itself, journalistic transparency reaches unprecedented levels. Open-source data repositories accompanying articles are fast becoming standard practice.`
  },
  {
    id: 'art-5',
    title: 'Draft: Distributed Edge Architectures for Modern Streaming Data',
    subtitle: 'Reducing origin strain with regional edge compute and durable WebSocket gateways',
    excerpt: 'An internal draft discussing benchmarks of deploying edge compute nodes for real-time aggregation across US and European regions.',
    category: 'Data & Tech',
    tags: ['Edge Compute', 'WebSockets', 'Architecture', 'Draft'],
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    readTimeMinutes: 4,
    publishedAt: '2026-09-08',
    views: 84,
    likes: 12,
    featured: false,
    status: 'draft',
    author: {
      id: 'user-editor-1',
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      role: 'Lead Editor, Tech & Data'
    },
    content: `## [EDITOR DRAFT NOTE: Under peer review before public release]

### Problem Statement
When client nodes exceed 50,000 concurrent listeners, raw WebSocket fanout from centralized instances consumes excessive bandwidth and introduces latency jitter.

### Edge Proxy Architecture
We deployed 4 regional edge nodes to terminate client connections and maintain single multiplexed upstream connections. Early metrics indicate a 73% reduction in ingress charges.`
  },
  {
    id: 'art-6',
    title: 'Draft: Color Blindness and Accessible Data Visualization Guidelines',
    subtitle: 'Auditing 15 common color ramps for deuteranopia and protanopia compatibility',
    excerpt: 'Editorial guide and draft color system reference for our visual reporting team. Pending final design lead sign-off.',
    category: 'Design & UX',
    tags: ['Accessibility', 'Color Theory', 'A11y', 'Draft'],
    coverImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    readTimeMinutes: 5,
    publishedAt: '2026-09-07',
    views: 42,
    likes: 8,
    featured: false,
    status: 'draft',
    author: {
      id: 'user-editor-3',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      role: 'Visual Journalism & AI Editor'
    },
    content: `## [EDITOR DRAFT NOTE: Reviewing contrast test matrices]

Roughly 8% of men and 0.5% of women experience some form of red-green color deficiency. When dashboards rely on simple green/red indicators to signal success or failure, a significant segment of users cannot decipher critical alerts.

### Recommended Accessible Swatches:
- Use Viridis or Okabe-Ito palettes for multi-series line charts.
- Combine color coding with shape markers or textual indicators (+ / -).`
  }
];

export const PRESET_IMAGE_OPTIONS = [
  {
    label: 'Tech & Architecture',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'UI & Design Systems',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'AI & Neural Networks',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Editorial & Books',
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Cyber & Code',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Creative & Visual Art',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80'
  }
];
