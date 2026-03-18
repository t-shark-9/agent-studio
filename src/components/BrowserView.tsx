import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Globe, Lock, X } from 'lucide-react';

const BROWSER_API = '/browser';

interface BrowserViewProps {
  initialUrl?: string;
  onNavigate?: (url: string, title: string) => void;
  onSessionReady?: (sessionId: string) => void;
  refreshKey?: number;
  statusText?: string | null;
  busy?: boolean;
}

export function BrowserView({ initialUrl, onNavigate, onSessionReady, refreshKey = 0, statusText, busy = false }: BrowserViewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl || '');
  const [urlInput, setUrlInput] = useState(initialUrl || '');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [networkIssues, setNetworkIssues] = useState<Array<{ status: number; url: string; resourceType?: string }>>([]);

  const imgRef = useRef<HTMLImageElement>(null);
  const browserAreaRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const urlBarRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Keep ref in sync for use in callbacks
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const applyMeta = useCallback((url?: string, pageTitle?: string) => {
    if (url && url !== currentUrl) {
      setCurrentUrl(url);
      setUrlInput(url);
    }
    if (pageTitle !== undefined) setTitle(pageTitle);
    if (url || pageTitle) onNavigate?.(url || currentUrl, pageTitle ?? title);
  }, [currentUrl, title, onNavigate]);

  // ── SSE stream ──────────────────────────────────────────────────
  const connectStream = useCallback((sid: string) => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    const es = new EventSource(`${BROWSER_API}/browse/stream/${sid}`);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { frame?: string; url?: string; title?: string; error?: string };
        if (data.frame) {
          setScreenshot(`data:image/jpeg;base64,${data.frame}`);
          setLoading(false);
        }
        if (data.url || data.title !== undefined) applyMeta(data.url, data.title);
      } catch { /* malformed */ }
    };

    es.onerror = () => {
      // Stream lost — silently fall back (interactions still work)
      es.close();
      if (esRef.current === es) esRef.current = null;
    };
  }, [applyMeta]);

  const disconnectStream = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  // ── Navigate ────────────────────────────────────────────────────
  const navigate = useCallback(async (url: string) => {
    if (!url) return;
    let fullUrl = url;
    if (!fullUrl.startsWith('http')) {
      fullUrl = (!fullUrl.includes('.') || fullUrl.includes(' '))
        ? `https://www.google.com/search?q=${encodeURIComponent(fullUrl)}`
        : `https://${fullUrl}`;
    }
    setLoading(true);
    setLastError(null);
    setUrlInput(fullUrl);
    urlBarRef.current?.blur();
    browserAreaRef.current?.focus();

    try {
      const sid = sessionIdRef.current;
      const res = await fetch(`${BROWSER_API}/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, sessionId: sid }),
      });

      if (res.status === 410 || res.status === 404) {
        // Session expired — create a new one
        setSessionId(null);
        sessionIdRef.current = null;
        disconnectStream();
        const retry = await fetch(`${BROWSER_API}/browse`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: fullUrl }),
        });
        const d = await retry.json();
        if (retry.ok && d.sessionId) {
          sessionIdRef.current = d.sessionId;
          setSessionId(d.sessionId);
          onSessionReady?.(d.sessionId);
          connectStream(d.sessionId);
          if (d.screenshot) setScreenshot(d.screenshot);
          applyMeta(d.metadata?.url || fullUrl, d.metadata?.title);
        }
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(`Navigate failed (${res.status})`);
      const data = await res.json();

      if (data.screenshot) setScreenshot(data.screenshot);
      applyMeta(data.metadata?.url || fullUrl, data.metadata?.title);

      if (!sid && data.sessionId) {
        sessionIdRef.current = data.sessionId;
        setSessionId(data.sessionId);
        onSessionReady?.(data.sessionId);
        connectStream(data.sessionId);
      }

      if (data.diagnostics?.networkErrors) {
        setNetworkIssues(data.diagnostics.networkErrors.slice(-5));
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Navigation failed');
    }
    setLoading(false);
  }, [applyMeta, connectStream, disconnectStream, onSessionReady]);

  // ── Click on screenshot ─────────────────────────────────────────
  const handleScreenClick = useCallback(async (e: React.MouseEvent<HTMLImageElement>) => {
    const sid = sessionIdRef.current;
    if (!sid || !imgRef.current) return;
    browserAreaRef.current?.focus();

    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (1280 / rect.width));
    const y = Math.round((e.clientY - rect.top) * (800 / rect.height));

    setLoading(true);
    setLastError(null);
    try {
      const res = await fetch(`${BROWSER_API}/browse/interact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, action: 'click', x, y }),
      });
      if (!res.ok) throw new Error(`Click failed (${res.status})`);
      const data = await res.json();
      // Stream handles frame updates; update URL/title from response
      if (data.metadata) applyMeta(data.metadata.url, data.metadata.title);
      if (data.screenshot && !esRef.current) setScreenshot(data.screenshot);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Click failed');
    }
    setLoading(false);
  }, [applyMeta]);

  // ── Keyboard capture (direct on browser area) ───────────────────
  const sendKey = useCallback(async (text?: string, key?: string) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      await fetch(`${BROWSER_API}/browse/keyboard`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, text, key }),
      });
    } catch { /* ignore */ }
  }, []);

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    // Let browser shortcuts pass through
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const specialKeys: Record<string, string> = {
      Enter: 'Enter', Backspace: 'Backspace', Delete: 'Delete', Escape: 'Escape',
      Tab: 'Tab', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
      Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
    };
    if (specialKeys[e.key]) {
      await sendKey(undefined, specialKeys[e.key]);
    } else if (e.key.length === 1) {
      await sendKey(e.key);
    }
  }, [sendKey]);

  // ── Scroll ──────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const sid = sessionIdRef.current;
    if (!sid) return;
    fetch(`${BROWSER_API}/browse/interact`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, action: 'scroll', y: e.deltaY > 0 ? 300 : -300 }),
    }).catch(() => {});
  }, []);

  // ── Nav buttons ─────────────────────────────────────────────────
  const browserAction = useCallback(async (action: string) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    setLoading(true);
    try {
      const res = await fetch(`${BROWSER_API}/browse/interact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.metadata) applyMeta(data.metadata.url, data.metadata.title);
        if (data.screenshot && !esRef.current) setScreenshot(data.screenshot);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [applyMeta]);

  // ── Mouse cursor tracking ───────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // ── Initial navigation ──────────────────────────────────────────
  useEffect(() => {
    if (initialUrl && !sessionIdRef.current) navigate(initialUrl);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── External refresh trigger ────────────────────────────────────
  useEffect(() => {
    const sid = sessionIdRef.current;
    if (!sid || refreshKey === 0) return;
    fetch(`${BROWSER_API}/browse/state`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, screenshot: !esRef.current }),
    }).then(r => r.json()).then(data => {
      if (data.screenshot) setScreenshot(data.screenshot);
      if (data.metadata) applyMeta(data.metadata.url, data.metadata.title);
    }).catch(() => {});
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => () => { disconnectStream(); }, [disconnectStream]);

  const isHttps = currentUrl.startsWith('https://');

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#202124', fontFamily: 'system-ui, -apple-system, sans-serif', userSelect: 'none' }}
    >
      {/* ── Chrome-style toolbar ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px',
        background: '#35363a', borderBottom: '1px solid #1a1a1a', flexShrink: 0,
      }}>
        {/* Tab favicon + title */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#202124', borderRadius: '6px 6px 0 0',
          padding: '4px 10px', marginRight: 4, fontSize: 12, color: '#e8eaed',
          maxWidth: 200, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          borderBottom: '2px solid #8ab4f8',
        }}>
          <Globe size={12} style={{ color: '#9aa0a6', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{title || 'New Tab'}</span>
        </div>

        {/* Nav buttons */}
        <button onClick={() => browserAction('back')} disabled={loading || !sessionId}
          style={{ background: 'none', border: 'none', color: sessionId ? '#e8eaed' : '#5f6368', cursor: sessionId ? 'pointer' : 'default', padding: '4px 6px', borderRadius: 20, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </button>
        <button onClick={() => browserAction('forward')} disabled={loading || !sessionId}
          style={{ background: 'none', border: 'none', color: sessionId ? '#e8eaed' : '#5f6368', cursor: sessionId ? 'pointer' : 'default', padding: '4px 6px', borderRadius: 20, display: 'flex', alignItems: 'center' }}>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate(currentUrl)} disabled={!sessionId}
          style={{ background: 'none', border: 'none', color: loading ? '#8ab4f8' : '#e8eaed', cursor: 'pointer', padding: '4px 6px', borderRadius: 20, display: 'flex', alignItems: 'center' }}>
          {loading
            ? <RotateCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <RotateCw size={14} />}
        </button>

        {/* Omnibox */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          background: '#2b2b2e', border: `1px solid ${focused ? '#8ab4f8' : 'transparent'}`,
          borderRadius: 20, padding: '5px 14px', transition: 'border-color 0.15s',
        }}>
          {isHttps
            ? <Lock size={12} style={{ color: '#5f6368', flexShrink: 0 }} />
            : <Globe size={12} style={{ color: '#5f6368', flexShrink: 0 }} />}
          <input
            ref={urlBarRef}
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter') { navigate(urlInput); } }}
            placeholder="Search or enter URL"
            style={{
              flex: 1, background: 'none', border: 'none', color: '#e8eaed',
              fontSize: 13, outline: 'none', minWidth: 0,
            }}
          />
          {urlInput && (
            <button onClick={() => setUrlInput('')}
              style={{ background: 'none', border: 'none', color: '#5f6368', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Agent status bar */}
      {(busy || statusText) && (
        <div style={{
          padding: '4px 12px', background: '#1a73e8', color: '#fff',
          fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite', flexShrink: 0 }} />
          {statusText || 'Agent is acting in this browser…'}
        </div>
      )}

      {/* ── Browser viewport ─────────────────────────────────────── */}
      <div
        ref={browserAreaRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, position: 'relative', background: '#fff', overflow: 'hidden',
          outline: 'none',
          boxShadow: focused ? 'inset 0 0 0 2px #8ab4f8' : 'none',
          cursor: 'default',
        }}
      >
        {screenshot ? (
          <>
            <img
              ref={imgRef}
              src={screenshot}
              alt="Browser"
              draggable={false}
              onClick={handleScreenClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setMousePos(null)}
              onWheel={handleWheel}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: loading ? 'wait' : 'default' }}
            />

            {/* Virtual mouse cursor */}
            {mousePos && !loading && (
              <div style={{
                position: 'absolute',
                left: `${mousePos.x * 100}%`,
                top: `${mousePos.y * 100}%`,
                width: 16, height: 16, pointerEvents: 'none', transform: 'translate(-2px, -2px)',
              }}>
                {/* Arrow cursor SVG */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2L2 13L5.5 9.5L8 14L9.5 13.3L7 8.5L11.5 8.5L2 2Z" fill="white" stroke="#333" strokeWidth="0.8" />
                </svg>
              </div>
            )}

            {/* Loading shimmer */}
            {loading && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, transparent, #1a73e8, transparent)',
                animation: 'slide 1s linear infinite',
              }} />
            )}
          </>
        ) : (
          /* New Tab page */
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
            background: '#202124', color: '#e8eaed',
          }}>
            <div style={{ fontSize: 48, color: '#5f6368' }}>🌐</div>
            {loading ? (
              <p style={{ fontSize: 14, color: '#9aa0a6' }}>Loading…</p>
            ) : (
              <>
                <p style={{ fontSize: 20, fontWeight: 400, margin: 0 }}>New Tab</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
                  {['google.com', 'youtube.com', 'github.com', 'reddit.com', 'wikipedia.org'].map(site => (
                    <button
                      key={site}
                      onClick={() => navigate(`https://${site}`)}
                      style={{
                        background: '#2b2b2e', border: '1px solid #3c4043', borderRadius: 8,
                        padding: '8px 16px', color: '#e8eaed', fontSize: 13, cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#3c4043'; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#2b2b2e'; }}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Error toast */}
        {lastError && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12, right: 12,
            background: '#ea4335', borderRadius: 8, padding: '8px 12px',
            color: '#fff', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{lastError}</span>
            <button onClick={() => setLastError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Network issues */}
        {networkIssues.some(i => i.status >= 400) && !lastError && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(32,33,36,0.9)', border: '1px solid #3c4043', borderRadius: 8,
            padding: '6px 10px', color: '#9aa0a6', fontSize: 11, backdropFilter: 'blur(4px)',
          }}>
            {networkIssues.slice(-2).map((issue, i) => (
              <div key={i}>
                <span style={{ color: issue.status >= 500 ? '#ea4335' : '#fbbc04', marginRight: 6 }}>{issue.status}</span>
                <span style={{ color: '#9aa0a6' }}>{new URL(issue.url).hostname}</span>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard focus indicator */}
        {focused && sessionId && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            background: 'rgba(26,115,232,0.15)', border: '1px solid #1a73e8',
            borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#8ab4f8',
          }}>
            ⌨ Keyboard active
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
