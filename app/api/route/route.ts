import { NextRequest, NextResponse } from "next/server";
import type { DrivingRoute, TransitRoute, TransitStep } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const originLat = params.get("originLat");
  const originLng = params.get("originLng");
  const destLat = params.get("destLat");
  const destLng = params.get("destLng");
  const mode = params.get("mode");

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "origin/dest coordinates are required" }, { status: 400 });
  }
  if (mode !== "transit" && mode !== "driving") {
    return NextResponse.json({ error: "mode must be transit or driving" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "server missing GOOGLE_MAPS_API_KEY" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", `${originLat},${originLng}`);
  url.searchParams.set("destination", `${destLat},${destLng}`);
  url.searchParams.set("mode", mode);
  url.searchParams.set("departure_time", "now");
  url.searchParams.set("language", "ja");
  url.searchParams.set("region", "jp");
  if (mode === "driving") {
    url.searchParams.set("traffic_model", "best_guess");
  }
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.routes?.length) {
    return NextResponse.json({ error: `経路が見つかりませんでした (${data.status})` }, { status: 404 });
  }

  const leg = data.routes[0].legs[0];

  if (mode === "transit") {
    const steps: TransitStep[] = (leg.steps as GoogleStep[])
      .filter((step) => step.travel_mode === "TRANSIT")
      .map((step) => ({
        lineName: step.transit_details?.line?.name ?? "不明な路線",
        vehicleType: step.transit_details?.line?.vehicle?.type ?? "",
        departureStop: step.transit_details?.departure_stop?.name ?? "",
        arrivalStop: step.transit_details?.arrival_stop?.name ?? "",
        departureTime: step.transit_details?.departure_time?.text ?? null,
        arrivalTime: step.transit_details?.arrival_time?.text ?? null,
      }));

    const result: TransitRoute = {
      mode: "transit",
      durationText: leg.duration?.text ?? "",
      durationValue: leg.duration?.value ?? 0,
      arrivalTimeText: leg.arrival_time?.text ?? null,
      fareText: data.routes[0].fare?.text ?? null,
      steps,
    };
    return NextResponse.json(result);
  }

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

type GoogleStep = {
  travel_mode: string;
  transit_details?: {
    line?: { name?: string; vehicle?: { type?: string } };
    departure_stop?: { name?: string };
    arrival_stop?: { name?: string };
    departure_time?: { text?: string };
    arrival_time?: { text?: string };
  };
};
