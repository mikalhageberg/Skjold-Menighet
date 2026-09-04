import { timesjobbStatus } from "@/lib/varsling";
import { demomodus } from "@/lib/auth";

/**
 * Sier fra når timesjobben ikke går.
 *
 * Den jobben er det eneste som sender påminnelsen dagen før, og det eneste
 * som gir beskjed om at noen har bedt om Android-appen. Blir den borte,
 * merkes det ingen steder av seg selv — resten av appen ser ut til å
 * virke, for varselet om nye oppgaver går ut ved publisering. Derfor står
 * denne øverst i admin i stedet for å ligge i en logg ingen leser.
 */
export async function Driftsvarsel() {
  if (demomodus()) return null;

  const status = await timesjobbStatus();
  if (status.ok) return null;

  return (
    <p className="notis notis--fare" role="alert" style={{ marginTop: "1.5rem" }}>
      {status.grunn === "mangler nøkkel" ? (
        <>
          <strong>Timesjobben blir avvist.</strong> <code>CRON_SECRET</code> er ikke satt på
          serveren, så kallet slipper ikke inn. Påminnelsen dagen før går da ikke ut, og du
          får ingen beskjed når noen ber om Android-appen.
        </>
      ) : status.grunn === "aldri kjørt" ? (
        <>
          <strong>Timesjobben har aldri kjørt.</strong> Ingen kaller{" "}
          <code>/api/varsler/paaminnelser</code>. Påminnelsen dagen før har dermed ikke gått
          ut til noen, og du får ingen beskjed når noen ber om Android-appen. Se{" "}
          <code>README.md</code> — den skal settes opp én gang, i GitHub Actions eller som en
          cron-jobb på Railway.
        </>
      ) : (
        <>
          <strong>Timesjobben har stoppet.</strong> Den kjørte sist for {status.timer}{" "}
          {status.timer === 1 ? "time" : "timer"} siden, og skal gå hver time. Så lenge den
          står, går ingen påminnelser ut dagen før.
        </>
      )}
    </p>
  );
}
