import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Code2, Settings, Cpu, Send, Menu, Plus } from 'lucide-react';
import { AgentStudioLogo } from '@/components/AgentStudioLogo';
import { AGENT_MODELS, normalizeAgentModelId } from '@/components/StatusBar';
import { TaskRail } from '@/components/TaskRail';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CanvasEmbed } from '@/components/CanvasEmbed';
import { BrowserView } from '@/components/BrowserView';
import { CodeView } from '@/components/CodeView';
import { CanvasSettings } from '@/components/CanvasSettings';
import { GlobalHeader } from '@/components/GlobalHeader';
import { AccountPage } from '@/components/AccountPage';
import { FloatingChat } from '@/components/FloatingChat';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthModal } from '@/components/AuthModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { refreshTemplateCache } from '@/components/CanvasHome';
import { getCachedTemplate } from '@/lib/templateCache';
import { useSessionManager } from '@/hooks/useSessionManager';
import { detectIntent } from '@/hooks/useIntentDetection';
import { useAgent } from '@/hooks/useAgent';
import { toast } from 'sonner';
import type { ContextType } from '@/types/chat';
import type { AttachedFile } from '@/components/MessageComposer';
import type { User } from '@supabase/supabase-js';

type OverlayMode = 'none' | 'chat' | 'code' | 'settings';

const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';
const APP_SETTINGS_KEY = 'agent-studio.settings.v1';

interface CanvasData {
  id: string;
  url: string;
  embedUrl: string;
  title: string;
  templateId?: string;
}

interface AppSettings {
  defaultModel: string;
  defaultOverlay: Exclude<OverlayMode, 'none'>;
  overlayWidth: number;
  streamPreview: boolean;
  compactMode: boolean;
  reduceMotion: boolean;
  confirmSessionDelete: boolean;
  autoOpenSettingsAfterEdit: boolean;
}

function shouldRouteToVisibleBrowser(message: string): boolean {
  return /(click|open|go to|navigate|search|find|scroll|type|fill|enter|press|submit|sign in|login|log in|use this page|this page|this site|what do you see|summari[sz]e)/i.test(message);
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultModel: 'claude-sonnet-4.6',
  defaultOverlay: 'code',
  overlayWidth: 420,
  streamPreview: true,
  compactMode: false,
  reduceMotion: false,
  confirmSessionDelete: true,
  autoOpenSettingsAfterEdit: false,
};

function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      defaultModel: normalizeAgentModelId(parsed.defaultModel || DEFAULT_APP_SETTINGS.defaultModel),
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [accountInitialTab, setAccountInitialTab] = useState<'usage' | 'appearance' | 'account' | 'connections' | 'bluetooth' | 'plans'>('usage');
  const [user, setUser] = useState<User | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);

  useEffect(() => {
    // Detect OAuth error redirects (Supabase puts errors in the URL hash)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const oauthError = params.get('error_description') || params.get('error');
    if (oauthError) {
      toast.error(`Sign-in failed: ${decodeURIComponent(oauthError.replace(/\+/g, ' '))}`);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (event === 'SIGNED_IN') {
        setShowAuth(false);
        setAccountInitialTab('usage');
        setShowAccount(true);
      }
      if (event === 'SIGNED_OUT') {
        setShowAuth(false);
        setShowAccount(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobile = (matches: boolean) => setIsMobile(matches);

    updateMobile(mediaQuery.matches);
    const handler = (event: MediaQueryListEvent) => updateMobile(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  const isLoggedIn = !!user;
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadAppSettings());
  const [selectedModel, setSelectedModel] = useState(() => loadAppSettings().defaultModel);
  const [activeCanvas, setActiveCanvas] = useState<CanvasData | null>(null);
  const [activeHtml, setActiveHtml] = useState<string | null>(null);
  const [streamingHtml, setStreamingHtml] = useState<string | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [overlayInput, setOverlayInput] = useState('');
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [browserSessionId, setBrowserSessionId] = useState<string | null>(null);
  const [browserRefreshKey, setBrowserRefreshKey] = useState(0);
  const [browserStatus, setBrowserStatus] = useState<string | null>(null);
  const [browserBusy, setBrowserBusy] = useState(false);

  const {
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoading,
    setIsLoading,
    setActiveSessionId,
    createSession,
    addMessage,
    updateMessageMeta,
    updateSessionContext,
    deleteSession,
    setMessages,
  } = useSessionManager();

  const { streamResponse, streamEdit, orchestrateBrowser } = useAgent();
  const [settingsVersion, setSettingsVersion] = useState(0);

  // Show welcome content when no active session
  const showWelcome = !activeSessionId && messages.length === 0 && !activeCanvas && !browserUrl;

  // Canvas restore: only runs when explicitly switching to an existing session via sidebar
  const [restoreSessionId, setRestoreSessionId] = useState<string | null>(null);

  useEffect(() => {
    const syncSettings = (incoming: Partial<AppSettings>) => {
      setAppSettings(prev => ({ ...prev, ...incoming }));
      if (incoming.defaultModel) {
        setSelectedModel(incoming.defaultModel);
      }
    };

    const customHandler = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<AppSettings>>;
      if (customEvent.detail) syncSettings(customEvent.detail);
    };

    const storageHandler = (event: StorageEvent) => {
      if (event.key !== APP_SETTINGS_KEY || !event.newValue) return;
      try {
        syncSettings(JSON.parse(event.newValue) as Partial<AppSettings>);
      } catch {
        // ignore
      }
    };

    window.addEventListener('agent-studio:settings-changed', customHandler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('agent-studio:settings-changed', customHandler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  useEffect(() => {
    if (!restoreSessionId || restoreSessionId !== activeSessionId) return;
    if (!messages.length) return; // Messages still loading from Supabase

    setRestoreSessionId(null);
    for (let i = messages.length - 1; i >= 0; i--) {
      const meta = messages[i].metadata as Record<string, unknown> | undefined;
      const canvas = meta?.canvas as CanvasData | undefined;
      if (canvas?.id) {
        setActiveCanvas(canvas);
        setRailCollapsed(false);
        return;
      }
    }
    // Session has messages but no canvas — that's fine
  }, [restoreSessionId, activeSessionId, messages]);

  // Listen for postMessage from canvas iframes — just log, don't call AI
  // Canvas buttons already have their own JS handlers
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'canvas-action') {
        console.log('[Canvas Action]', e.data.action, e.data.data);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const extractTemplate = useCallback(async (canvasId: string) => {
    try {
      const res = await fetch(`${CANVAS_URL}/api/templates/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasId }),
      });
      if (res.ok) refreshTemplateCache();
    } catch {
      // Silent
    }
  }, []);

  const handleSend = useCallback(async (content: string, files?: AttachedFile[]) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    const metadata: Record<string, unknown> = {};
    if (files && files.length > 0) {
      metadata.files = files.map(f => ({
        name: f.file.name,
        size: f.file.size,
        type: f.file.type,
        url: f.preview || undefined,
      }));
    }

    let fullContent = content;
    if (files && files.length > 0) {
      const fileDescs = files.map(f => {
        const desc = `[Attached: ${f.file.name} (${f.file.type}, ${(f.file.size / 1024).toFixed(0)}KB)]`;
        // Include the actual data URL for images so the AI can use it in file processing APIs
        if (f.preview && f.file.type.startsWith('image/')) {
          return `${desc}\n[File data URL: ${f.preview}]`;
        }
        return desc;
      });
      fullContent = fileDescs.join('\n') + (content ? '\n' + content : '');
    }

    await addMessage('user', fullContent, Object.keys(metadata).length > 0 ? metadata : undefined, currentSessionId);

    if (browserUrl && browserSessionId && shouldRouteToVisibleBrowser(content)) {
      setIsLoading(true);
      setBrowserBusy(true);
      setBrowserStatus('Agent is reading the current page.');
      setRailCollapsed(false);
      setOverlayMode('chat');

      try {
        const result = await orchestrateBrowser(content, selectedModel, browserSessionId, {
          onStep: (label) => setBrowserStatus(label),
          onRefresh: () => setBrowserRefreshKey(key => key + 1),
        });

        const nextUrl = result.finalState?.metadata?.url;
        if (nextUrl) {
          setBrowserUrl(nextUrl);
        }
        setBrowserStatus(result.message);
        await addMessage('assistant', result.message, { browser: { actions: result.actions } }, currentSessionId);
      } catch {
        setBrowserStatus('Browser orchestration failed.');
        await addMessage('assistant', 'I could not complete that browser action on the current page.', undefined, currentSessionId);
      }

      setBrowserBusy(false);
      setIsLoading(false);
      return;
    }

    const intent = detectIntent(content);
    let contextType: ContextType = activeSession?.context_type as ContextType || 'chat';

    if (intent) {
      contextType = intent.type;
      await updateSessionContext(currentSessionId, intent.type,
        intent.type === 'trip' ? `Trip${intent.entities?.destination ? ` to ${intent.entities.destination}` : ''}` :
        intent.type === 'booking' ? 'Restaurant Booking' :
        intent.type === 'media' ? 'Media Creation' :
        intent.type === 'browse' ? 'Browsing' : 'Chat'
      );

      // For browse intent, show the BrowserView immediately
      if (intent.type === 'browse') {
        // Extract URL from message if present, otherwise detect site
        const urlMatch = content.match(/https?:\/\/[^\s]+/);
        const siteMatch = content.match(/\b(youtube|google|reddit|github|twitter|wikipedia|x)\.com\b/i) ||
                          content.match(/\b(youtube|google|reddit|github|twitter|wikipedia)\b/i);
        let browseTarget = urlMatch?.[0] || null;
        if (!browseTarget && siteMatch) {
          const site = siteMatch[1].toLowerCase();
          browseTarget = `https://www.${site}.com`;
        }
        if (!browseTarget && /\b(search|look\s*up|google|find)\b/i.test(content)) {
          // Extract the search query
          const query = content.replace(/\b(search|look\s*up|google|find|for|on the web|on the internet|online)\b/gi, '').trim();
          if (query) browseTarget = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
        if (!browseTarget && /\byoutube\b/i.test(content)) {
          browseTarget = 'https://www.youtube.com';
        }
        setBrowserUrl(browseTarget || 'https://www.google.com');
        setBrowserSessionId(null);
        setBrowserRefreshKey(0);
        setBrowserBusy(false);
        setBrowserStatus('Preparing browser session...');
        setActiveCanvas(null);
        setActiveHtml(null);
        setRailCollapsed(false);
        await addMessage('assistant', `Opening browser${browseTarget ? `: ${browseTarget}` : ''}`, undefined, currentSessionId);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setStreamingHtml(null);
    let fullStream = '';
    try {
      const response = await streamResponse(
        fullContent,
        contextType,
        selectedModel,
        [],
        {
          onCanvasStart: (canvas) => {
            setActiveCanvas(canvas);
            setActiveHtml(null);
            setRailCollapsed(false);
            setOverlayMode(appSettings.defaultOverlay);
          },
          onChunk: (chunk) => {
            fullStream += chunk;
            // Extract HTML inside <canvas-ui> for the code panel
            const tagEnd = fullStream.indexOf('>', fullStream.indexOf('<canvas-ui'));
            if (appSettings.streamPreview && tagEnd >= 0) {
              const htmlSoFar = fullStream.slice(tagEnd + 1).replace(/<\/canvas-ui>[\s\S]*$/, '');
              setStreamingHtml(htmlSoFar);
            }
          },
        }
      );

      setStreamingHtml(null);
      if (response.type === 'canvas' && response.canvas) {
        await addMessage('assistant', response.content, { canvas: response.canvas }, currentSessionId);
        setActiveCanvas(response.canvas);
        setActiveHtml(null);
        setRailCollapsed(false);
        extractTemplate(response.canvas.id);
      } else {
        await addMessage('assistant', response.content, undefined, currentSessionId);
      }
    } catch {
      await addMessage('assistant', 'Sorry, something went wrong. Please try again.', undefined, currentSessionId);
      setStreamingHtml(null);
    }
    setIsLoading(false);
  }, [activeSessionId, activeSession, addMessage, createSession, streamResponse, setIsLoading, updateSessionContext, selectedModel, extractTemplate, appSettings.defaultOverlay, appSettings.streamPreview, browserUrl, browserSessionId, orchestrateBrowser]);

  const handleUseTemplate = useCallback(async (templateId: string) => {
    const tpl = getCachedTemplate(templateId);
    if (!tpl) return;

    // Show instantly via srcdoc — no server round trip
    setActiveHtml(tpl.html);
    setActiveCanvas({ id: '', url: '', embedUrl: '', title: tpl.name, templateId });
    setRailCollapsed(false);

    // Create session + register canvas with server in the background
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    await addMessage('user', `Use template: ${tpl.name}`, undefined, currentSessionId);
    const assistantMsg = await addMessage('assistant', `Here's your ${tpl.name}. You can interact with it or ask me to make changes.`, undefined, currentSessionId);

    // Register with canvas server in background (enables SSE live updates + code editing)
    try {
      const res = await fetch(`${CANVAS_URL}/api/canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: tpl.html, title: tpl.name, type: tpl.category, sessionId: 'agent-studio' }),
      });
      if (res.ok) {
        const data = await res.json();
        const canvas: CanvasData = {
          id: data.canvasId,
          url: data.url,
          embedUrl: data.embedUrl,
          title: tpl.name,
          templateId,
        };
        setActiveCanvas(canvas);
        setActiveHtml(null); // switch to server-backed iframe
        // Save canvas metadata so session restore works when switching back
        if (assistantMsg) {
          updateMessageMeta(assistantMsg.id, { canvas });
        }
      }
    } catch {
      // Keep showing srcdoc version — still works fine
    }
  }, [activeSessionId, createSession, addMessage, updateMessageMeta]);

  // Canvas actions are handled by the canvas's own JS — no AI call needed
  const handleCanvasAction = useCallback((_action: string, _payload: Record<string, unknown>) => {
    // Intentionally no-op: canvas handles its own interactions
  }, []);

  // Edit the current canvas — used by overlay chat (doesn't create a new canvas)
  const handleEditSend = useCallback(async (content: string) => {
    if (!activeCanvas) return;

    // If canvas has no server-side id yet (srcdoc template), register it first
    let canvasId = activeCanvas.id;
    if (!canvasId && activeHtml) {
      try {
        const res = await fetch(`${CANVAS_URL}/api/canvas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: activeHtml, title: activeCanvas.title, type: 'generic', sessionId: 'agent-studio' }),
        });
        if (res.ok) {
          const data = await res.json();
          canvasId = data.canvasId;
          setActiveCanvas(prev => prev ? { ...prev, id: canvasId, url: data.url, embedUrl: data.embedUrl } : prev);
          setActiveHtml(null); // Switch to server-backed iframe
        }
      } catch {
        // Can't register — bail
      }
    }
    if (!canvasId) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    await addMessage('user', content, undefined, currentSessionId);
    setIsLoading(true);
    setStreamingHtml(null);
    setOverlayMode(appSettings.defaultOverlay);

    let fullStream = '';
    try {
      const result = await streamEdit(
        content,
        '', // currentHtml is fetched inside streamEdit from canvas server
        canvasId,
        selectedModel,
        [],
        {
          onChunk: (chunk) => {
            fullStream += chunk;
            // Extract content inside <canvas-patch> for the code panel
            const patchStart = fullStream.indexOf('<canvas-patch');
            if (patchStart >= 0) {
              const tagEnd = fullStream.indexOf('>', patchStart);
              if (appSettings.streamPreview && tagEnd >= 0) {
                const patchSoFar = fullStream.slice(tagEnd + 1).replace(/<\/canvas-patch>[\s\S]*$/, '');
                setStreamingHtml(patchSoFar);
              }
            }
          },
        }
      );

      setStreamingHtml(null);

      if (result.patch) {
        await addMessage('assistant', result.content, { edit: { label: result.label, description: result.description } }, currentSessionId);
        setSettingsVersion(v => v + 1); // Trigger settings panel refresh
        if (appSettings.autoOpenSettingsAfterEdit) {
          setOverlayMode('settings');
        }
      } else {
        await addMessage('assistant', result.content, undefined, currentSessionId);
      }
    } catch {
      await addMessage('assistant', 'Sorry, something went wrong with the edit.', undefined, currentSessionId);
      setStreamingHtml(null);
    }
    setIsLoading(false);
  }, [activeCanvas, activeHtml, activeSessionId, addMessage, createSession, streamEdit, setIsLoading, selectedModel, appSettings.defaultOverlay, appSettings.streamPreview, appSettings.autoOpenSettingsAfterEdit]);

  const handleNewSession = useCallback(() => {
    setShowAccount(false);
    setMobileSessionsOpen(false);
    setActiveSessionId(null);
    setActiveCanvas(null);
    setActiveHtml(null);
    setStreamingHtml(null);
    setBrowserUrl(null);
    setBrowserSessionId(null);
    setBrowserRefreshKey(0);
    setBrowserBusy(false);
    setBrowserStatus(null);
    setOverlayMode('none');
  }, [setActiveSessionId]);

  const handleSelectSession = useCallback((id: string) => {
    setShowAccount(false);
    setMobileSessionsOpen(false);
    setActiveSessionId(id);
    setActiveCanvas(null);
    setActiveHtml(null);
    setBrowserUrl(null);
    setBrowserSessionId(null);
    setBrowserRefreshKey(0);
    setBrowserBusy(false);
    setBrowserStatus(null);
    setMessages([]);
    setOverlayMode('none');
    setRestoreSessionId(id); // Trigger canvas restore after messages load
  }, [setActiveSessionId, setMessages]);

  const toggleOverlay = useCallback((mode: OverlayMode) => {
    setOverlayMode(prev => prev === mode ? 'none' : mode);
  }, []);

  const handleOverlaySend = useCallback(async () => {
    const message = overlayInput.trim();
    if (!message || isLoading) return;

    setOverlayInput('');
    if (activeCanvas) {
      await handleEditSend(message);
      return;
    }

    await handleSend(message);
  }, [overlayInput, isLoading, activeCanvas, handleEditSend, handleSend]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <GlobalHeader
        user={user}
        onAuthClick={() => setShowAuth(true)}
        onAccountClick={(tab) => { setAccountInitialTab((tab as typeof accountInitialTab) || 'usage'); setShowAccount(true); }}
      />
      {isMobile && (
        <div className="h-12 border-b border-border bg-background/95 backdrop-blur-sm flex items-center gap-2 px-3 shrink-0 md:hidden">
          <Sheet open={mobileSessionsOpen} onOpenChange={setMobileSessionsOpen}>
            <SheetTrigger asChild>
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground">
                <Menu className="h-4 w-4" />
                Chats
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-none p-0">
              <SheetHeader className="px-4 py-4 border-b border-border text-left">
                <SheetTitle className="text-sm">Chats</SheetTitle>
              </SheetHeader>
              <div className="p-3 border-b border-border">
                <button
                  onClick={handleNewSession}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </button>
              </div>
              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-2 space-y-1">
                {sessions.map(session => {
                  const isActive = session.id === activeSessionId;

                  return (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isActive ? 'bg-primary/10 text-primary' : 'bg-card text-foreground hover:bg-secondary'
                      }`}
                    >
                      <div className="truncate font-medium">{session.title}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground uppercase tracking-wide">{session.context_type}</div>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1 px-1">
            <div className="truncate text-sm font-medium text-foreground">
              {browserUrl ? 'Browser' : activeCanvas?.title || activeSession?.title || 'New Chat'}
            </div>
          </div>

          <button
            onClick={handleNewSession}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex-1 flex min-h-0">
        <div className="hidden md:flex">
          <TaskRail
            sessions={sessions}
            activeSessionId={activeSessionId}
            collapsed={railCollapsed}
            onToggleCollapse={() => setRailCollapsed(c => !c)}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={(id) => {
              if (appSettings.confirmSessionDelete && !window.confirm('Delete this session permanently?')) {
                return;
              }
              deleteSession(id);
            }}
            onAuthClick={() => isLoggedIn ? (setAccountInitialTab('usage'), setShowAccount(true)) : setShowAuth(true)}
            userEmail={user?.email ?? null}
          />
        </div>

        {/* Main content — single unified area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Canvas/Browser title bar */}
          {!showAccount && (activeCanvas || browserUrl) && (
            <div className="h-11 border-b border-border flex items-center px-2 sm:px-3 gap-1 shrink-0 bg-card/50 z-10">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AgentStudioLogo className="h-4 w-4" />
                <span className="font-medium truncate max-w-[120px] sm:max-w-none">{browserUrl ? 'Browser' : activeCanvas?.title}</span>
              </div>
              <div className="ml-auto flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => toggleOverlay('chat')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    overlayMode === 'chat'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => toggleOverlay('code')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    overlayMode === 'code'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Code</span>
                </button>
                <button
                  onClick={() => toggleOverlay('settings')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    overlayMode === 'settings'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 min-h-0 relative">
            {/* Background layer: account settings / welcome / canvas */}
            <AnimatePresence mode="wait">
              {showAccount && isLoggedIn && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <AccountPage initialTab={accountInitialTab} onClose={() => setShowAccount(false)} />
                </motion.div>
              )}
              {!showAccount && showWelcome && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <WelcomeScreen
                    onSend={handleSend}
                    onUseTemplate={handleUseTemplate}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                  />
                </motion.div>
              )}

              {!showAccount && activeCanvas && !browserUrl && (
                <motion.div
                  key={`canvas-${activeCanvas.id || 'srcdoc'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <CanvasEmbed
                    canvasId={activeCanvas.id || undefined}
                    html={activeHtml || undefined}
                    onCanvasAction={handleCanvasAction}
                  />
                </motion.div>
              )}

              {!showAccount && browserUrl && (
                <motion.div
                  key="browser"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <BrowserView
                    initialUrl={browserUrl}
                    refreshKey={browserRefreshKey}
                    busy={browserBusy}
                    statusText={browserStatus}
                    onSessionReady={(sessionId) => {
                      setBrowserSessionId(sessionId);
                      setBrowserStatus('Browser session is live.');
                    }}
                    onNavigate={(url, title) => {
                      setBrowserUrl(url);
                      setBrowserStatus(title ? `Viewing ${title}` : 'Browser updated.');
                      console.log('[Browser]', title, url);
                    }}
                  />
                </motion.div>
              )}

              {!showAccount && !showWelcome && !activeCanvas && !browserUrl && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center text-muted-foreground">
                    <AgentStudioLogo className="h-8 w-8 mx-auto mb-3 animate-pulse opacity-40" />
                    <p className="text-sm">Working on it...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat/Code overlay panel */}
            <AnimatePresence>
              {!showAccount && overlayMode !== 'none' && (activeCanvas || browserUrl) && (
                <motion.div
                  key={overlayMode}
                  initial={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
                  animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  exit={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className={`absolute bg-card shadow-xl z-20 flex flex-col ${isMobile ? 'inset-x-0 bottom-0 h-[72vh] rounded-t-2xl border-t border-border' : 'inset-y-0 right-0 max-w-[92vw] border-l border-border'}`}
                  style={{ width: isMobile ? '100%' : `${appSettings.overlayWidth}px` }}
                >
                  {overlayMode === 'chat' && (
                    <>
                      <div className="p-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">Chat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-6 w-auto min-w-[120px] border-border bg-secondary text-[11px] px-2 py-0">
                              <SelectValue>
                                {AGENT_MODELS.find(m => m.id === selectedModel)?.label || selectedModel}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {AGENT_MODELS.map(model => (
                                <SelectItem key={model.id} value={model.id} className="text-xs">
                                  <span className="font-medium">{model.label}</span>
                                  <span className="text-muted-foreground ml-1">({model.provider})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                        {messages.map(msg => {
                          const isUser = msg.role === 'user';
                          return (
                            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
                                isUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-foreground'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-secondary rounded-xl px-3 py-2 text-xs text-muted-foreground animate-pulse">
                              Thinking...
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 border-t border-border p-2">
                        <div className="flex gap-2 items-end">
                          <textarea
                            value={overlayInput}
                            onChange={e => setOverlayInput(e.target.value)}
                            placeholder={activeCanvas ? 'Edit this canvas...' : 'Send a command...'}
                            className="flex-1 resize-none rounded-lg bg-secondary border border-border px-3 py-2 text-xs min-h-[36px] max-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
                            rows={1}
                            disabled={isLoading}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                void handleOverlaySend();
                              }
                            }}
                          />
                          <button
                            onClick={() => void handleOverlaySend()}
                            disabled={!overlayInput.trim() || isLoading}
                            className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
                            title="Send"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {overlayMode === 'code' && (
                    <CodeView canvasId={activeCanvas.id || null} streamingHtml={streamingHtml} />
                  )}
                  {overlayMode === 'settings' && (
                    <CanvasSettings canvasId={activeCanvas?.id || null} settingsVersion={settingsVersion} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating chat input — always present, starts centered on welcome, persists over canvas */}
            {!showAccount && !showWelcome && (
              <FloatingChat
                onSend={handleSend}
                isLoading={isLoading}
                startCentered={false}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            )}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
