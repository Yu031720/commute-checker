import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "server missing GOOGLE_MAPS_API_KEY" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("language", "ja");
  url.searchParams.set("region", "jp");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) {
    return NextResponse.json({ error: `住所が見つかりませんでした (${data.status})` }, { status: 404 });
  }

  const result = data.results[0];
  return NextResponse.json({
    formattedAddress: result.formatted_address as string,
    lat: result.geometry.location.lat as number,
    lng: result.geometry.location.lng as number,
  });
}
