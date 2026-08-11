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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">目的地の管理</h1>
        <Link href="/" className="text-sm text-blue-600 underline">
          ホームへ
        </Link>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-black/10 p-4">
        <label className="flex flex-col gap-1 text-sm">
          名称
          <input
            className="rounded-md border border-black/20 px-3 py-2"
            placeholder="例: 会社"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          住所
          <input
            className="rounded-md border border-black/20 px-3 py-2"
            placeholder="例: 東京都千代田区丸の内1-1-1"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "追加中..." : "目的地を追加"}
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {destinations.length === 0 && (
          <li className="text-sm text-black/50">まだ目的地が登録されていません</li>
        )}
        {destinations.map((d) => (
          <li
            key={d.id}
            className={`flex items-center justify-between rounded-xl border p-3 ${
              d.id === selectedId ? "border-blue-600 bg-blue-50" : "border-black/10"
            }`}
          >
            <button className="flex-1 text-left" onClick={() => handleSelect(d.id)}>
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-black/50">{d.address}</div>
            </button>
            <button
              onClick={() => handleRemove(d.id)}
              className="ml-3 text-xs text-red-600"
              aria-label={`${d.name}を削除`}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
