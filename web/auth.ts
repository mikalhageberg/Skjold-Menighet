import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { harDatabase, hentDb } from "@/lib/db";

/**
 * Innlogging for admin.
 *
 * Brukernavn og passord mot vår egen `administratorer`-tabell. Passordet
 * lagres aldri — bare en argon2-hash. Økten ligger i en signert cookie, så
 * det trengs ingen tabell for økter.
 *
 * Brukernavnet er bevisst ikke en e-postadresse. Adressen ble aldri brukt
 * til å sende noe, bare til å logge inn med, og et brukernavn er kortere å
 * taste. Gamle innlogginger virker som før — der er e-postadressen
 * fortsatt brukernavnet.
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
      credentials: { brukernavn: {}, passord: {} },
      async authorize(oppgitt) {
        if (!harDatabase()) return null;

        const brukernavn = String(oppgitt?.brukernavn ?? "").trim().toLowerCase();
        const passord = String(oppgitt?.passord ?? "");
        if (!brukernavn || !passord) return null;

        const admin = hentDb()
          .prepare(
            `select id, brukernavn, navn, passord_hash
               from administratorer
              where lower(brukernavn) = ?
              limit 1`,
          )
          .get(brukernavn) as
          | { id: string; brukernavn: string; navn: string | null; passord_hash: string }
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

        // Auth.js har ingen plass til et brukernavn, og «email» ville vært
        // et misvisende sted å legge det. Navnet er det eneste vi viser,
        // så brukernavnet trer inn når personen ikke har oppgitt noe navn.
        return { id: admin.id, name: admin.navn ?? admin.brukernavn };
      },
    }),
  ],

  callbacks: {
    authorized: ({ auth: økt }) => Boolean(økt?.user),
  },
});
