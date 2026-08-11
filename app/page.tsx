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

type Congestion = {
  label: string;
  badgeClass: string;
  cardClass: string;
  gaugeClass: string;
  pct: number;
};

function congestionOf(route: DrivingRoute): Congestion {
  if (!route.durationInTrafficValue || !route.durationValue) {
    return {
      label: "通常",
      badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      cardClass: "from-slate-500 to-slate-600",
      gaugeClass: "bg-white",
      pct: 100,
    };
  }
  const pct = Math.round((route.durationInTrafficValue / route.durationValue) * 100);
  if (pct <= 110) {
    return {
      label: "順調",
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      cardClass: "from-emerald-500 to-emerald-600",
      gaugeClass: "bg-white",
      pct,
    };
  }
  if (pct <= 130) {
    return {
      label: "やや混雑",
      badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      cardClass: "from-amber-500 to-amber-600",
      gaugeClass: "bg-white",
      pct,
    };
  }
  return {
    label: "混雑",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    cardClass: "from-rose-500 to-rose-600",
    gaugeClass: "bg-white",
    pct,
  };
}

function deltaMinutesOf(route: DrivingRoute): number {
  if (!route.durationInTrafficValue || !route.durationValue) return 0;
  return Math.round((route.durationInTrafficValue - route.durationValue) / 60);
}

function arrivalTimeText(route: DrivingRoute): string {
  const seconds = route.durationInTrafficValue ?? route.durationValue;
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function staticMapUrl(route: DrivingRoute, origin: Coords, dest: Destination): string {
  const params = new URLSearchParams({
    polyline: route.overviewPolyline,
    originLat: String(origin.lat),
    originLng: String(origin.lng),
    destLat: String(dest.lat),
    destLng: String(dest.lng),
  });
  return `/api/staticmap?${params.toString()}`;
}

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [origin, setOrigin] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [drivingRoute, setDrivingRoute] = useState<DrivingRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setDestinations(loadDestinations());
    setSelectedId(loadSelectedDestinationId());
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("この端末では位置情報が利用できません");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError("位置情報を取得できませんでした。設定で許可してください"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const selectedDestination = useMemo(
    () => destinations.find((d) => d.id === selectedId) ?? null,
    [destinations, selectedId]
  );

  const fetchRoute = useCallback(async (o: Coords, dest: Destination) => {
    setLoading(true);
    setRouteError(null);
    try {
      const res = await fetch(
        `/api/route?originLat=${o.lat}&originLng=${o.lng}&destLat=${dest.lat}&destLng=${dest.lng}`
      );
      const data = await res.json();
      if (res.ok) {
        setDrivingRoute(data as DrivingRoute);
        setUpdatedAt(new Date());
        setMapLoaded(false);
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
    setDrivingRoute(null);
  }

  function handleRefresh() {
    requestLocation();
    if (origin && selectedDestination) {
      fetchRoute(origin, selectedDestination);
    }
  }

  const congestion = drivingRoute ? congestionOf(drivingRoute) : null;
  const deltaMinutes = drivingRoute ? deltaMinutesOf(drivingRoute) : 0;
  const gaugeFillPct = congestion ? Math.min(100, Math.max(0, ((congestion.pct - 100) / 80) * 100)) : 0;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4 pb-10">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
          </p>
          <h1 className="text-xl font-bold tracking-tight">今日の通勤</h1>
        </div>
        <Link
          href="/destinations"
          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"
        >
          目的地を管理
        </Link>
      </header>

      {destinations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <span className="text-3xl">🚗</span>
          <p className="text-sm text-slate-500 dark:text-slate-400">まだ目的地が登録されていません</p>
          <Link
            href="/destinations"
            className="mt-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            目的地を追加する
          </Link>
        </div>
      ) : (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {destinations.map((d) => {
            const active = d.id === selectedId;
            return (
              <button
                key={d.id}
                onClick={() => handleSelectDestination(d.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"
                }`}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      )}

      {locationError && (
        <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          <span>{locationError}</span>
          <button onClick={requestLocation} className="font-medium underline underline-offset-2">
            再試行
          </button>
        </div>
      )}

      {selectedDestination && (
        <>
          {routeError && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">
              {routeError}
            </p>
          )}

          {loading && !drivingRoute && (
            <div className="animate-pulse-soft rounded-2xl bg-slate-200 p-6 dark:bg-slate-800">
              <div className="mb-3 h-3 w-16 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="mb-2 h-9 w-32 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="h-3 w-24 rounded bg-slate-300 dark:bg-slate-700" />
            </div>
          )}

          {drivingRoute && congestion && origin && (
            <div
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg ${congestion.cardClass}`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                  {congestion.label}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="更新"
                  className="rounded-full bg-white/20 p-1.5 backdrop-blur-sm disabled:opacity-50"
                >
                  <span className={loading ? "inline-block animate-spin" : ""}>⟳</span>
                </button>
              </div>

              <p className="mt-4 text-4xl font-bold tracking-tight">
                {drivingRoute.durationInTrafficText ?? drivingRoute.durationText}
              </p>

              <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
                {deltaMinutes > 0 ? `+${deltaMinutes}分(通常より)` : "遅れなし"}
              </span>

              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className={`h-full rounded-full ${congestion.gaugeClass} transition-all`}
                    style={{ width: `${gaugeFillPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-white/70">通常比 {congestion.pct}%</p>
              </div>

              <p className="mt-4 text-sm text-white/80">
                到着予定 {arrivalTimeText(drivingRoute)}・{drivingRoute.distanceText}
              </p>

              {drivingRoute.overviewPolyline && (
                <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl bg-white/10">
                  {!mapLoaded && <div className="absolute inset-0 animate-pulse-soft bg-white/10" />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={staticMapUrl(drivingRoute, origin, selectedDestination)}
                    alt="経路地図"
                    className="h-full w-full object-cover"
                    onLoad={() => setMapLoaded(true)}
                  />
                </div>
              )}

              {updatedAt && (
                <p className="mt-4 text-[11px] text-white/60">
                  {updatedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} 時点の情報
                </p>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
