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
      {status.grunn === "aldri kjørt" ? (
        <>
          <strong>Timesjobben har aldri kjørt.</strong> Serveren skal kjøre den selv et
          minutt etter oppstart og så hver time. Til den gjør det, går ingen påminnelser ut
          dagen før, og du får ingen beskjed når noen ber om Android-appen.
        </>
      ) : (
        <>
          <strong>Timesjobben har stoppet.</strong> Den kjørte sist for {status.timer}{" "}
          {status.timer === 1 ? "time" : "timer"} siden, og skal gå hver time. Så lenge den
          står, går ingen påminnelser ut dagen før. Sjekk at web-tjenesten kjører på
          Railway.
        </>
      )}
    </p>
  );
}
