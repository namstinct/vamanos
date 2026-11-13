import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { StyleSheet, View } from 'react-native';

export interface ActivityMapProps {
    activity: any;
    participants: any[];
    userLocation?: { latitude: number, longitude: number } | null;
}

const FRIEND_COLORS = ['#FF4A2D', '#FF9F1C', '#2EC4A6', '#5E60CE', '#F72585', '#4A90D9'];
function getFriendColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return FRIEND_COLORS[Math.abs(hash) % FRIEND_COLORS.length];
}

const createEmojiIcon = (emoji: string) => {
    return new L.DivIcon({
        className: 'custom-leaflet-icon',
        html: `
        <div style="
            background: #FFFBF2;
            border-radius: 26px;
            box-shadow: 4px 4px 0 #1C1410;
            border: 3px solid #1C1410;
            text-align: center;
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-family: 'NotoColorEmoji_400Regular';
        ">
            ${emoji || '📍'}
        </div>
        `,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
    });
};

const createFriendIcon = (name: string, color: string) => {
    return new L.DivIcon({
        className: 'custom-leaflet-icon',
        html: `
        <div style="
            background: ${color};
            border-radius: 18px;
            border: 2px solid #1C1410;
            box-shadow: 2px 2px 0 #1C1410;
            text-align: center;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            font-family: -apple-system, system-ui, sans-serif;
        ">
            ${name[0].toUpperCase()}
        </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
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

export default function ActivityMap({ activity, participants, userLocation }: ActivityMapProps) {
    if (!activity) return null;

    const centerLat = activity.latitude || userLocation?.latitude || 34.0522;
    const centerLng = activity.longitude || userLocation?.longitude || -118.2437;

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Fix leaflet styling specifically for expo web sheets */}
            <style>{`
                .leaflet-container { height: 100vh; width: 100vw; z-index: 1; background: #1C1410; }
                .custom-leaflet-icon { background: none; border: none; }
                .leaflet-tile-pane { filter: invert(0.92) hue-rotate(190deg) brightness(0.9) contrast(0.9) saturate(0.35); }
                .leaflet-control-container .leaflet-bottom.leaflet-right { top: 72px !important; bottom: auto !important; left: 12px !important; right: auto !important; }
                .leaflet-control-attribution { background: #FFF8EC !important; color: #1C1410 !important; border: 1.5px solid #1C1410 !important; border-radius: 6px; padding: 2px 8px !important; font-size: 11px !important; line-height: 1.4 !important; box-shadow: 2px 2px 0 #1C1410; }
                .leaflet-control-attribution a { color: #E0381B !important; }
            `}</style>
            <MapContainer
                key={`${centerLat}-${centerLng}`}
                center={[centerLat, centerLng]}
                zoom={14}
                zoomControl={false}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Destination pin */}
                <Marker position={[centerLat, centerLng]} icon={createEmojiIcon(activity.emoji)} />

                {/* User point marker */}
                {userLocation && (
                    <Marker
                        position={[userLocation.latitude, userLocation.longitude]}
                        icon={createUserDotIcon()}
                    />
                )}

                {/* Participant pins */}
                {participants
                    .filter(p => p.status === 'committed')
                    .slice(0, 8)
                    .map((p, idx) => {
                        const name = p.profiles?.username || '?';
                        return (
                            <Marker
                                key={idx}
                                position={[
                                    centerLat + (Math.random() - 0.5) * 0.02,
                                    centerLng + (Math.random() - 0.5) * 0.02,
                                ]}
                                icon={createFriendIcon(name, getFriendColor(name))}
                            >
                                <Popup>{name}</Popup>
                            </Marker>
                        );
                    })}
            </MapContainer>
        </View>
    );
}
