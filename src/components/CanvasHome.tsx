import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, UtensilsCrossed, Image, Sparkles, ArrowRight, ArrowLeft,
  MapPin, Calendar, DollarSign, Users, Clock, Utensils, Camera, Video, Palette,
  LayoutGrid,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCachedTemplates, getTemplates, refreshTemplates, type TemplateData } from '@/lib/templateCache';

// Re-export for Index.tsx
export const refreshTemplateCache = refreshTemplates;

interface FlowStep {
  question: string;
  options: { label: string; icon?: React.ElementType; value: string }[];
}

interface Flow {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  steps: FlowStep[];
}

const FLOWS: Record<string, Flow> = {
  booking: {
    icon: UtensilsCrossed,
    label: 'Book a Restaurant',
    description: 'Find and reserve the perfect table',
    color: 'from-orange-500/20 to-red-500/20',
    steps: [
      {
        question: 'What cuisine are you craving?',
        options: [
          { label: 'Italian', icon: Utensils, value: 'Italian' },
          { label: 'Japanese', icon: Utensils, value: 'Japanese' },
          { label: 'Fine Dining', icon: Utensils, value: 'Fine Dining' },
          { label: 'Casual', icon: Utensils, value: 'Casual' },
        ],
      },
      {
        question: 'How many guests?',
        options: [
          { label: 'Just me', icon: Users, value: '1 person' },
          { label: '2 people', icon: Users, value: '2 people' },
          { label: '4-6 people', icon: Users, value: '4-6 people' },
          { label: 'Large group', icon: Users, value: 'a large group' },
        ],
      },
      {
        question: 'When would you like to dine?',
        options: [
          { label: 'Tonight', icon: Clock, value: 'tonight' },
          { label: 'Tomorrow', icon: Clock, value: 'tomorrow' },
          { label: 'This weekend', icon: Clock, value: 'this weekend' },
          { label: 'Pick a date', icon: Calendar, value: 'a specific date' },
        ],
      },
    ],
  },
  media: {
    icon: Image,
    label: 'Generate Image',
    description: 'Create stunning visuals with AI',
    color: 'from-purple-500/20 to-pink-500/20',
    steps: [
      {
        question: 'What type of media?',
        options: [
          { label: 'Image', icon: Camera, value: 'an image' },
          { label: 'Video', icon: Video, value: 'a video' },
          { label: 'Artwork', icon: Palette, value: 'digital artwork' },
          { label: 'Photo edit', icon: Image, value: 'a photo edit' },
        ],
      },
      {
        question: 'What style?',
        options: [
          { label: 'Photorealistic', icon: Camera, value: 'photorealistic' },
          { label: 'Artistic', icon: Palette, value: 'artistic' },
          { label: 'Anime', icon: Palette, value: 'anime-style' },
          { label: '3D Render', icon: Palette, value: '3D rendered' },
        ],
      },
      {
        question: 'What subject?',
        options: [
          { label: 'Landscape', icon: Image, value: 'a landscape scene' },
          { label: 'Portrait', icon: Users, value: 'a portrait' },
          { label: 'Abstract', icon: Palette, value: 'abstract art' },
          { label: 'Custom', icon: Palette, value: 'a custom concept' },
        ],
      },
    ],
  },
  trip: {
    icon: Plane,
    label: 'Plan a Trip',
    description: 'Build your perfect getaway itinerary',
    color: 'from-blue-500/20 to-cyan-500/20',
    steps: [
      {
        question: 'Where do you want to go?',
        options: [
          { label: 'Europe', icon: MapPin, value: 'Europe' },
          { label: 'Asia', icon: MapPin, value: 'Asia' },
          { label: 'Americas', icon: MapPin, value: 'the Americas' },
          { label: 'Surprise me', icon: Plane, value: 'a surprise destination' },
        ],
      },
      {
        question: 'When are you traveling?',
        options: [
          { label: 'This week', icon: Calendar, value: 'this week' },
          { label: 'This month', icon: Calendar, value: 'this month' },
          { label: 'In 3 months', icon: Calendar, value: 'in 3 months' },
          { label: 'Flexible', icon: Calendar, value: 'flexible dates' },
        ],
      },
      {
        question: "What's your budget?",
        options: [
          { label: 'Budget', icon: DollarSign, value: 'a budget-friendly' },
          { label: 'Mid-range', icon: DollarSign, value: 'a mid-range' },
          { label: 'Luxury', icon: DollarSign, value: 'a luxury' },
          { label: 'No limit', icon: DollarSign, value: 'an unlimited budget' },
        ],
      },
    ],
  },
};

interface CanvasHomeProps {
  onStartFlow: (message: string) => void;
  onUseTemplate: (templateId: string) => void;
}

export function CanvasHome({ onStartFlow, onUseTemplate }: CanvasHomeProps) {
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [templates, setTemplates] = useState<TemplateData[]>(getCachedTemplates());
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    getTemplates().then(setTemplates);
  }, []);

  const handleSelectFlow = (flowKey: string) => {
    setActiveFlow(flowKey);
    setStepIndex(0);
    setAnswers([]);
  };

  const handleSelectOption = (value: string) => {
    const newAnswers = [...answers, value];
    const flow = FLOWS[activeFlow!];

    if (stepIndex < flow.steps.length - 1) {
      setAnswers(newAnswers);
      setStepIndex(s => s + 1);
    } else {
      let message = '';
      if (activeFlow === 'trip') {
        message = `Plan a trip to ${newAnswers[0]} ${newAnswers[1]} with ${newAnswers[2]} budget.`;
      } else if (activeFlow === 'booking') {
        message = `Book a ${newAnswers[0]} restaurant for ${newAnswers[1]} ${newAnswers[2]}.`;
      } else if (activeFlow === 'media') {
        message = `Create ${newAnswers[0]} in ${newAnswers[1]} style of ${newAnswers[2]}.`;
      }
      onStartFlow(message);
      setActiveFlow(null);
      setStepIndex(0);
      setAnswers([]);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(s => s - 1);
      setAnswers(a => a.slice(0, -1));
    } else {
      setActiveFlow(null);
    }
  };

  // ── Templates grid ───────────────────────────────────────────
  if (showTemplates) {
    return (
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowTemplates(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-bold text-foreground">Community Templates</h2>
        </div>
        {templates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No templates yet. Complete a flow and it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="group cursor-pointer border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all"
                  onClick={() => onUseTemplate(tpl.id)}
                >
                  <CardContent className="p-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{tpl.name}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{tpl.description}</p>
                    <span className="inline-block mt-2 text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                      {tpl.category}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step flow (inside a selected intent) ─────────────────────
  if (activeFlow) {
    const flow = FLOWS[activeFlow];
    const step = flow.steps[stepIndex];
    const progress = ((stepIndex + 1) / flow.steps.length) * 100;

    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-full max-w-lg mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <flow.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{flow.label}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">Step {stepIndex + 1}/{flow.steps.length}</span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground text-center">{step.question}</h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-3 w-full max-w-lg"
          >
            {step.options.map((option, i) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="group cursor-pointer border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all duration-200"
                    onClick={() => handleSelectOption(option.value)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      {Icon && (
                        <div className="h-9 w-9 rounded-lg bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">{option.label}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Home: intent cards + Others ──────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
        >
          <Sparkles className="h-3 w-3" />
          Powered by Agent Studio
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">What would you like to do?</h1>
        <p className="text-sm text-muted-foreground">Choose an experience or start from a template</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        {Object.entries(FLOWS).map(([key, flow], i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card
              className="group cursor-pointer border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all duration-300 overflow-hidden"
              onClick={() => handleSelectFlow(key)}
            >
              <CardContent className="p-5">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${flow.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <flow.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{flow.label}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{flow.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Others / Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <Card
            className="group cursor-pointer border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-primary/5 transition-all duration-300"
            onClick={() => setShowTemplates(true)}
          >
            <CardContent className="p-5">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-400/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <LayoutGrid className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Others</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {templates.length > 0
                  ? `${templates.length} community template${templates.length === 1 ? '' : 's'}`
                  : 'Browse community templates'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
