import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useISSTracker } from '../utils/trackerMath';

import markerImg from '../assets/map/location-pin.png';

const customMarkerIcon = new L.Icon({
    iconUrl: markerImg,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.panTo([lat, lng], { animate: true, duration: 1 });
        }
    }, [lat, lng, map]);
    return null;
};

const ISSMap = (props) => {
    const { telemetry } = useISSTracker();

    const lat = props.lat !== undefined ? props.lat : telemetry.lat;
    const lng = props.lng !== undefined ? props.lng : telemetry.lng;

    if (!lat && !lng) return <div>Завантаження карти...</div>;

    return (
        // Видаляємо зайві стилі обгортки, хай вона просто займає 100% ширини батька
        <div className="iss-map-wrapper" style={{ width: '100%' }}>
            <MapContainer
                center={[lat, lng]}
                zoom={3}
                scrollWheelZoom={true}
                // ВАЖЛИВО: aspect-ratio: 2/1 робить висоту рівно половиною ширини
                style={{
                    width: "100%",
                    aspectRatio: "2 / 1",
                    borderRadius: "8px"
                }}
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Супутник">
                        <TileLayer
                            attribution='Tiles &copy; Esri'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Карта вулиць">
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>

                <Marker position={[lat, lng]} icon={customMarkerIcon}>
                    <Popup>
                        <strong>МКС тут!</strong><br />
                        Lat: {lat.toFixed(4)}<br />
                        Lng: {lng.toFixed(4)}
                    </Popup>
                </Marker>

                <RecenterAutomatically lat={lat} lng={lng} />
            </MapContainer>
        </div>
    );
};

export default ISSMap;