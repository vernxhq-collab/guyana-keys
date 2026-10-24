"use client";
import { useEffect, useRef } from "react";
import { centerForArea } from "../lib/areas";
import type { Listing } from "../lib/data";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

function plot(listing: Listing, index: number) {
  if (listing.pinned !== false) return { lat: listing.lat, lng: listing.lng, approximate: false };
  const center = centerForArea(listing.area);
  if (!center) return null;
  const angle = index * 0.9;
  const radius = 0.003 * (1 + (index % 4));
  return { lat: center.lat + Math.cos(angle) * radius, lng: center.lng + Math.sin(angle) * radius, approximate: true };
}

export function MapView({ listings, height = 520 }: { listings: Listing[]; height?: number }) {
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
    let map: { remove: () => void; fitBounds: (bounds: unknown, options: object) => void } | null = null;
    const start = () => {
      const L = (window as unknown as { L?: { map: Function; tileLayer: Function; marker: Function; latLngBounds: Function } }).L;
      if (!L || !node) return;
      map = L.map(node).setView([6.8, -58.15], 8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      const points: [number, number][] = [];
      listings.forEach((item, index) => {
        const where = plot(item, index);
        if (!where) return;
        points.push([where.lat, where.lng]);
        const place = where.approximate ? "<br>Shown for the area, not the exact lot." : "";
        L.marker([where.lat, where.lng]).addTo(map).bindPopup(`<a href='/listings/${escapeHtml(item.id)}'>${escapeHtml(item.title)}</a><br>${escapeHtml(item.area)}${place}`);
      });
      if (points.length > 1) map?.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
      else if (points.length === 1) map?.fitBounds(L.latLngBounds(points), { maxZoom: 13, padding: [24, 24] });
    };
    if ((window as unknown as { L?: unknown }).L) start();
    else {
      const existing = document.getElementById("leaflet-js");
      if (existing) existing.addEventListener("load", start);
      else {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = start;
        document.body.appendChild(script);
      }
    }
    return () => map?.remove();
  }, [listings]);
  return (
    <div>
      <div ref={ref} style={{ height, width: "100%", borderRadius: 12 }} />
      <p className="quiet">Map tiles from OpenStreetMap. A pin with no saved coordinates is placed at the area, not on the lot.</p>
    </div>
  );
}
