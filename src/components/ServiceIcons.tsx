// Brand icons for connected services — proper SVG logos, not emojis

export function GmailIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
    </svg>
  );
}

export function GoogleCalendarIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1A73E8"/>
      <path d="M5.684 24h12.632v-5.684H5.684V24z" fill="#1A73E8"/>
      <path d="M18.316 5.684V0H5.684v5.684h12.632z" fill="#EA4335"/>
      <path d="M5.684 18.316H0V5.684h5.684v12.632z" fill="#34A853"/>
      <path d="M5.684 5.684H0V0h5.684v5.684z" fill="#188038"/>
      <path d="M18.316 18.316H24V24h-5.684v-5.684z" fill="#FBBC04"/>
      <path d="M18.316 5.684H24V0h-5.684v5.684z" fill="#1967D2"/>
      <path d="M5.684 24H0v-5.684h5.684V24z" fill="#1A73E8"/>
      <path d="M5.684 18.316h12.632V5.684H5.684v12.632z" fill="#fff"/>
      <path d="M8.5 15.3V8.7h1.2l2.8 4.2 2.8-4.2h1.2v6.6h-1.2V10.5L12.5 14h-.5l-2.3-3.5v4.8H8.5z" fill="#1A73E8"/>
    </svg>
  );
}

export function GoogleDriveIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M7.71 0L0 13.39l3.98 6.89L11.69 7.17z" fill="#0066DA"/>
      <path d="M15.96 0H7.71l7.98 13.39h8.25z" fill="#00AC47"/>
      <path d="M0 13.39l3.98 6.89h16.04l3.98-6.89z" fill="#EA4335"/>
      <path d="M15.69 13.39L11.71 20.28h8.25l3.98-6.89z" fill="#00832D"/>
      <path d="M15.96 0l-4.27 7.17 3.98 6.22h8.27z" fill="#2684FC"/>
      <path d="M7.71 0l-3.73 6.28L7.96 13.39l4.27-7.17z" fill="#FFBA00"/>
    </svg>
  );
}

export function GoogleDocsIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M14.727 0H5.455C4.355 0 3.455.9 3.455 2v20c0 1.1.9 2 2 2h13.09c1.1 0 2-.9 2-2V6.273L14.727 0z" fill="#4285F4"/>
      <path d="M14.727 0v4.273c0 1.1.9 2 2 2h4.273L14.727 0z" fill="#A1C2FA"/>
      <path d="M7.455 17.455h9.09v-1.364h-9.09v1.364zm0-2.728h9.09v-1.363h-9.09v1.363zm0-2.727h9.09V10.636h-9.09V12z" fill="#F1F1F1"/>
    </svg>
  );
}

export function GoogleSheetsIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M14.727 0H5.455C4.355 0 3.455.9 3.455 2v20c0 1.1.9 2 2 2h13.09c1.1 0 2-.9 2-2V6.273L14.727 0z" fill="#0F9D58"/>
      <path d="M14.727 0v4.273c0 1.1.9 2 2 2h4.273L14.727 0z" fill="#87CEAC"/>
      <path d="M16.545 17.455H7.455v-6.819h9.09v6.819zm-1.363-5.455h-2.728v1.364h2.728V12zm-4.091 0H8.363v1.364h2.728V12zm4.091 2.727h-2.728v1.364h2.728v-1.364zm-4.091 0H8.363v1.364h2.728v-1.364z" fill="#F1F1F1"/>
    </svg>
  );
}

export function NotionIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.37 2.13c-.42-.326-.98-.7-2.055-.607L3.47 2.71c-.467.047-.56.28-.374.466l1.363 1.032zm.793 2.242v13.891c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V5.63c0-.606-.233-.933-.747-.886l-15.177.84c-.56.047-.748.327-.748.886zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933l3.222-.186zM2.1 1.19L15.69.083c1.682-.14 2.1.28 2.8.793l3.876 2.708c.467.327.607.746.607 1.26v16.06c0 1.026-.374 1.632-1.682 1.726L5.92 23.56c-.98.047-1.448-.093-1.962-.746l-3.13-4.108c-.56-.746-.793-1.306-.793-1.958V2.776c0-.84.374-1.54 1.168-1.633l.897.047z"/>
    </svg>
  );
}

export function SlackIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
      <path d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" fill="#ECB22E"/>
    </svg>
  );
}

export function GitHubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

export function OutlookIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 0 1-.587.234h-8.55V6.575h8.55c.224 0 .42.08.587.238A.773.773 0 0 1 24 7.387z" fill="#0072C6"/>
      <path d="M14.625 6.575v12.1h-8.55a.806.806 0 0 1-.587-.234A.773.773 0 0 1 5.25 17.865V7.387c0-.224.08-.42.238-.576a.806.806 0 0 1 .587-.236h8.55z" fill="#0072C6"/>
      <path d="M0 3.733v16.534a.755.755 0 0 0 .227.56.77.77 0 0 0 .56.23H13.26a.77.77 0 0 0 .56-.23.755.755 0 0 0 .227-.56V3.733a.755.755 0 0 0-.228-.56.77.77 0 0 0-.56-.23H.788a.77.77 0 0 0-.56.23A.755.755 0 0 0 0 3.733z" fill="#0072C6"/>
      <path d="M7.024 7.68c-1.12 0-2.025.407-2.717 1.22-.692.814-1.038 1.856-1.038 3.127 0 1.244.339 2.27 1.017 3.075.678.806 1.563 1.208 2.654 1.208 1.133 0 2.048-.396 2.744-1.188.696-.792 1.044-1.836 1.044-3.132 0-1.27-.338-2.298-1.013-3.086-.675-.789-1.559-1.183-2.654-1.208l-.037-.016zm-.067 1.452c.71 0 1.266.278 1.668.833.402.556.603 1.29.603 2.202 0 .934-.203 1.68-.61 2.237-.406.557-.958.836-1.654.836-.717 0-1.28-.275-1.69-.825-.41-.55-.614-1.29-.614-2.222 0-.925.2-1.665.6-2.222.402-.556.968-.835 1.697-.84z" fill="#fff"/>
    </svg>
  );
}

export function DropboxIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 6.13L6 10.06l6 3.93-6 3.93L0 13.99l6-3.93L0 6.13 6 2.2l6 3.93zm-6 9.79l6 3.93 6-3.93-6-3.93-6 3.93zM12 6.13l6 3.93-6 3.93 6 3.93 6-3.93-6-3.93 6-3.93L18 2.2l-6 3.93z" fill="#0061FF"/>
    </svg>
  );
}

export function LinearIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.064 13.476a.755.755 0 0 1 .191.536c.102 1.395.463 2.726 1.065 3.95a.75.75 0 0 1-.098.836l-.36.36a.75.75 0 0 1-1.167-.1A11.957 11.957 0 0 1 0 12c0-1.09.146-2.147.42-3.15a.75.75 0 0 1 1.209-.364l.36.36a.75.75 0 0 1 .186.726A9.955 9.955 0 0 0 1.89 12c0 .503.037 1.001.11 1.49l-.937-.014zm3.05-9.396a.75.75 0 0 1-.097-.835A11.96 11.96 0 0 1 12 0a11.96 11.96 0 0 1 7.983 3.045.75.75 0 0 1 .006 1.06l-.354.355a.75.75 0 0 1-1.013.04A9.961 9.961 0 0 0 12 2c-2.514 0-4.8.928-6.553 2.458a.75.75 0 0 1-1.014-.018l-.32-.36z" fillRule="evenodd"/>
      <circle cx="12" cy="12" r="5.5"/>
    </svg>
  );
}

export function TwitterIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export function SpotifyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="#1DB954"/>
    </svg>
  );
}

export function YouTubeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff"/>
    </svg>
  );
}

export function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.53 0 .21 5.32.21 11.86c0 2.09.55 4.13 1.58 5.93L0 24l6.4-1.67a11.82 11.82 0 0 0 5.67 1.45h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.14-3.42-8.44z" fill="#25D366"/>
      <path d="M12.08 21.77a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.8.99 1.02-3.7-.24-.38a9.86 9.86 0 1 1 8.43 4.69z" fill="#fff"/>
      <path d="M17.84 14.47c-.31-.16-1.82-.9-2.1-1-.28-.1-.48-.16-.68.16-.2.31-.78 1-.96 1.21-.18.2-.36.23-.67.08-.31-.16-1.31-.48-2.49-1.54-.92-.82-1.54-1.84-1.72-2.15-.18-.31-.02-.48.13-.64.14-.14.31-.36.47-.54.16-.18.2-.31.31-.52.1-.2.05-.39-.03-.54-.08-.16-.68-1.64-.93-2.25-.24-.57-.49-.49-.68-.5h-.58c-.2 0-.52.08-.79.39-.28.31-1.03 1-1.03 2.44 0 1.44 1.05 2.83 1.2 3.02.16.2 2.06 3.14 5 4.41.7.3 1.25.48 1.68.61.71.23 1.35.19 1.86.12.57-.08 1.82-.74 2.08-1.45.26-.72.26-1.33.18-1.46-.08-.13-.28-.2-.59-.36z" fill="#25D366"/>
    </svg>
  );
}

export function LinkIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

export function HomeAssistantIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7.2v9.6L12 22l9-5.2V7.2L12 2Z" fill="#18BCF2" />
      <path d="M12 6.2 7 9.1v5.8l5 2.9 5-2.9V9.1l-5-2.9Z" fill="#fff" opacity="0.92" />
      <path d="M12 8.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Z" fill="#18BCF2" />
    </svg>
  );
}

export function MqttIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12a7 7 0 0 1 14 0" />
      <path d="M8 12a4 4 0 0 1 8 0" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M4 17h4" />
      <path d="M16 17h4" />
    </svg>
  );
}

export function BluetoothBridgeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4l6 4-6 4 6 4-6 4V4Z" />
      <path d="M5 8l10 8" />
      <path d="M5 16 15 8" />
    </svg>
  );
}

export function SmartThingsIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="8" r="4" fill="#15B8FC" />
      <circle cx="16.5" cy="7.5" r="2.5" fill="#0F86F9" />
      <circle cx="15.5" cy="15.5" r="4.5" fill="#5038ED" />
      <circle cx="8" cy="17" r="2" fill="#7A5CFF" />
    </svg>
  );
}

export function AppleHomeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 3.2 4.2 9v10.2h15.6V9L12 3.2Z" fill="#111827" />
      <path d="M8.2 12.2h7.6v5.1H8.2z" fill="#fff" opacity="0.9" />
      <path d="M11 13.3h2v4h-2z" fill="#111827" />
    </svg>
  );
}

export function AlexaIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M19.2 13.1c0 3.8-3.2 6.9-7.2 6.9-4 0-7.2-3.1-7.2-6.9C4.8 9.2 8 6 12 6c4 0 7.2 3.2 7.2 7.1Z" fill="#00CAFF" />
      <path d="M8.2 17.8c1.1 1.7 2.4 2.6 3.8 2.6 2 0 3.9-1.6 5.4-4.7" stroke="#0B3B5A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Map of service ID → icon component
const SERVICE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  gmail: GmailIcon,
  googlecalendar: GoogleCalendarIcon,
  googledrive: GoogleDriveIcon,
  googledocs: GoogleDocsIcon,
  googlesheets: GoogleSheetsIcon,
  notion: NotionIcon,
  slack: SlackIcon,
  github: GitHubIcon,
  outlook: OutlookIcon,
  dropbox: DropboxIcon,
  linear: LinearIcon,
  twitter: TwitterIcon,
  spotify: SpotifyIcon,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
  homeassistant: HomeAssistantIcon,
  mqtt: MqttIcon,
  bluetoothbridge: BluetoothBridgeIcon,
  smartthings: SmartThingsIcon,
  applehome: AppleHomeIcon,
  alexa: AlexaIcon,
};

export function ServiceIcon({ id, className = 'h-4 w-4' }: { id: string; className?: string }) {
  const Icon = SERVICE_ICON_MAP[id] || LinkIcon;
  return <Icon className={className} />;
}
