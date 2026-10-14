import { profile } from "@/content/profile";

export function Footer() {
  return (
    <footer className="border-border border-t-2">
      <div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-sm sm:flex-row sm:justify-between">
        <div className="flex gap-4 font-mono">
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            LinkedIn
          </a>
          <a href={`mailto:${profile.email}`} className="hover:text-foreground">
            Email
          </a>
        </div>
        {/* Static, not new Date().getFullYear(): keeps the footer prerenderable
            instead of forcing a dynamic/client render for one digit. Bump yearly. */}
        <p>© 2026 Jordan Faroz</p>
        <p>Built in Jord World</p>
      </div>
    </footer>
  );
}
