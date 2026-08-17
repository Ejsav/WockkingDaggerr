import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";
import { logInfo } from "@/lib/log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...sessionCookieOptions(0), value: "" });
  logInfo("admin.logout");
  return res;
}
