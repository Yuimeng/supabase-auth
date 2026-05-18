export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-grid px-4">
      <span className="font-heading mb-10 text-xs font-semibold tracking-[0.25em] text-text-muted uppercase">
        Studio
      </span>
      <div className="w-full max-w-sm rounded-xl border border-border-primary bg-bg-surface p-8 shadow-2xl shadow-black/40">
        {children}
      </div>
    </div>
  )
}
