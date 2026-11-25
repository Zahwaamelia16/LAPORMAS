
import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { MapPin, LocateFixed } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

const DEFAULT_POSITION = {
  latitude: -7.257500,
  longitude: 112.752100,
};

const registrationMarker = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(
        [position.latitude, position.longitude],
        15,
        { duration: 0.6 }
      );
    }
  }, [map, position?.latitude, position?.longitude]);

  return null;
}

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
      icon={registrationMarker}
      draggable
      eventHandlers={eventHandlers}
    />
  );
}

export default function RegistrationLocationPicker({
  position,
  onChange,
  onUseMyLocation,
  detecting,
}) {
  const markerPosition = position || DEFAULT_POSITION;

  return (
    <div className="registration-location-picker">

      <div className="registration-map-toolbar">
        <span>
          <MapPin size={14} />
          Geser pin ke lokasi rumahmu
        </span>

        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={detecting}
        >
          <LocateFixed size={14} />
          {detecting ? 'Mendeteksi...' : 'Gunakan lokasi saya'}
        </button>
      </div>

      <div className="registration-map-canvas">
        <MapContainer
          center={[
            DEFAULT_POSITION.latitude,
            DEFAULT_POSITION.longitude,
          ]}
          zoom={14}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenter position={position} />

          <MapClickHandler onChange={onChange} />

          <DraggableMarker
            position={markerPosition}
            onChange={onChange}
          />
        </MapContainer>
      </div>

      <div className="registration-map-coordinate">
        {position
          ? `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`
          : 'Geser pin atau gunakan lokasi saya untuk menentukan koordinat'}
      </div>
    </div>
  );
}
