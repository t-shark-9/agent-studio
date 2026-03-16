import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';

interface CodeViewProps {
  canvasId: string | null;
}

export function CodeView({ canvasId }: CodeViewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCode = async () => {
    if (!canvasId) return;
    setLoading(true);
    try {
      const res = await fetch(`${CANVAS_URL}/api/canvas/${canvasId}/source`);
      if (res.ok) {
        const data = await res.json();
        setHtml(data.html);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCode();
  }, [canvasId]);

  const handleCopy = () => {
    if (html) {
      navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!canvasId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Start an experience to see its code here.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Toolbar */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3 shrink-0 bg-card">
        <span className="text-xs font-mono text-muted-foreground">canvas/{canvasId}.html</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={fetchCode} title="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopy} title="Copy">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto bg-[#0d1117] p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
        ) : html ? (
          <pre className="text-xs font-mono text-[#c9d1d9] whitespace-pre-wrap break-words leading-relaxed">
            <code>{html}</code>
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">Loading code...</p>
        )}
      </div>
    </motion.div>
  );
}
