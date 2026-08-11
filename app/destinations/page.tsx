"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Destination,
  addDestination,
  loadDestinations,
  loadSelectedDestinationId,
  removeDestination,
  saveSelectedDestinationId,
} from "@/lib/destinations";

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDestinations(loadDestinations());
    setSelectedId(loadSelectedDestinationId());
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "住所の変換に失敗しました");
        return;
      }
      const created = addDestination({
        name: name.trim(),
        address: data.formattedAddress,
        lat: data.lat,
        lng: data.lng,
      });
      setDestinations(loadDestinations());
      if (!selectedId) {
        saveSelectedDestinationId(created.id);
        setSelectedId(created.id);
      }
      setName("");
      setAddress("");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRemove(id: string) {
    removeDestination(id);
    setDestinations(loadDestinations());
    setSelectedId(loadSelectedDestinationId());
  }

  function handleSelect(id: string) {
    saveSelectedDestinationId(id);
    setSelectedId(id);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 pb-10">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold tracking-tight">目的地の管理</h1>
        <Link
          href="/"
          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"
        >
          ホームへ
        </Link>
      </header>

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-300">名称</span>
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="例: 会社"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-300">住所</span>
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="例: 東京都千代田区丸の内1-1-1"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {submitting ? "追加中..." : "目的地を追加"}
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {destinations.length === 0 && (
          <li className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
            まだ目的地が登録されていません
          </li>
        )}
        {destinations.map((d) => {
          const active = d.id === selectedId;
          return (
            <li
              key={d.id}
              className={`flex items-center gap-3 rounded-2xl p-3.5 shadow-sm ring-1 transition-colors ${
                active
                  ? "bg-blue-50 ring-blue-300 dark:bg-blue-950/40 dark:ring-blue-800"
                  : "bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
              }`}
            >
              <button className="flex flex-1 items-center gap-3 text-left" onClick={() => handleSelect(d.id)}>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}
                >
                  {active ? "✓" : "📍"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.name}</span>
                  <span className="block truncate text-xs text-slate-400 dark:text-slate-500">{d.address}</span>
                </span>
              </button>
              <button
                onClick={() => handleRemove(d.id)}
                className="shrink-0 rounded-full p-2 text-slate-300 hover:text-rose-500 dark:text-slate-600"
                aria-label={`${d.name}を削除`}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
