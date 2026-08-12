import { NextResponse } from "next/server";
import { hentArrangementMedId, hentPameldinger } from "@/lib/data";
import { demomodus } from "@/lib/auth";
import { auth } from "@/auth";
import { dato, klokka, lagSlug } from "@skjold/delt";

/** Frivilliglista som CSV — én rad per frivillig, klar for utskrift eller regneark. */
export async function GET(
  _forespørsel: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!demomodus() && !(await auth())?.user) {
    return new NextResponse("Ikke tilgang", { status: 401 });
  }

  const { id } = await params;
  const arrangement = await hentArrangementMedId(id);
  if (!arrangement) return new NextResponse("Fant ikke arrangementet", { status: 404 });

  const pameldinger = await hentPameldinger(id);

  const rader = [
    ["Navn", "Bidrar med", "Telefon", "E-post", "Meldte seg"],
    ...pameldinger.map((p) => [
      p.navn,
      p.bidrag ?? "",
      p.telefon ?? "",
      p.epost ?? "",
      `${dato(new Date(p.opprettet))} ${klokka(new Date(p.opprettet))}`,
    ]),
  ];

  const csv = rader
    .map((rad) => rad.map((celle) => `"${String(celle).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  const start = new Date(arrangement.starter);
  const filnavn = `${lagSlug(arrangement.tittel)}-${start.toISOString().slice(0, 10)}.csv`;

  // BOM gjør at Excel leser æ, ø og å riktig.
  return new NextResponse("﻿" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filnavn}"`,
      "cache-control": "no-store",
    },
  });
}
