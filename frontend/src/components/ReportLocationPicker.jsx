
import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { LocateFixed, MapPin } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

const DEFAULT_POSITION = {
  latitude: -7.2575,
  longitude: 112.7521,
};

const reportPickerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Pusat peta mengikuti posisi pin
function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    map.flyTo(
      [position.latitude, position.longitude],
      Math.max(map.getZoom(), 16),
      { duration: 0.5 }
    );
  }, [map, position?.latitude, position?.longitude]);

  return null;
}

// Memilih lokasi dengan mengeklik peta
function MapClickHandler({ onChange }) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
        accuracy: null,
      });
    },
  });

  return null;
}

// Memindahkan pin dengan drag
function DraggableMarker({ position, onChange }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (!marker) return;

        const point = marker.getLatLng();

        onChange({
          latitude: point.lat,
          longitude: point.lng,
          accuracy: null,
        });
      },
    }),
    [onChange]
  );

  return (
    <Marker
      ref={markerRef}
      position={[position.latitude, position.longitude]}
      icon={reportPickerIcon}
      draggable
      eventHandlers={eventHandlers}
    >
      <Popup>Lokasi kejadian yang dipilih</Popup>
    </Marker>
  );
}

export default function ReportLocationPicker({
  position,
  onChange,
  onUseMyLocation,
  detecting,
}) {
  return (
    <div className="report-location-picker">
      <div className="report-location-toolbar">
        <div className="report-location-instruction">
          <MapPin size={16} />
          <span>
            {position
              ? 'Geser pin atau klik peta untuk mengubah lokasi'
              : 'Klik peta untuk menentukan titik kejadian'}
          </span>
        </div>

        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={detecting}
        >
          <LocateFixed size={15} />
          {detecting ? 'Mendeteksi...' : 'Gunakan lokasi saya'}
        </button>
      </div>

      <div className="report-location-map-canvas">
        <MapContainer
          center={[
            DEFAULT_POSITION.latitude,
            DEFAULT_POSITION.longitude,
          ]}
          zoom={13}
          scrollWheelZoom
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenter position={position} />

          <MapClickHandler onChange={onChange} />

          {position && (
            <DraggableMarker
              position={position}
              onChange={onChange}
            />
          )}
        </MapContainer>
      </div>

      <div className="report-location-coordinate">
        {position
          ? `Koordinat: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`
          : 'Lokasi belum dipilih. Pilih titik pada peta atau gunakan GPS.'}
      </div>
    </div>
  );
}
