import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';

interface CodeViewProps {
  canvasId: string | null;
}

export function CodeView({ canvasId }: CodeViewProps) {
  const [html, setHtml] = useState<string>('');
  const [savedHtml, setSavedHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = html !== savedHtml;

  const fetchCode = useCallback(async () => {
    if (!canvasId) return;
    setLoading(true);
    try {
      const res = await fetch(`${CANVAS_URL}/api/canvas/${canvasId}/source`);
      if (res.ok) {
        const data = await res.json();
        setHtml(data.html || '');
        setSavedHtml(data.html || '');
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [canvasId]);

  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  const handleSave = async () => {
    if (!canvasId || !isDirty) return;
    setSaving(true);
    try {
      const res = await fetch(`${CANVAS_URL}/api/canvas/${canvasId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (res.ok) {
        setSavedHtml(html);
      }
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Tab inserts spaces instead of moving focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = html.substring(0, start) + '  ' + html.substring(end);
      setHtml(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

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
        <span className="text-xs font-mono text-muted-foreground">
          canvas/{canvasId}.html
          {isDirty && <span className="text-primary ml-1">(modified)</span>}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleSave}
            disabled={!isDirty || saving}
            title="Save (Ctrl+S)"
          >
            <Save className={`h-3.5 w-3.5 ${isDirty ? 'text-primary' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={fetchCode} title="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopy} title="Copy">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Editable code */}
      <div className="flex-1 overflow-auto bg-[#0d1117] min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <textarea
            ref={editorRef}
            value={html}
            onChange={e => setHtml(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent text-xs font-mono text-[#c9d1d9] p-4 resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        )}
      </div>
    </motion.div>
  );
}
