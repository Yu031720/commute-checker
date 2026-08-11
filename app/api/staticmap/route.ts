import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const polyline = params.get("polyline");
  const originLat = params.get("originLat");
  const originLng = params.get("originLng");
  const destLat = params.get("destLat");
  const destLng = params.get("destLng");

  if (!polyline || !originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "polyline and origin/dest coordinates are required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "server missing GOOGLE_MAPS_API_KEY" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("size", "640x300");
  url.searchParams.set("scale", "2");
  url.searchParams.set("maptype", "roadmap");
  url.searchParams.append("style", "feature:poi|visibility:off");
  url.searchParams.append("style", "feature:transit|visibility:off");
  url.searchParams.append("markers", `color:0x2563eb|label:A|${originLat},${originLng}`);
  url.searchParams.append("markers", `color:0xef4444|label:B|${destLat},${destLng}`);
  url.searchParams.set("path", `color:0x2563eb|weight:5|enc:${polyline}`);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "地図の取得に失敗しました" }, { status: 502 });
  }

  const imageBuffer = await res.arrayBuffer();
  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "public, max-age=120",
    },
  });
}
