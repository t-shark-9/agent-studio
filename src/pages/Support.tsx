import { motion } from 'framer-motion';
import { ArrowRight, LifeBuoy, Users } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const COMMUNITY_URL = 'https://dzimplei.app/community';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function Support() {
  return (
    <>
      <SEOHead
        title="Support and Community"
        description="Need help with Jimply? Use the community space for support, product questions, and troubleshooting."
        path="/support"
        keywords="Jimply support, Jimply community, AI app support, Jimply help"
      />
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main>
          <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="max-w-3xl">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
                  <LifeBuoy className="w-3.5 h-3.5" />
                  Support
                </span>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
                  Get help through the Jimply community.
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  For product questions, troubleshooting, rollout help, and feedback, use the dedicated community page for the main application domain.
                </p>
              </motion.div>

              <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="mt-10 rounded-3xl border border-border/50 bg-card/60 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-2xl bg-primary/10 p-3 text-primary">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-3">Community support</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      The fastest path for support is the community area on the main Jimply site. That is where updates, discussions, and follow-up support can stay in one place.
                    </p>
                    <a
                      href={COMMUNITY_URL}
                      rel="noopener"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Open Community
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
