import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Globe, Keyboard } from 'lucide-react';

const BROWSER_API = '/browser';

interface BrowserViewProps {
  /** Initial URL to load when the browser opens */
  initialUrl?: string;
  /** Called when the browser navigates to a new URL */
  onNavigate?: (url: string, title: string) => void;
  /** Expose session ID for external control (agent) */
  onSessionReady?: (sessionId: string) => void;
}

export function BrowserView({ initialUrl, onNavigate, onSessionReady }: BrowserViewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl || '');
  const [urlInput, setUrlInput] = useState(initialUrl || '');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typeText, setTypeText] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const typeInputRef = useRef<HTMLInputElement>(null);

  // Navigate to a URL
  const navigate = useCallback(async (url: string) => {
    if (!url) return;
    let fullUrl = url;
    if (!fullUrl.startsWith('http')) {
      // If it looks like a search query, use Google
      if (!fullUrl.includes('.') || fullUrl.includes(' ')) {
        fullUrl = `https://www.google.com/search?q=${encodeURIComponent(fullUrl)}`;
      } else {
        fullUrl = `https://${fullUrl}`;
      }
    }
    setLoading(true);
    setUrlInput(fullUrl);
    try {
      const res = await fetch(`${BROWSER_API}/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setScreenshot(data.screenshot);
        setCurrentUrl(data.metadata?.url || fullUrl);
        setUrlInput(data.metadata?.url || fullUrl);
        setTitle(data.metadata?.title || '');
        if (!sessionId) {
          setSessionId(data.sessionId);
          onSessionReady?.(data.sessionId);
        }
        onNavigate?.(data.metadata?.url || fullUrl, data.metadata?.title || '');
      }
    } catch (err) {
      console.error('[BrowserView] Navigate error:', err);
    }
    setLoading(false);
  }, [sessionId, onNavigate, onSessionReady]);

  // Click on the screenshot at x,y coordinates
  const handleScreenClick = useCallback(async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!sessionId || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setLoading(true);
    try {
      const res = await fetch(`${BROWSER_API}/browse/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'click', x, y }),
      });
      const data = await res.json();
      if (data.success) {
        setScreenshot(data.screenshot);
        setCurrentUrl(data.url || currentUrl);
        setUrlInput(data.url || currentUrl);
        setTitle(data.title || title);
        onNavigate?.(data.url || currentUrl, data.title || title);
      }
    } catch (err) {
      console.error('[BrowserView] Click error:', err);
    }
    setLoading(false);
  }, [sessionId, currentUrl, title, onNavigate]);

  // Browser actions (back, forward, scroll)
  const browserAction = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BROWSER_API}/browse/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action, ...extra }),
      });
      const data = await res.json();
      if (data.success) {
        setScreenshot(data.screenshot);
        setCurrentUrl(data.url || currentUrl);
        setUrlInput(data.url || currentUrl);
        setTitle(data.title || title);
      }
    } catch (err) {
      console.error(`[BrowserView] Action ${action} error:`, err);
    }
    setLoading(false);
  }, [sessionId, currentUrl, title]);

  // Type text into the focused element
  const sendKeyboard = useCallback(async (text?: string, key?: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${BROWSER_API}/browse/keyboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text, key }),
      });
      const data = await res.json();
      if (data.success) {
        setScreenshot(data.screenshot);
        setCurrentUrl(data.url || currentUrl);
        setUrlInput(data.url || currentUrl);
        setTitle(data.title || title);
      }
    } catch (err) {
      console.error('[BrowserView] Keyboard error:', err);
    }
  }, [sessionId, currentUrl, title]);

  // Handle scroll on the screenshot
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    browserAction('scroll', { y: e.deltaY > 0 ? 400 : -400 });
  }, [browserAction]);

  // Auto-navigate on mount if initialUrl is provided
  useEffect(() => {
    if (initialUrl && !sessionId) {
      navigate(initialUrl);
    }
  }, [initialUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f0f23', fontFamily: 'system-ui, sans-serif' }}>
      {/* Browser chrome bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        background: '#1a1a2e', borderBottom: '1px solid #2a2a4a', flexShrink: 0,
      }}>
        {/* Nav buttons */}
        <button onClick={() => browserAction('back')} disabled={loading}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, fontSize: 14 }}
          title="Back">
          <ArrowLeft size={16} />
        </button>
        <button onClick={() => browserAction('forward')} disabled={loading}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, fontSize: 14 }}
          title="Forward">
          <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate(currentUrl)} disabled={loading}
          style={{ background: 'none', border: 'none', color: loading ? '#e94560' : '#888', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, fontSize: 14 }}
          title="Refresh">
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* URL bar */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 20,
          padding: '4px 12px',
        }}>
          <Globe size={12} style={{ color: '#666', flexShrink: 0 }} />
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') navigate(urlInput); }}
            placeholder="Search or enter URL..."
            style={{
              flex: 1, background: 'none', border: 'none', color: '#eee',
              fontSize: 12, outline: 'none',
            }}
          />
        </div>

        {/* Keyboard toggle */}
        <button onClick={() => { setTyping(!typing); setTimeout(() => typeInputRef.current?.focus(), 100); }}
          style={{
            background: typing ? '#e94560' : 'none', border: 'none',
            color: typing ? '#fff' : '#888', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 4, fontSize: 14,
          }}
          title="Toggle keyboard input">
          <Keyboard size={14} />
        </button>
      </div>

      {/* Typing bar — shown when keyboard mode is active */}
      {typing && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          background: '#16213e', borderBottom: '1px solid #2a2a4a', flexShrink: 0,
        }}>
          <input
            ref={typeInputRef}
            value={typeText}
            onChange={e => setTypeText(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter') {
                if (typeText) {
                  await sendKeyboard(typeText);
                  setTypeText('');
                }
                await sendKeyboard(undefined, 'Enter');
              } else if (e.key === 'Escape') {
                setTyping(false);
              } else if (e.key === 'Backspace' && !typeText) {
                await sendKeyboard(undefined, 'Backspace');
              } else if (e.key === 'Tab') {
                e.preventDefault();
                await sendKeyboard(undefined, 'Tab');
              }
            }}
            placeholder="Type text and press Enter to send to browser..."
            style={{
              flex: 1, background: '#1a1a2e', border: '1px solid #2a2a4a',
              borderRadius: 8, padding: '6px 10px', color: '#eee', fontSize: 12, outline: 'none',
            }}
          />
          <button
            onClick={async () => {
              if (typeText) { await sendKeyboard(typeText); setTypeText(''); }
            }}
            style={{
              background: '#e94560', border: 'none', borderRadius: 6,
              padding: '6px 12px', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}
          >Send</button>
        </div>
      )}

      {/* Title bar */}
      {title && (
        <div style={{
          padding: '3px 12px', fontSize: 11, color: '#666',
          background: '#16213e', borderBottom: '1px solid #2a2a4a',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {title}
        </div>
      )}

      {/* Content area — screenshot or loading */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: '#1a1a2e' }}>
        {screenshot ? (
          <img
            ref={imgRef}
            src={screenshot}
            alt="Browser"
            onClick={handleScreenClick}
            onWheel={handleWheel}
            style={{
              width: '100%', display: 'block', cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 16, color: '#666',
          }}>
            <Globe size={48} style={{ color: '#2a2a4a' }} />
            {loading ? (
              <p style={{ fontSize: 14 }}>Loading...</p>
            ) : (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#888' }}>Agent Browser</p>
                <p style={{ fontSize: 13 }}>Enter a URL or search query above</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['youtube.com', 'google.com', 'github.com', 'reddit.com', 'wikipedia.org'].map(site => (
                    <button
                      key={site}
                      onClick={() => navigate(`https://${site}`)}
                      style={{
                        background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 20,
                        padding: '6px 14px', color: '#aaa', fontSize: 12, cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={e => { (e.target as HTMLElement).style.borderColor = '#e94560'; (e.target as HTMLElement).style.color = '#eee'; }}
                      onMouseOut={e => { (e.target as HTMLElement).style.borderColor = '#2a2a4a'; (e.target as HTMLElement).style.color = '#aaa'; }}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {loading && screenshot && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: '#e94560', borderRadius: 12, padding: '4px 10px',
            fontSize: 11, color: '#fff', fontWeight: 600,
            animation: 'pulse 1s infinite',
          }}>
            Loading...
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  );
}
