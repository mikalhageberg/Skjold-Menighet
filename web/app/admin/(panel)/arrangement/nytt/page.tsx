import { krevAdmin } from "@/lib/auth";
import { ArrangementSkjema } from "@/components/ArrangementSkjema";

export const dynamic = "force-dynamic";

export default async function NyttArrangement() {
  await krevAdmin();

  return (
    <section className="adm">
      <header className="adm__hode">
        <div>
          <p className="merke">Nytt</p>
          <h1 className="adm__tittel">Legg inn et arrangement</h1>
        </div>
      </header>

      <div className="kort" style={{ marginTop: "2rem", maxWidth: "48rem" }}>
        <ArrangementSkjema />
      </div>
    </section>
  );
}
