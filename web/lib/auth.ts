import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { harDatabase } from "./db";

/** Sant når databasen ikke er satt opp – da er admin åpen, med tydelig varsel i grensesnittet. */
export function demomodus() {
  return !harDatabase();
}

export type Innlogget = { id: string; navn: string };

/** Krever innlogget administrator. Sender til innlogging hvis ikke. */
export async function krevAdmin(): Promise<Innlogget> {
  if (demomodus()) {
    return { id: "demo", navn: "Demovisning" };
  }

  const økt = await auth();
  if (!økt?.user) redirect("/admin/logg-inn");

  return { id: økt.user.id ?? "", navn: økt.user.name ?? "Administrator" };
}
