import { NextRequest, NextResponse } from "next/server";

import { drawDailyFortune } from "@/lib/fortune";

export function GET(request: NextRequest): NextResponse {
  const category = request.nextUrl.searchParams.get("category") ?? "love";
  const wallet = request.nextUrl.searchParams.get("wallet") ?? undefined;

  const draw = drawDailyFortune({ category, wallet });

  return NextResponse.json(draw, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
