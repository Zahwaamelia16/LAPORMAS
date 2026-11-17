import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin } from 'lucide-react';

import 'leaflet/dist/leaflet.css';
import './ReportLocationMap.css';

// Mengatur ikon marker agar tampil dengan benar di Vite.
const reportMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function ReportLocationMap({
  latitude,
  longitude,
  location,
}) {
  const hasInput =
    latitude !== null &&
    latitude !== undefined &&
    String(latitude).trim() !== '' &&
    longitude !== null &&
    longitude !== undefined &&
    String(longitude).trim() !== '';

  const lat = Number(latitude);
  const lng = Number(longitude);

  const isValidCoordinate =
    hasInput &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const locationText = location || 'Lokasi laporan';

  if (!isValidCoordinate) {
    return (
      <section className="report-map-section">
        <div className="report-map-heading">
          <div>
            <h3>Lokasi kejadian</h3>
            <p>{locationText}</p>
          </div>
        </div>

        <div className="report-map-unavailable">
          <span>Koordinat lokasi belum tersedia.</span>
          <small>
            Peta akan ditampilkan setelah koordinat laporan tersedia.
          </small>
        </div>
      </section>
    );
  }

  const googleMapsUrl =
    `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <section className="report-map-section">
      <div className="report-map-heading">
        <div>
          <h3 className="report-map-title">
            <MapPin size={17} aria-hidden="true" />
            Lokasi kejadian
            </h3>
          <p>{locationText}</p>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="report-map-link"
        >
          Buka Google Maps ↗
        </a>
      </div>

      <div className="report-map-frame">
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

        <Marker
        position={[lat, lng]}
        icon={reportMarkerIcon}
        >
        <Popup>
            <b>Lokasi kejadian</b>
            <br />
            {locationText}
        </Popup>
        </Marker>
        </MapContainer>
      </div>

      <div className="report-map-coordinate">
        Koordinat: {lat.toFixed(6)}, {lng.toFixed(6)}
      </div>
    </section>
  );
}