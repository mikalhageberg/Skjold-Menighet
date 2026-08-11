import Link from "next/link";
import { demomodus } from "@/lib/auth";
import { loggUt } from "@/app/admin/actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="side">
      {demomodus() && (
        <p className="notis" style={{ marginTop: "1.5rem" }}>
          <strong>Demovisning.</strong> Supabase er ikke koblet til, så data ligger i minnet og
          forsvinner når serveren stopper. Se <code>README.md</code> for oppsett.
        </p>
      )}

      <nav className="admnav">
        <Link href="/admin" className="admnav__lenke">
          Oversikt
        </Link>
        <Link href="/admin/arrangementer" className="admnav__lenke">
          Alle arrangementer
        </Link>
        <Link href="/admin/arrangement/nytt" className="admnav__lenke">
          Nytt arrangement
        </Link>
        <form action={loggUt} className="admnav__ut">
          <button type="submit" className="tekstknapp">
            Logg ut
          </button>
        </form>
      </nav>

      {children}
    </div>
  );
}
