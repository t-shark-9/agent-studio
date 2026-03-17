import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Layers, Globe, Code2, Cpu, Zap, Shield, BarChart3, Workflow, Settings, Link2 } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const ALL_FEATURES = [
  {
    icon: MessageSquare,
    title: 'Conversational AI Interface',
    desc: 'Interact with your AI agent using natural language. Ask complex questions, give multi-step instructions, and receive structured responses with context awareness across your entire session.',
    category: 'Core',
  },
  {
    icon: Layers,
    title: 'Canvas-Based UI Generation',
    desc: 'Agents generate rich, interactive user interfaces on a live canvas. From dashboards to forms to data visualizations — all created dynamically from your instructions.',
    category: 'Core',
  },
  {
    icon: Globe,
    title: 'Autonomous Browser',
    desc: 'Your agent can browse the web, fill forms, scrape data, and interact with any website. Built-in sandboxed browser for secure, observable web automation.',
    category: 'Automation',
  },
  {
    icon: Code2,
    title: 'Live Code Editor',
    desc: 'See and edit the code your agent generates in real-time. Full syntax highlighting, diff views, and the ability to manually tweak anything before deployment.',
    category: 'Developer',
  },
  {
    icon: Cpu,
    title: 'Multi-Model Architecture',
    desc: 'Switch between leading AI models — Claude, GPT-4, and more — on a per-task basis. Each model brings unique strengths; Agent Studio lets you leverage them all.',
    category: 'Core',
  },
  {
    icon: Zap,
    title: 'Real-Time Streaming',
    desc: 'Watch your agent think and create in real-time with token-level streaming. No waiting for complete responses — see progress as it happens.',
    category: 'Developer',
  },
  {
    icon: Shield,
    title: 'Secure Sandboxing',
    desc: 'Every agent runs in an isolated environment. Browser sessions are sandboxed, code execution is contained, and all actions are logged for full auditability.',
    category: 'Enterprise',
  },
  {
    icon: BarChart3,
    title: 'Session Management',
    desc: 'Organize work across multiple sessions. Each session maintains its own context, canvas state, and conversation history. Switch between projects seamlessly.',
    category: 'Productivity',
  },
  {
    icon: Workflow,
    title: 'Intent Detection',
    desc: 'Intelligent intent classification routes your requests to specialized handlers — booking, browsing, media creation, trip planning, and more.',
    category: 'Automation',
  },
  {
    icon: Settings,
    title: 'Canvas Settings & Themes',
    desc: 'Fine-tune generated canvases with a visual settings panel. Adjust layouts, color schemes, and component properties without touching code.',
    category: 'Productivity',
  },
  {
    icon: Link2,
    title: 'Connected Accounts',
    desc: 'Link external services and APIs to your agent. Integrate with databases, cloud services, and third-party tools for powerful automated workflows.',
    category: 'Enterprise',
  },
  {
    icon: Zap,
    title: 'Template Library',
    desc: 'Start from pre-built templates or extract your own from completed canvases. Build a personal library of reusable starting points.',
    category: 'Productivity',
  },
];

export default function Features() {
  return (
    <>
      <SEOHead
        title="Features"
        description="Explore Agent Studio features: conversational AI, canvas-based UI generation, browser automation, multi-model support, live code editing, and more. A complete AI automation platform."
        path="/features"
        keywords="Agent Studio features, AI canvas, browser automation, multi-model AI, code generation, AI platform features"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Agent Studio Features',
          description: 'Complete list of Agent Studio platform features',
          numberOfItems: ALL_FEATURES.length,
          itemListElement: ALL_FEATURES.map((f, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: f.title,
            description: f.desc,
          })),
        }}
      />
      <Navbar />

      <main className="min-h-screen">
        {/* Hero */}
        <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial="hidden" animate="visible" custom={0} variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Platform{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Features</span>
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Agent Studio combines conversational AI, visual canvas generation, browser automation, and multi-model intelligence into one unified platform.
            </motion.p>
          </div>
        </section>

        {/* Feature grid */}
        <section className="pb-20 sm:pb-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ALL_FEATURES.map((f, i) => (
                <motion.article
                  key={f.title}
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-20px' }} custom={i % 6} variants={fadeUp}
                  className="group p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">
                      {f.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-24 bg-card/30">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">See It in Action</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                The best way to understand Agent Studio is to try it. Launch the platform and start building.
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
              >
                Launch Agent Studio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
