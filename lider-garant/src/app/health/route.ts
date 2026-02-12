import { NextResponse } from "next/server";

const okResponse = () =>
  new NextResponse("ok", {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export function GET() {
  return okResponse();
}

export function HEAD() {
  return okResponse();
}
