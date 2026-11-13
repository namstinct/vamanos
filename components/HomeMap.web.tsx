import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { StyleSheet, View } from 'react-native';

interface HomeMapProps {
    activities: any[];
    userLocation?: { latitude: number, longitude: number } | null;
    onPinPress: (activityId: string) => void;
    onMapPress: () => void;
}

// Convert emoji strings to Leaflet DivIcons
const createEmojiIcon = (emoji: string) => {
    return new L.DivIcon({
        className: 'custom-leaflet-icon',
        html: `
      <div style="
        background: #FFFBF2;
        border-radius: 20px;
        box-shadow: 3px 3px 0 #1C1410;
        border: 2px solid #1C1410;
        text-align: center;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-family: 'NotoColorEmoji_400Regular';
      ">
        ${emoji || '📍'}
      </div>
    `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
    });
};

const createUserDotIcon = () => {
    return new L.DivIcon({
        className: 'custom-leaflet-icon user-dot-icon',
        html: `
      <div style="
        background: #FF4A2D;
        border-radius: 12px;
        border: 3px solid #FFFBF2;
        box-shadow: 0 0 0 2px rgba(255, 74, 45, 0.4);
        width: 18px;
        height: 18px;
        margin-left: -9px;
        margin-top: -9px;
      ">
      </div>
    `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });
};

// Web version - Uses react-leaflet and OpenStreetMap tiles (FREE, NO API KEY needed)
export default function HomeMap({ activities, userLocation, onPinPress, onMapPress }: HomeMapProps) {
    const initialLat = userLocation?.latitude || 34.0522;
    const initialLng = userLocation?.longitude || -118.2437;

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* CSS to fix leaflet stacking issues in Expo web */}
            <style>{`
        .leaflet-container { height: 100vh; width: 100vw; z-index: 1; background: #1C1410; }
        .custom-leaflet-icon { background: none; border: none; }
        .leaflet-tile-pane { filter: invert(0.92) hue-rotate(190deg) brightness(0.9) contrast(0.9) saturate(0.35); }
        .leaflet-control-container .leaflet-bottom.leaflet-right { top: 104px !important; bottom: auto !important; left: 12px !important; right: auto !important; }
        .leaflet-control-attribution { background: #FFF8EC !important; color: #1C1410 !important; border: 1.5px solid #1C1410 !important; border-radius: 6px; padding: 2px 8px !important; font-size: 11px !important; line-height: 1.4 !important; box-shadow: 2px 2px 0 #1C1410; }
        .leaflet-control-attribution a { color: #E0381B !important; }
      `}</style>

            <MapContainer
                key={`${initialLat}-${initialLng}`}
                center={[initialLat, initialLng]}
                zoom={13}
                zoomControl={false}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {activities.map((activity, idx) => {
                    const lat = activity.latitude || initialLat + (Math.random() - 0.5) * 0.01;
                    const lng = activity.longitude || initialLng + (Math.random() - 0.5) * 0.01;
                    return (
                        <Marker
                            key={activity.id || idx}
                            position={[lat, lng]}
                            icon={createEmojiIcon(activity.emoji)}
                            eventHandlers={{
                                click: () => onPinPress(activity.id),
                            }}
                        >
                        </Marker>
                    );
                })}


                {userLocation && (
                    <Marker
                        position={[userLocation.latitude, userLocation.longitude]}
                        icon={createUserDotIcon()}
                    />
                )}
            </MapContainer>
        </View>
    );
}
