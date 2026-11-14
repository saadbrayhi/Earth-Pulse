import Link from "next/link";

export default function SiteHeader({ active }: { active: "example" | "live" }) {
  const tab = (href: string, id: "example" | "live", label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active === id ? "bg-accent text-ink" : "text-text/80 hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-[1100] border-b border-line bg-ink/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="font-semibold">EarthPulse</span>
        </Link>
        <span className="hidden text-sm text-muted md:inline">Water changes, seen from space by radar</span>
        <nav className="ml-auto flex gap-1">
          {tab("/", "example", "Example: Tanguar Haor")}
          {tab("/live", "live", "Check any place")}
        </nav>
      </div>
    </header>
  );
}
