import { NextResponse } from "next/server";
import { hentBilde } from "@/lib/data";
import { CORS, forhandsvarsel } from "../../felles";

export const dynamic = "force-dynamic";

/**
 * Det AI-genererte headline-bildet til et arrangement. URL-en tar imot en
 * valgfri ?v=-parameter (arrangementets bilde_generert-tidspunkt) — den
 * endrer seg hver gang bildet byttes ut, så den lange cachen under er trygg.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bilde = await hentBilde(id);
  if (!bilde) {
    return new NextResponse(null, { status: 404, headers: CORS });
  }

  const harVersjon = new URL(request.url).searchParams.has("v");

  return new NextResponse(new Uint8Array(bilde.data), {
    headers: {
      ...CORS,
      "content-type": bilde.mimeType,
      "cache-control": harVersjon
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300",
    },
  });
}

export function OPTIONS() {
  return forhandsvarsel();
}
