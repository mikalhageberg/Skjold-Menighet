import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { harDatabase } from "./db";

/** Sant når databasen ikke er satt opp – da er admin åpen, med tydelig varsel i grensesnittet. */
export function demomodus() {
  return !harDatabase();
}

export type Innlogget = { id: string; epost: string; navn: string | null };

/** Krever innlogget administrator. Sender til innlogging hvis ikke. */
export async function krevAdmin(): Promise<Innlogget> {
  if (demomodus()) {
    return { id: "demo", epost: "demo@skjold-menighet.no", navn: "Demovisning" };
  }

  const økt = await auth();
  if (!økt?.user) redirect("/admin/logg-inn");

  return {
    id: økt.user.id ?? "",
    epost: økt.user.email ?? "",
    navn: økt.user.name ?? null,
  };
}
