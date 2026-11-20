import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { hentArrangementMedId, hentPameldinger } from "@/lib/data";
import { demomodus } from "@/lib/auth";
import { auth } from "@/auth";
import { dato, klokka, lagSlug } from "@skjold/delt";

/** Frivilliglista som Excel-fil — én rad per frivillig, klar for utskrift eller regneark. */
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

  const bok = new ExcelJS.Workbook();
  const ark = bok.addWorksheet("Frivillige", {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  // Telefonnummeret lagres som tekst, så Excel ikke kutter ledende null eller +47.
  ark.columns = [
    { header: "Navn", key: "navn", width: 28 },
    { header: "Bidrar med", key: "bidrag", width: 30 },
    { header: "Telefon", key: "telefon", width: 16, style: { numFmt: "@" } },
    { header: "E-post", key: "epost", width: 32 },
    { header: "Meldte seg", key: "meldte", width: 18 },
  ];
  ark.getRow(1).font = { bold: true };

  for (const p of pameldinger) {
    const opprettet = new Date(p.opprettet);
    ark.addRow({
      navn: p.navn,
      bidrag: p.bidrag ?? "",
      telefon: p.telefon ?? "",
      epost: p.epost ?? "",
      meldte: `${dato(opprettet)} ${klokka(opprettet)}`,
    });
  }

  const innhold = await bok.xlsx.writeBuffer();

  const start = new Date(arrangement.starter);
  const filnavn = `${lagSlug(arrangement.tittel)}-${start.toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(innhold as ArrayBuffer, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${filnavn}"`,
      "cache-control": "no-store",
    },
  });
}
