import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Cpu, Globe, Code2, MessageSquare, Layers, Zap, Shield, BarChart3 } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const FEATURES = [
  { icon: MessageSquare, title: 'Conversational AI', desc: 'Natural language interface powered by state-of-the-art models. Ask questions, give instructions, and iterate in real-time.' },
  { icon: Layers, title: 'Canvas Interface', desc: 'Go beyond chat with a visual canvas. Generate interactive UIs, dashboards, and data visualizations on the fly.' },
  { icon: Globe, title: 'Browser Automation', desc: 'Let your agent browse the web autonomously. Research, gather data, and interact with websites programmatically.' },
  { icon: Code2, title: 'Live Code Editing', desc: 'Inspect and edit generated code in real-time. Full transparency into what your agent builds.' },
  { icon: Cpu, title: 'Multi-Model Support', desc: 'Choose from leading AI models including Claude, GPT, and more. Switch models per task for optimal results.' },
  { icon: Zap, title: 'Instant Deployment', desc: 'One-click deployment from canvas to production. Your creations go live in seconds, not hours.' },
];

const STEPS = [
  { num: '01', title: 'Describe Your Goal', desc: 'Tell the agent what you need in plain language. No coding required to get started.' },
  { num: '02', title: 'Watch It Build', desc: 'The agent creates interactive canvases, browses the web, and writes code — all in real-time.' },
  { num: '03', title: 'Refine & Deploy', desc: 'Iterate with natural language edits. When you are satisfied, deploy with one click.' },
];

export default function Landing() {
  return (
    <>
      <SEOHead
        title="AI Automation Platform"
        description="Agent Studio is a powerful AI automation platform by Tjark Osterloh. Build, deploy, and manage intelligent AI agents with a canvas-based interface, multi-model support, and browser automation."
        path="/"
        keywords="Agent Studio, AI agents, AI automation, Tjark Osterloh, AI platform, canvas AI, browser automation"
      />
      <Navbar />

      <main className="min-h-screen">
        {/* ─── Hero ─── */}
        <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                AI Experiences Beyond Chat
              </span>
            </motion.div>

            <motion.h1
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Build Intelligent Agents{' '}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                That Act
              </span>
            </motion.h1>

            <motion.p
              initial="hidden" animate="visible" custom={2} variants={fadeUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Agent Studio is a next-generation AI platform where agents don't just talk — they build canvases, browse the web, write code, and deploy production-ready applications.
            </motion.p>

            <motion.div
              initial="hidden" animate="visible" custom={3} variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/app"
                className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all"
              >
                Launch Agent Studio
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/features"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary/50 transition-colors"
              >
                Explore Features
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── Features Grid ─── */}
        <section className="py-20 sm:py-28" id="features">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={0} variants={fadeUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Build with AI</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A complete platform for creating, managing, and deploying intelligent AI agents.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <motion.article
                  key={f.title}
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} custom={i} variants={fadeUp}
                  className="group p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-20 sm:py-28 bg-card/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                From idea to deployed application in three simple steps.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.num}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                  className="text-center"
                >
                  <div className="text-5xl font-bold text-primary/20 mb-4 font-mono">{s.num}</div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Trust / Tech ─── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Professionals</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Enterprise-grade reliability with cutting-edge AI capabilities.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: Shield, title: 'Secure by Design', desc: 'End-to-end encryption, secure agent sandboxing, and full audit logs.' },
                { icon: BarChart3, title: 'Observable', desc: 'Real-time monitoring of agent actions, token usage, and performance metrics.' },
                { icon: Zap, title: 'Lightning Fast', desc: 'Optimized streaming, edge deployment, and sub-second response times.' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                  className="text-center p-6"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              <div className="p-10 sm:p-14 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                  <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-[80px]" />
                  <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-accent/10 blur-[80px]" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Build with AI?</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Start creating intelligent agents today. No credit card required.
                  </p>
                  <Link
                    to="/app"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
