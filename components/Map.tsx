import React from 'react';
import { StyleSheet, View, ViewStyle, Text } from 'react-native';

export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
}

interface MapProps {
    markers?: MapMarker[];
    initialRegion?: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    style?: ViewStyle;
    showsUserLocation?: boolean;
}

export const Map = ({
    markers = [],
    style,
}: MapProps) => {
    const markerCount = markers.length;
    const markerText = markerCount > 0 ? `${markerCount} point${markerCount > 1 ? 's' : ''} sur la carte` : 'Carte';
    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{markerText}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 12,
        width: '100%',
        minHeight: 200,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
});
