import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { demomodus } from "@/lib/auth";
import { hentTestere } from "@/lib/testere";

/**
 * Fila som lastes opp i Play Console under den lukkede testen.
 *
 * Google vil ha én e-postadresse per linje og ingen overskriftsrad — alt
 * annet, som en «E-post»-kolonne øverst, blir lest som en adresse og
 * avvist. Ingen BOM heller, av samme grunn.
 *
 * Bare de som ennå ikke er lagt inn er med. Etter at den ansvarlige har
 * trykt «Lagt til alle foreløpige e-poster» er fila tom igjen.
 */
export async function GET() {
  if (!demomodus() && !(await auth())?.user) {
    return new NextResponse("Ikke tilgang", { status: 401 });
  }

  const { ventende } = await hentTestere();
  const csv = ventende.map((t) => t.epost).join("\r\n") + (ventende.length > 0 ? "\r\n" : "");
  const filnavn = `skjold-android-testere-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filnavn}"`,
      "cache-control": "no-store",
    },
  });
}
