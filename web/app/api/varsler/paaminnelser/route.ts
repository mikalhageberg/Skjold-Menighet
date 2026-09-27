import { NextResponse } from "next/server";
import { kjorTimesjobb } from "@/lib/timesjobb";

export const dynamic = "force-dynamic";

/**
 * Kjører timesjobben utenfra. Serveren kjører den selv hver time — se
 * lib/timesjobb.ts — og denne ruta er sikkerhetsnettet GitHub Actions
 * kaller. Beskyttet med CRON_SECRET så ingen andre kan utløse utsending.
 */
export async function GET(forespørsel: Request) {
  const hemmelighet = process.env.CRON_SECRET;
  if (!hemmelighet) {
    return NextResponse.json({ feil: "CRON_SECRET er ikke satt." }, { status: 500 });
  }
  if (forespørsel.headers.get("authorization") !== `Bearer ${hemmelighet}`) {
    return NextResponse.json({ feil: "Ikke tilgang." }, { status: 401 });
  }

  return NextResponse.json(await kjorTimesjobb());
}
