"use client";
import { useEffect, useRef } from "react";
import type { Listing } from "../lib/data";
export function MapView({ listings }: { listings: Listing[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (document.getElementById("leaflet-css")) return;
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }, []);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let map: { remove: () => void } | null = null;
    const start = () => {
      const L = (window as unknown as { L?: { map: Function; tileLayer: Function; marker: Function } }).L;
      if (!L || !node) return;
      map = L.map(node).setView([6.8, -58.15], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "OpenStreetMap" }).addTo(map);
      listings.forEach((item) => L.marker([item.lat, item.lng]).addTo(map).bindPopup(`<a href='/listings/${item.id}'>${item.title}</a><br>${item.area}`));
    };
    if ((window as unknown as { L?: unknown }).L) start();
    else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = start;
      document.body.appendChild(script);
    }
    return () => map?.remove();
  }, [listings]);
  return <div ref={ref} style={{ height: 520, width: "100%", borderRadius: 12 }} />;
}
