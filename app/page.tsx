"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Destination,
  loadDestinations,
  loadSelectedDestinationId,
  saveSelectedDestinationId,
} from "@/lib/destinations";
import type { DrivingRoute } from "@/lib/types";

type Coords = { lat: number; lng: number };

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [origin, setOrigin] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [drivingRoute, setDrivingRoute] = useState<DrivingRoute | null>(null);
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

  const fetchRoute = useCallback(async (o: Coords, dest: Destination) => {
    setLoading(true);
    setRouteError(null);
    setDrivingRoute(null);
    try {
      const res = await fetch(
        `/api/route?originLat=${o.lat}&originLng=${o.lng}&destLat=${dest.lat}&destLng=${dest.lng}`
      );
      const data = await res.json();
      if (res.ok) {
        setDrivingRoute(data as DrivingRoute);
      } else {
        setRouteError(data.error ?? "経路の取得に失敗しました");
      }
    } catch {
      setRouteError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (origin && selectedDestination) {
      fetchRoute(origin, selectedDestination);
    }
  }, [origin, selectedDestination, fetchRoute]);

  function handleSelectDestination(id: string) {
    saveSelectedDestinationId(id);
    setSelectedId(id);
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
          {loading && <p className="text-sm text-black/50">読み込み中...</p>}
          {routeError && <p className="text-sm text-red-600">{routeError}</p>}

          {drivingRoute && (
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
