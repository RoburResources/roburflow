import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons for bundlers
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Embedded map that geocodes the destination address and keeps the driver on-page.
export default function NavigateCard({ address, siteName }) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
        );
        const data = await res.json();
        if (data && data[0]) setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } catch { /* fall back to link only */ }
      setLoading(false);
    })();
  }, [address]);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || "")}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-64 bg-slate-100 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : coords ? (
          <MapContainer center={coords} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={coords} icon={markerIcon}>
              <Popup>{siteName || address}</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <MapPin className="w-8 h-8 mb-2" />
            <span className="text-xs">Map unavailable for this address</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm font-medium text-robur-black">{siteName || "Destination"}</div>
        <div className="text-xs text-slate-500 mb-3">{address}</div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full h-11">
            <ExternalLink className="w-4 h-4 mr-2" /> Open in Maps
          </Button>
        </a>
      </div>
    </div>
  );
}