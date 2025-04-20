import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { WHAT3WORDS_API_KEY } from '../config';
import 'leaflet/dist/leaflet.css';
import '../utils/leaflet-icons';

const LocationMarker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setLoading(true);
      
      try {
        const response = await fetch(
          `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=${WHAT3WORDS_API_KEY}`
        );
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message);
        }
        onLocationSelect({
          words: data.words,
          coordinates: [lat, lng]
        });
      } catch (error) {
        console.error('Error converting coordinates to what3words:', error);
        alert('Error getting location words. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <>
      {position && <Marker position={position} />}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          Getting location words...
        </div>
      )}
    </>
  );
};

const Map = ({ onLocationSelect }) => {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        Click on the map to select a location
      </div>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
};

export default Map;
