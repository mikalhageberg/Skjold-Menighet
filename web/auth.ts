import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { harDatabase, hentDb } from "@/lib/db";

/**
 * Innlogging for admin.
 *
 * E-post og passord mot vår egen `administratorer`-tabell. Passordet lagres
 * aldri — bare en argon2-hash. Økten ligger i en signert cookie, så det
 * trengs ingen tabell for økter.
 *
 * Brukere legges til med `npm run ny-admin`; det finnes med vilje ingen
 * selvbetjent registrering.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Uten database kjører appen i demomodus, og da logges ingen inn uansett.
  secret: process.env.AUTH_SECRET ?? "bare-for-utvikling-uten-database",
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/admin/logg-inn" },

  providers: [
    Credentials({
      credentials: { epost: {}, passord: {} },
      async authorize(oppgitt) {
        if (!harDatabase()) return null;

        const epost = String(oppgitt?.epost ?? "").trim().toLowerCase();
        const passord = String(oppgitt?.passord ?? "");
        if (!epost || !passord) return null;

        const admin = hentDb()
          .prepare(
            `select id, epost, navn, passord_hash
               from administratorer
              where lower(epost) = ?
              limit 1`,
          )
          .get(epost) as
          | { id: string; epost: string; navn: string | null; passord_hash: string }
          | undefined;
        if (!admin) return null;

        let riktig = false;
        try {
          riktig = await verify(admin.passord_hash, passord);
        } catch {
          return null;
        }
        if (!riktig) return null;

        hentDb()
          .prepare(`update administratorer set sist_innlogget = ? where id = ?`)
          .run(new Date().toISOString(), admin.id);

        return { id: admin.id, email: admin.epost, name: admin.navn };
      },
    }),
  ],

  callbacks: {
    authorized: ({ auth: økt }) => Boolean(økt?.user),
  },
});
