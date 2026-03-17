import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Github, Send } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <SEOHead
        title="Contact"
        description="Get in touch with Tjark Osterloh about Agent Studio. Questions, feedback, or collaboration opportunities — we'd love to hear from you."
        path="/contact"
        keywords="contact Tjark Osterloh, Agent Studio contact, AI platform support, get in touch"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Agent Studio',
          description: 'Get in touch about Agent Studio.',
          mainEntity: {
            '@type': 'Organization',
            name: 'Agent Studio',
            url: 'https://tjark-osterloh.de',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'General',
              url: 'https://tjark-osterloh.de/contact',
            },
          },
        }}
      />
      <Navbar />

      <main className="min-h-screen">
        {/* Hero */}
        <section className="pt-32 pb-12 sm:pt-40 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial="hidden" animate="visible" custom={0} variants={fadeUp}
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            >
              Get in{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Touch</span>
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="text-lg text-muted-foreground max-w-xl mx-auto"
            >
              Have questions about Agent Studio? Interested in collaboration? Drop a message.
            </motion.p>
          </div>
        </section>

        {/* Content */}
        <section className="pb-20 sm:pb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Location</h3>
                      <p className="text-sm text-muted-foreground">Germany</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Github className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">GitHub</h3>
                      <a href="https://github.com/t-shark-9" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">github.com/t-shark-9</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-sm text-muted-foreground">Available upon request</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
                {submitted ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                      <p className="text-sm text-muted-foreground">Thank you for reaching out. We'll get back to you soon.</p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                    className="space-y-5"
                  >
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1.5">Name</label>
                      <input
                        id="name"
                        type="text"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                      <input
                        id="email"
                        type="email"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-1.5">Message</label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors resize-none"
                        placeholder="Tell us about your project or question..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                    >
                      Send Message
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
