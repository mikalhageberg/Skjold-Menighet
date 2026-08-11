import type { Metadata } from "next";
import { Fraunces, Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-display",
  display: "swap",
});

const tekst = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-tekst",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Skjold menighet — arrangementer og påmelding",
    template: "%s — Skjold menighet",
  },
  description:
    "Se hva som skjer i Skjold kirke, og meld på deg selv eller noen du kjenner.",
};

export default function RotLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className={`${display.variable} ${tekst.variable}`}>
      <body>
        <header className="topp">
          <div className="topp__rad">
            <Link href="/" className="topp__navn">
              Skjold menighet
            </Link>
            {/* Navnet lenker allerede hjem, så «Hva skjer» ville sagt det samme to ganger. */}
            <nav className="topp__lenker">
              <Link href="/admin" className="topp__lenke">
                For ansvarlige
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="bunn">
          <div className="bunn__rad">
            <p>Skjold kirke · Kyrkjevegen 12 · 5574 Skjold</p>
            <p>Menighetskontoret: 52 76 12 00</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
