import { meldAv } from "@/lib/pamelding";
import { apiSvar, forhandsvarsel } from "../../felles";

export const dynamic = "force-dynamic";

/** Avmelding fra appen. Telefonen er det eneste som husker påmeldings-IDen. */
export async function DELETE(
  _forespørsel: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return apiSvar({ ok: false, feil: "Ugyldig forespørsel." }, 400);

  const svar = await meldAv(id);
  return apiSvar(svar, svar.ok ? 200 : 400);
}

export function OPTIONS() {
  return forhandsvarsel();
}
