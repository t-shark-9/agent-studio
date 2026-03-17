import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Cpu, Globe } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

export default function About() {
  return (
    <>
      <SEOHead
        title="About"
        description="Learn about Agent Studio and Tjark Osterloh. A next-generation AI automation platform built to push the boundaries of what intelligent agents can do."
        path="/about"
        keywords="Tjark Osterloh, Agent Studio, about, AI developer, AI automation, software engineer"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Agent Studio',
          description: 'Learn about Agent Studio and its creator Tjark Osterloh.',
          mainEntity: {
            '@type': 'Person',
            name: 'Tjark Osterloh',
            jobTitle: 'Software Engineer & AI Developer',
            url: 'https://tjark-osterloh.de',
            sameAs: ['https://github.com/t-shark-9'],
          },
        }}
      />
      <Navbar />

      <main className="min-h-screen">
        {/* Hero */}
        <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h1
              initial="hidden" animate="visible" custom={0} variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-center"
            >
              About{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Agent Studio</span>
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto text-center leading-relaxed"
            >
              Built by Tjark Osterloh, Agent Studio is a next-generation AI platform designed to push the boundaries of what intelligent agents can achieve.
            </motion.p>
          </div>
        </section>

        {/* Vision */}
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
              className="prose prose-invert max-w-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-2xl font-bold mb-4">The Vision</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Most AI tools stop at conversation. Agent Studio was built on the belief that AI agents should be able to <strong className="text-foreground">act</strong> — not just talk. From generating interactive UIs on a visual canvas to browsing the web autonomously, the platform gives agents the tools to create real, tangible outputs.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The goal is simple: make AI a creative partner that can build, research, and deploy alongside you — all from a single, unified interface.
                  </p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">The Builder</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    <strong className="text-foreground">Tjark Osterloh</strong> is a software engineer and AI developer passionate about building tools that amplify human capability. With a deep focus on automation, agent architectures, and developer experience, Tjark created Agent Studio to explore the frontier of human-AI collaboration.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Agent Studio is built with modern web technologies — React, TypeScript, Tailwind CSS, and Vite — and integrates with multiple AI model providers to deliver a fast, flexible, and powerful experience.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-card/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
              className="text-3xl font-bold text-center mb-12"
            >
              Core Principles
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Code2, title: 'Transparency', desc: 'Every agent action is visible. See the code, inspect the reasoning, and understand every step your AI takes.' },
                { icon: Cpu, title: 'Flexibility', desc: 'No lock-in to a single model or workflow. Choose the right tool for each task and build your way.' },
                { icon: Globe, title: 'Capability', desc: 'Agents that can truly act in the world — browsing, building, deploying — not just answering questions.' },
              ].map((v, i) => (
                <motion.div
                  key={v.title}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                  className="text-center p-6"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              <h2 className="text-3xl font-bold mb-4">Want to See What Agents Can Do?</h2>
              <p className="text-muted-foreground mb-8">Try Agent Studio and experience AI that builds, browses, and deploys.</p>
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
