import { NextResponse } from "next/server";

/**
 * Appen kjører fra en annen origin enn nettsiden. På telefonen spiller CORS
 * ingen rolle, men under utvikling kjører Expo i nettleser — derfor headerne.
 */
export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, x-pamelding-id",
};

export function apiSvar(kropp: unknown, status = 200) {
  return NextResponse.json(kropp, {
    status,
    headers: { ...CORS, "cache-control": "no-store" },
  });
}

export function forhandsvarsel() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
