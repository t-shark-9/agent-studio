import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Rocket, Loader2 } from 'lucide-react';

const PAYMENTS_API = '/payments';

interface PricingPlansProps {
  entityId: string;
}

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  tagline: string;
  badge?: string;
  models: [string, string][];
  extras: string[];
}

const PLAN_CONFIG: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    tagline: 'Start building for free',
    models: [
      ['GPT-4o',  '100 msgs'],
      ['Sonnet',  '10'],
      ['Opus',    '3'],
      ['Gemini',  '10'],
      ['Haiku',   '30'],
      ['Codex',   '10'],
    ],
    extras: ['1 video / day', 'WhatsApp'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    tagline: 'Power users & teams',
    badge: 'Most Popular',
    models: [
      ['GPT-4o',  'Unlimited'],
      ['Sonnet',  '100'],
      ['Opus',    '30'],
      ['Gemini',  '100'],
      ['Haiku',   '300'],
      ['Codex',   '100'],
    ],
    extras: ['5 videos / day', 'WhatsApp'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99,
    tagline: 'Maximum power, full control',
    models: [
      ['GPT-4o',  'Unlimited'],
      ['Sonnet',  '500'],
      ['Opus',    '167'],
      ['Gemini',  '500'],
      ['Haiku',   '1,500'],
      ['Codex',   '500'],
    ],
    extras: [
      '20 videos / day',
      'Full automations',
      'App development',
      'Instant hosting',
      'WhatsApp',
      'Home agent',
    ],
  },
];

const PLAN_ORDER = PLAN_CONFIG.map(p => p.id);

const ACCENT: Record<string, string> = {
  free:  'border-border/50 bg-card',
  pro:   'border-primary/50 bg-primary/5 ring-1 ring-primary/20',
  elite: 'border-amber-500/40 bg-amber-500/5',
};

const BTN: Record<string, string> = {
  free:  'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  pro:   'bg-primary text-primary-foreground hover:bg-primary/90',
  elite: 'bg-amber-500 text-white hover:bg-amber-400',
};

const ICON_COLOR: Record<string, string> = {
  free:  'text-muted-foreground',
  pro:   'text-primary',
  elite: 'text-amber-500',
};

const BADGE_COLOR: Record<string, string> = {
  pro: 'bg-primary text-primary-foreground',
};

type IconComp = React.ComponentType<{ className?: string }>;
const ICONS: Record<string, IconComp> = { free: Zap, pro: Crown, elite: Rocket };

export function PricingPlans({ entityId }: PricingPlansProps) {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${PAYMENTS_API}/subscription/${entityId}`);
        const data = await res.json();
        setCurrentPlan(data.plan || 'free');
      } catch { /* service not running */ }
      setLoading(false);
    }
    load();
  }, [entityId]);

  const handleCheckout = async (planId: string) => {
    setCheckingOut(planId);
    try {
      const res = await fetch(`${PAYMENTS_API}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, entityId }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch { /* */ }
    setCheckingOut(null);
  };

  const handleManage = async () => {
    try {
      const res = await fetch(`${PAYMENTS_API}/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch { /* */ }
  };

  const currentIndex = PLAN_ORDER.indexOf(currentPlan);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">Plans & Billing</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Current plan: <span className="font-medium text-primary capitalize">{currentPlan}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLAN_CONFIG.map((plan, idx) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade = idx > currentIndex;
          const Icon = ICONS[plan.id];

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border flex flex-col p-4 ${ACCENT[plan.id]}`}
            >
              {plan.badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${BADGE_COLOR[plan.id] ?? 'bg-muted text-foreground'}`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-3 pt-1">
                <div className={`flex items-center gap-1.5 mb-1 ${ICON_COLOR[plan.id]}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-bold text-foreground">{plan.name}</span>
                </div>
                <div className="flex items-baseline gap-0.5 mb-1">
                  {plan.price === 0 ? (
                    <span className="text-xl font-bold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-[10px] text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{plan.tagline}</p>
              </div>

              {/* AI Models */}
              <div className="mb-3">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  AI Models
                </p>
                <div className="space-y-0.5">
                  {plan.models.map(([model, quota]) => (
                    <div key={model} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">{model}</span>
                      <span className={`text-[10px] font-semibold tabular-nums ${
                        quota === 'Unlimited' ? 'text-green-500' : 'text-foreground'
                      }`}>
                        {quota}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Includes */}
              <div className="flex-1 mb-4">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Includes
                </p>
                <ul className="space-y-0.5">
                  {plan.extras.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                      <Check className="h-2.5 w-2.5 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              {isCurrent ? (
                <button
                  onClick={plan.id === 'free' ? undefined : handleManage}
                  className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${BTN[plan.id]} ${plan.id === 'free' ? 'cursor-default opacity-70' : ''}`}
                >
                  {plan.id === 'free' ? 'Current Plan' : 'Manage Subscription'}
                </button>
              ) : isUpgrade ? (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={checkingOut === plan.id}
                  className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50 ${BTN[plan.id]}`}
                >
                  {checkingOut === plan.id
                    ? <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                    : `Upgrade to ${plan.name}`}
                </button>
              ) : (
                <button className="w-full py-1.5 rounded-lg text-[10px] font-medium bg-secondary/40 text-muted-foreground cursor-default">
                  Downgrade
                </button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
