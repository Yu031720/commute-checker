export type Destination = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const STORAGE_KEY = "commute-checker:destinations";
const SELECTED_KEY = "commute-checker:selectedDestinationId";

export function loadDestinations(): Destination[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDestinations(destinations: Destination[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
}

export function addDestination(destination: Omit<Destination, "id">): Destination {
  const destinations = loadDestinations();
  const newDestination: Destination = { ...destination, id: crypto.randomUUID() };
  saveDestinations([...destinations, newDestination]);
  return newDestination;
}

export function removeDestination(id: string) {
  saveDestinations(loadDestinations().filter((d) => d.id !== id));
  if (loadSelectedDestinationId() === id) {
    clearSelectedDestinationId();
  }
}

export function loadSelectedDestinationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELECTED_KEY);
}

export function saveSelectedDestinationId(id: string) {
  window.localStorage.setItem(SELECTED_KEY, id);
}

export function clearSelectedDestinationId() {
  window.localStorage.removeItem(SELECTED_KEY);
}
