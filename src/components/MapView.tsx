"use client";
import { useEffect, useRef } from "react";
import type { Listing } from "../lib/data";

export function MapView({ listings }: { listings: Listing[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as unknown as { L: any }).L;
      if (!ref.current || ref.current.dataset.ready) return;
      ref.current.dataset.ready = "1";
      const map = L.map(ref.current).setView([6.8, -58.15], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "OpenStreetMap" }).addTo(map);
      listings.forEach((item) => L.marker([item.lat, item.lng]).addTo(map).bindPopup(`${item.title}<br>${item.area}`));
    };
    document.body.appendChild(script);
  }, [listings]);
  return <div ref={ref} style={{ height: 480, width: "100%" }} />;
}
