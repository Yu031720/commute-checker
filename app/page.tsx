"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Destination,
  loadDestinations,
  loadSelectedDestinationId,
  saveSelectedDestinationId,
} from "@/lib/destinations";
import type { DrivingRoute, LineDelay, TransitRoute } from "@/lib/types";

type Coords = { lat: number; lng: number };

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"transit" | "driving">("transit");

  const [origin, setOrigin] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [transitRoute, setTransitRoute] = useState<TransitRoute | null>(null);
  const [drivingRoute, setDrivingRoute] = useState<DrivingRoute | null>(null);
  const [delays, setDelays] = useState<LineDelay[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    setDestinations(loadDestinations());
    setSelectedId(loadSelectedDestinationId());
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("この端末では位置情報が利用できません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError("位置情報を取得できませんでした。設定で許可してください"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const selectedDestination = useMemo(
    () => destinations.find((d) => d.id === selectedId) ?? null,
    [destinations, selectedId]
  );

  const fetchRoutes = useCallback(async (o: Coords, dest: Destination) => {
    setLoading(true);
    setRouteError(null);
    setTransitRoute(null);
    setDrivingRoute(null);
    setDelays([]);
    try {
      const [transitRes, drivingRes] = await Promise.all([
        fetch(`/api/route?originLat=${o.lat}&originLng=${o.lng}&destLat=${dest.lat}&destLng=${dest.lng}&mode=transit`),
        fetch(`/api/route?originLat=${o.lat}&originLng=${o.lng}&destLat=${dest.lat}&destLng=${dest.lng}&mode=driving`),
      ]);
      const [transitData, drivingData] = await Promise.all([transitRes.json(), drivingRes.json()]);

      if (transitRes.ok) {
        setTransitRoute(transitData as TransitRoute);
        const lineNames = Array.from(new Set((transitData as TransitRoute).steps.map((s) => s.lineName)));
        if (lineNames.length > 0) {
          const delaysRes = await fetch(`/api/delays?lines=${encodeURIComponent(lineNames.join(","))}`);
          if (delaysRes.ok) {
            setDelays(await delaysRes.json());
          }
        }
      }
      if (drivingRes.ok) {
        setDrivingRoute(drivingData as DrivingRoute);
      }
      if (!transitRes.ok && !drivingRes.ok) {
        setRouteError(transitData.error ?? drivingData.error ?? "経路の取得に失敗しました");
      }
    } catch {
      setRouteError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (origin && selectedDestination) {
      fetchRoutes(origin, selectedDestination);
    }
  }, [origin, selectedDestination, fetchRoutes]);

  function handleSelectDestination(id: string) {
    saveSelectedDestinationId(id);
    setSelectedId(id);
  }

  function delayFor(lineName: string): LineDelay | undefined {
    return delays.find((d) => d.lineName === lineName);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">今日の通勤</h1>
        <Link href="/destinations" className="text-sm text-blue-600 underline">
          目的地を管理
        </Link>
      </div>

      {destinations.length === 0 ? (
        <div className="rounded-xl border border-black/10 p-4 text-sm text-black/60">
          まだ目的地が登録されていません。
          <Link href="/destinations" className="ml-1 text-blue-600 underline">
            目的地を追加する
          </Link>
        </div>
      ) : (
        <select
          className="rounded-md border border-black/20 px-3 py-2 text-sm"
          value={selectedId ?? ""}
          onChange={(e) => handleSelectDestination(e.target.value)}
        >
          <option value="" disabled>
            目的地を選択
          </option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )}

      {locationError && <p className="text-sm text-red-600">{locationError}</p>}

      {selectedDestination && (
        <>
          <div className="flex gap-2">
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                tab === "transit" ? "bg-blue-600 text-white" : "bg-black/5"
              }`}
              onClick={() => setTab("transit")}
            >
              電車
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                tab === "driving" ? "bg-blue-600 text-white" : "bg-black/5"
              }`}
              onClick={() => setTab("driving")}
            >
              車
            </button>
          </div>

          {loading && <p className="text-sm text-black/50">読み込み中...</p>}
          {routeError && <p className="text-sm text-red-600">{routeError}</p>}

          {tab === "transit" && transitRoute && (
            <div className="flex flex-col gap-3 rounded-xl border border-black/10 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold">{transitRoute.durationText}</span>
                {transitRoute.arrivalTimeText && (
                  <span className="text-sm text-black/50">到着 {transitRoute.arrivalTimeText}</span>
                )}
              </div>
              {transitRoute.fareText && <p className="text-sm text-black/50">運賃 {transitRoute.fareText}</p>}
              <ul className="flex flex-col gap-2">
                {transitRoute.steps.map((step, i) => {
                  const delay = delayFor(step.lineName);
                  return (
                    <li key={i} className="rounded-lg bg-black/5 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{step.lineName}</span>
                        <DelayBadge delay={delay} />
                      </div>
                      <div className="mt-1 text-xs text-black/50">
                        {step.departureStop} → {step.arrivalStop}
                      </div>
                      {delay?.text && <div className="mt-1 text-xs text-amber-700">{delay.text}</div>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {tab === "driving" && drivingRoute && (
            <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold">
                  {drivingRoute.durationInTrafficText ?? drivingRoute.durationText}
                </span>
                <span className="text-sm text-black/50">{drivingRoute.distanceText}</span>
              </div>
              {drivingRoute.durationInTrafficText &&
                drivingRoute.durationInTrafficText !== drivingRoute.durationText && (
                  <p className="text-xs text-black/50">通常時 {drivingRoute.durationText}</p>
                )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function DelayBadge({ delay }: { delay?: LineDelay }) {
  if (!delay) return null;
  const styles: Record<string, string> = {
    normal: "bg-green-100 text-green-700",
    delay: "bg-red-100 text-red-700",
    unmapped: "bg-black/5 text-black/40",
    unknown: "bg-black/5 text-black/40",
  };
  const labels: Record<string, string> = {
    normal: "平常運転",
    delay: "遅延あり",
    unmapped: "情報対象外",
    unknown: "取得失敗",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[delay.status]}`}>
      {labels[delay.status]}
    </span>
  );
}
