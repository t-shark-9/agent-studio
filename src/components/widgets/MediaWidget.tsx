import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Video, Wand2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MediaWidgetProps {
  onAction: (message: string) => void;
}

const STYLES = ['Photorealistic', 'Artistic', 'Anime', 'Watercolor', 'Digital Art', '3D Render'];

export function MediaWidget({ onAction }: MediaWidgetProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setGenerated(true);
    onAction(`I've generated a ${selectedStyle.toLowerCase()} ${mediaType} based on: "${prompt}"`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Media Type Toggle */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        {(['image', 'video'] as const).map(type => (
          <button
            key={type}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mediaType === type ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setMediaType(type)}
          >
            {type === 'image' ? <Image className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Describe your {mediaType}</h3>
        <Textarea
          placeholder={`Describe the ${mediaType} you want to create...`}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="min-h-[80px] text-xs bg-secondary border-border resize-none"
        />
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Style</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {STYLES.map(style => (
            <button
              key={style}
              className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                selectedStyle === style
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedStyle(style)}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {generated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg bg-secondary border border-border overflow-hidden"
        >
          <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-secondary flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Generated {mediaType} preview</span>
          </div>
          <div className="p-2 flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1">
              <Download className="h-3 w-3" /> Save
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => setGenerated(false)}>
              <RefreshCw className="h-3 w-3" /> Regenerate
            </Button>
          </div>
        </motion.div>
      )}

      {/* Generate Button */}
      <Button
        size="sm"
        className="w-full h-8 text-xs gap-1.5"
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
      >
        {isGenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="h-3 w-3" />
            </motion.div>
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="h-3 w-3" />
            Generate {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
          </>
        )}
      </Button>
    </div>
  );
}
