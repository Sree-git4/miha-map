'use client';

import { useEffect, useRef, useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function Home() {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [assets, setAssets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState('');

  // 1. Fetch assets + token details from the Supabase view
  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setError('Supabase URL or key is missing. Add them in Vercel environment variables.');
      return;
    }
    fetch(`${SUPABASE_URL}/rest/v1/asset_map_view?select=*&order=name`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Supabase returned ${res.status}`);
        return res.json();
      })
      .then(setAssets)
      .catch((e) => setError(`Could not load assets: ${e.message}`));
  }, []);

  // 2. Draw the map and a pin for each asset
  useEffect(() => {
    if (!assets.length) return;
    let map;
    import('leaflet').then((L) => {
      if (mapRef.current._leaflet_id) return;
      map = L.map(mapRef.current);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const bounds = [];
      assets.forEach((a) => {
        const marker = L.circleMarker([a.lat, a.lon], {
          radius: 9, color: '#ffffff', weight: 2, fillColor: '#2d6a68', fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(`<strong>${a.name}</strong><br>${a.description ?? ''}`)
          .on('click', () => setActiveId(a.id));
        markersRef.current[a.id] = marker;
        bounds.push([a.lat, a.lon]);
      });
      map.fitBounds(bounds, { padding: [60, 60] });
      mapRef.current.leafletMap = map;
    });
    return () => map && map.remove();
  }, [assets]);

  // 3. Highlight the selected asset on the map
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, m]) =>
      m.setStyle({ fillColor: id === activeId ? '#b5832a' : '#2d6a68' })
    );
    const m = markersRef.current[activeId];
    const map = mapRef.current?.leafletMap;
    if (m && map) { map.panTo(m.getLatLng()); m.openPopup(); }
  }, [activeId]);

  return (
    <main className="shell">
      <aside className="panel">
        <h1>MIHA map</h1>
        <p className="intro">
          Intangible heritage assets and their soulbound token records, read live from Supabase.
        </p>
        {error && <p className="message">{error}</p>}
        {!error && !assets.length && <p className="message">Loading assets…</p>}
        {assets.map((a) => (
          <button
            key={a.id}
            className={`asset${a.id === activeId ? ' active' : ''}`}
            onClick={() => setActiveId(a.id)}
          >
            <div className="name">
              {a.name}
              <span className="badge">{a.status}</span>
            </div>
            <div className="meta">{a.community}</div>
            {a.id === activeId && (
              <dl className="token">
                <dt>Token ID</dt><dd>{a.token_id}</dd>
                <dt>Contract address</dt><dd>{a.contract_address}</dd>
                <dt>Owner wallet</dt><dd>{a.owner_wallet}</dd>
                <dt>File hash (IPFS)</dt><dd>{a.ipfs_cid}</dd>
                <dt>Chain</dt><dd>{a.chain}</dd>
              </dl>
            )}
          </button>
        ))}
      </aside>
      <div ref={mapRef} className="map" />
    </main>
  );
}
