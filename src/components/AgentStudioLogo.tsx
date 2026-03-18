// Custom Agent Studio logo — an "A" with sparkle/circuit motif in brand purple
export function AgentStudioLogo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rounded square background */}
      <rect width="32" height="32" rx="8" fill="url(#as-grad)" />
      {/* Stylized "A" letterform */}
      <path
        d="M16 6L8 26h3.5l1.8-4.5h5.4L20.5 26H24L16 6zm-1.6 12.5L16 12.8l1.6 5.7h-3.2z"
        fill="#fff"
      />
      {/* Sparkle dots */}
      <circle cx="24" cy="8" r="1.5" fill="#fff" opacity="0.9" />
      <circle cx="26" cy="12" r="1" fill="#fff" opacity="0.6" />
      <circle cx="22" cy="6" r="0.8" fill="#fff" opacity="0.5" />
      <defs>
        <linearGradient id="as-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
