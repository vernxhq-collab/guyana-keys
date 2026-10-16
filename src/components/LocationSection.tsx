"use client";

import { useEffect, useRef, useState } from "react";
import { failedNearbyReport, type NearbyReport } from "../lib/nearby";

function distanceLabel(km: number, mi: number) {
  const kmText = km < 10 ? km.toFixed(1) : String(Math.round(km));
  const miText = mi < 10 ? mi.toFixed(1) : String(Math.round(mi));
  return `${kmText} km (${miText} mi)`;
}

function PlaceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" fill="none" stroke="#116b4a" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="#116b4a" strokeWidth="1.8" />
    </svg>
  );
}

export function LocationSection({ area, region, lat, lng, report }: { area: string; region: string; lat: number; lng: number; report: NearbyReport | null }) {
  const [data, setData] = useState<NearbyReport | null>(report);
  const [loading, setLoading] = useState(!report);
  const [tab, setTab] = useState(report?.groups[0]?.id || "schools");
  const node = useRef<HTMLDivElement>(null);
  const group = data?.groups.find((item) => item.id === tab) || data?.groups[0];
  const place = [area, region].filter(Boolean).join(", ");
  const mapHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  useEffect(() => {
    if (report) return;
    let cancelled = false;
    fetch(`/api/places?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("places")))
      .then((body: NearbyReport) => {
        if (cancelled || !Array.isArray(body?.groups)) return;
        setData(body);
        setTab(body.groups[0]?.id || "schools");
      })
      .catch(() => {
        if (!cancelled) setData(failedNearbyReport());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, report]);

  useEffect(() => {
    if (document.getElementById("leaflet-css")) return;
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const host = node.current;
    if (!host) return;
    let map: { remove: () => void } | null = null;
    let cancelled = false;
    const start = () => {
      const L = (window as unknown as { L?: { map: Function; tileLayer: Function; circleMarker: Function } }).L;
      if (!L || !host || cancelled) return;
      map = L.map(host, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 15);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);
      L.circleMarker([lat, lng], { radius: 8, color: "#ffffff", weight: 2, fillColor: "#116b4a", fillOpacity: 1 }).addTo(map);
    };
    if ((window as unknown as { L?: unknown }).L) start();
    else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-leaflet]");
      if (existing) existing.addEventListener("load", start);
      else {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.dataset.leaflet = "1";
        script.onload = start;
        document.body.appendChild(script);
      }
    }
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  return (
    <section className="location-block">
      <h2>Location</h2>
      {place ? <p className="sub">{place}</p> : null}
      <div className="location-map">
        <div ref={node} className="location-canvas" role="img" aria-label={place ? `Map of ${place}` : "Map"} />
        <a className="open-map" href={mapHref} target="_blank" rel="noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Open map
        </a>
      </div>
      <div className="place-tabs" role="tablist" aria-label="Nearby places">
        {(data?.groups || failedNearbyReport().groups).map((item) => (
          <button key={item.id} type="button" role="tab" id={`place-tab-${item.id}`} aria-selected={item.id === (group?.id || tab)} aria-controls={`place-panel-${item.id}`} className={item.id === (group?.id || tab) ? "on" : ""} onClick={() => setTab(item.id)}>{item.label}</button>
        ))}
      </div>
      <div className="place-panel" role="tabpanel" id={`place-panel-${group?.id || tab}`} aria-labelledby={`place-tab-${group?.id || tab}`}>
        {loading ? <p className="place-empty">Checking OpenStreetMap for places within 3 km.</p> : group?.status === "failed" ? <p className="place-empty">OpenStreetMap could not be reached. No places are shown.</p> : group && group.places.length === 0 ? <p className="place-empty">{group.empty}</p> : (
          <ul className="place-list">
            {group?.places.map((item) => (
              <li key={item.id}>
                <PlaceIcon />
                <span>
                  <strong>{item.name}</strong>
                  <span className="meta">{item.kind} · {distanceLabel(item.km, item.mi)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="meta place-credit"><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>. Map tiles © CARTO. Distances are as the crow flies.</p>
    </section>
  );
}
