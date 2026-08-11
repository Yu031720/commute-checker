import { NextRequest, NextResponse } from "next/server";
import type { DrivingRoute } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const originLat = params.get("originLat");
  const originLng = params.get("originLng");
  const destLat = params.get("destLat");
  const destLng = params.get("destLng");

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "origin/dest coordinates are required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "server missing GOOGLE_MAPS_API_KEY" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", `${originLat},${originLng}`);
  url.searchParams.set("destination", `${destLat},${destLng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("departure_time", "now");
  url.searchParams.set("traffic_model", "best_guess");
  url.searchParams.set("language", "ja");
  url.searchParams.set("region", "jp");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.routes?.length) {
    return NextResponse.json({ error: `経路が見つかりませんでした (${data.status})` }, { status: 404 });
  }

  const leg = data.routes[0].legs[0];
  const result: DrivingRoute = {
    mode: "driving",
    durationText: leg.duration?.text ?? "",
    durationValue: leg.duration?.value ?? 0,
    durationInTrafficText: leg.duration_in_traffic?.text ?? null,
    durationInTrafficValue: leg.duration_in_traffic?.value ?? null,
    distanceText: leg.distance?.text ?? "",
  };
  return NextResponse.json(result);
}
