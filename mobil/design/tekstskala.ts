import { useWindowDimensions } from "react-native";
import { STOR_TEKST } from "./tema";

/**
 * Tekststørrelsen brukeren har valgt i innstillingene på telefonen — 1 er
 * normal, 2 er dobbelt. Oppdateres med én gang den endres, uten at appen
 * må startes på nytt.
 *
 * `stor` er der oppsett som står side om side bør legge seg under
 * hverandre; se STOR_TEKST.
 */
export function useTekstskala() {
  const { fontScale } = useWindowDimensions();
  return { skala: fontScale, stor: fontScale >= STOR_TEKST };
}
