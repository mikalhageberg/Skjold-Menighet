/**
 * Kjøres én gang når serveren starter.
 *
 * Starter timesjobben inne i serveren. Bare i Node — ikke i edge — og
 * bare i den ekte serveren: under `next dev` ville den ellers sendt ekte
 * påminnelser fra en utviklingsmaskin hver time.
 *
 * Importen må ligge inne i betingelsen, ikke etter en tidlig return. Next
 * bytter ut begge variablene med faste verdier når den bygger, og da
 * dropper den en gren som aldri kan slå til — men bare når grenen er en
 * if. Ellers følger edge-bygget importen helt ned til better-sqlite3, som
 * ikke finnes der, og under `next dev` svarer da hele serveren 500.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { planleggTimesjobb } = await import("./lib/timesjobb");
    planleggTimesjobb();
  }
}
