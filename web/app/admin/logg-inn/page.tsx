import { redirect } from "next/navigation";
import { demomodus } from "@/lib/auth";
import { auth } from "@/auth";
import { LoggInnSkjema } from "@/components/LoggInnSkjema";

export const dynamic = "force-dynamic";

export default async function LoggInn() {
  if (demomodus()) redirect("/admin");
  const økt = await auth();
  if (økt?.user) redirect("/admin");

  return (
    <section className="side innlogging">
      <p className="merke">For ansvarlige i Skjold menighet</p>
      <h1 className="kvittering__tittel">Logg inn</h1>
      <p className="stille" style={{ marginBottom: "2rem" }}>
        Her ser du hvem som har meldt seg på, og legger inn nye arrangementer. Har du ikke
        tilgang, ta kontakt med menighetskontoret.
      </p>
      <LoggInnSkjema />
    </section>
  );
}
