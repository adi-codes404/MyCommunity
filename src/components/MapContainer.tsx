/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Issue, IssueCategory, IssueStatus } from '../types';

interface MapContainerProps {
  issues: Issue[];
  center: [number, number];
  zoom?: number;
  onMarkerClick?: (issue: Issue) => void;
  onMapClick?: (coords: { lat: number; lng: number; address: string }) => void;
  interactive?: boolean;
  highlightCoordinates?: { lat: number; lng: number; radius: number; color?: string }[];
}

// Category icons emoji map
const CATEGORY_EMOJIS: Record<IssueCategory, string> = {
  roads: '🛣️',
  water: '💧',
  sanitation: '🧹',
  garbage: '🗑️',
  lighting: '💡',
  drainage: '🚰',
  civic_behavior: '👥',
  other: '❓',
};

// Status border colors
const STATUS_COLORS: Record<IssueStatus, string> = {
  reported: '#7A8BA8', // Gray
  verified: '#2ECC71', // Green
  assigned: '#F39C12', // Amber
  in_progress: '#00D4FF', // Cyan
  resolved: '#2ECC71', // Green
  reopened: '#E74C3C', // Red
  closed: '#7A8BA8', // Muted Gray
};

export default function MapContainer({
  issues,
  center,
  zoom = 13,
  onMarkerClick,
  onMapClick,
  interactive = true,
  highlightCoordinates,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const highlightsLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet Map Instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: interactive,
      doubleClickZoom: interactive,
      scrollWheelZoom: interactive,
      dragging: interactive,
    }).setView(center, zoom);

    mapInstanceRef.current = map;

    // Load Dark Mode Leaflet Map tiles (CartoDB Dark Matter fits our Cosmic Slate Theme perfectly!)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Layers
    markersLayerRef.current = L.layerGroup().addTo(map);
    highlightsLayerRef.current = L.layerGroup().addTo(map);

    // Handle map clicks for adding custom pins
    if (interactive && onMapClick) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        // Attempt reverse-geocoding using standard open OSM nominatim api
        let address = 'Custom Pinned Location';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            address = data.display_name.split(',').slice(0, 3).join(',');
          }
        } catch (err) {
          console.warn('Geocoding failed, using coordinates');
        }
        onMapClick({ lat, lng, address });
      });
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center if it changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear existing markers
    markersLayer.clearLayers();

    // Add new markers
    issues.forEach((issue) => {
      const emoji = CATEGORY_EMOJIS[issue.category] || '❓';
      const color = STATUS_COLORS[issue.status] || '#FFFFFF';

      // Create beautiful glowing HTML marker
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            background: #151E33;
            border: 2px solid ${color};
            box-shadow: 0 0 10px ${color}80, inset 0 0 5px ${color}40;
            border-radius: 50%;
            font-size: 1.125rem;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.transform='scale(1.15)';" onmouseout="this.style.transform='scale(1)';">
            <span>${emoji}</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const marker = L.marker([issue.location.lat, issue.location.lng], { icon: customIcon });

      if (onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick(issue);
        });
      } else {
        // Fallback popup if no click listener
        marker.bindPopup(`
          <div style="font-family: var(--font-sans); color: white;">
            <p style="font-weight: 700; margin: 0 0 4px 0; font-size: 14px;">${issue.title}</p>
            <p style="color: #B0C4DE; font-size: 12px; margin: 0 0 8px 0;">${issue.address}</p>
            <div style="display: flex; gap: 6px;">
              <span style="background: rgba(255,255,255,0.1); border: 1px solid #2D4563; padding: 2px 6px; border-radius: 4px; font-size: 10px; text-transform: uppercase;">${issue.category}</span>
              <span style="background: ${color}; color: #0A0E1A; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${issue.status}</span>
            </div>
          </div>
        `);
      }

      marker.addTo(markersLayer);
    });
  }, [issues, onMarkerClick]);

  // Update highlight layers (e.g., hotspots or duplicate-zones)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const highlightsLayer = highlightsLayerRef.current;
    if (!map || !highlightsLayer) return;

    highlightsLayer.clearLayers();

    if (highlightCoordinates && highlightCoordinates.length > 0) {
      highlightCoordinates.forEach((hl) => {
        L.circle([hl.lat, hl.lng], {
          color: hl.color || '#00D4FF',
          fillColor: hl.color || '#00D4FF',
          fillOpacity: 0.15,
          radius: hl.radius, // in meters
          weight: 1.5,
          dashArray: '4, 4',
        }).addTo(highlightsLayer);
      });
    }
  }, [highlightCoordinates]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-[#0A0E1A]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
}
