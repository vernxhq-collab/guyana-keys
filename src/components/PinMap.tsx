"use client";

import { useEffect, useRef } from "react";

type MapHandle = {
  setView: (center: [number, number], zoom: number) => void;
  remove: () => void;
  on: (event: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
};

type MarkerHandle = {
  addTo: (map: MapHandle) => void;
  on: (event: string, handler: () => void) => void;
  getLatLng: () => { lat: number; lng: number };
  setLatLng: (value: [number, number]) => void;
};

export function PinMap({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const pointRef = useRef({ lat, lng });
  onChangeRef.current = onChange;

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
    let map: MapHandle | null = null;
    const boot = () => {
      const L = (window as unknown as { L?: { map: (el: HTMLElement) => MapHandle; tileLayer: (url: string, opts: object) => { addTo: (map: MapHandle) => void }; marker: (pos: [number, number], opts: { draggable: boolean }) => MarkerHandle } }).L;
      if (!L || !node || map) return;
      const point = pointRef.current;
      map = L.map(node);
      map.setView([point.lat || 6.8, point.lng || -58.16], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "OpenStreetMap" }).addTo(map);
      const marker = L.marker([point.lat || 6.8, point.lng || -58.16], { draggable: true });
      marker.addTo(map);
      marker.on("dragend", () => {
        const next = marker.getLatLng();
        onChangeRef.current(next.lat, next.lng);
      });
      map.on("click", (event) => {
        marker.setLatLng([event.latlng.lat, event.latlng.lng]);
        onChangeRef.current(event.latlng.lat, event.latlng.lng);
      });
    };
    if ((window as unknown as { L?: unknown }).L) boot();
    else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = boot;
      document.body.appendChild(script);
    }
    return () => map?.remove();
  }, []);

  return <div ref={ref} style={{ height: 280, width: "100%", borderRadius: 12 }} />;
}
