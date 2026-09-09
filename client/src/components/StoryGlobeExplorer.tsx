import React, { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { feature } from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json';
import { BookOpen, GitBranch, LoaderCircle, MapPin, X } from 'lucide-react';
import { fetchCountryConnections, fetchCountryCoverage, fetchCountryStories } from '../services/api';
import { CountryConnection, CountryCoverage, CountryStorySummary } from '../types';
import { useArticles } from '../hooks/useArticles';

type GlobeFeature = { type: string; properties?: { name?: string }; geometry: unknown; countryCode?: string; coverage?: CountryCoverage };
type GlobeArc = CountryConnection & { startLat: number; startLng: number; endLat: number; endLng: number };

// The API owns country classification; the client only resolves codes to map geometry.
const countryAliases: Record<string, string> = {
  'United States of America': 'US', 'United States': 'US', 'Sierra Leone': 'SL', 'South Africa': 'ZA', 'United Kingdom': 'GB', Switzerland: 'CH',
};
const centroids: Record<string, { lat: number; lng: number }> = {
  US: { lat: 38, lng: -98 }, CA: { lat: 57, lng: -106 }, PL: { lat: 52, lng: 19 }, IN: { lat: 22, lng: 79 },
  SL: { lat: 8.5, lng: -11.8 }, NL: { lat: 52.2, lng: 5.3 }, BE: { lat: 50.8, lng: 4.5 }, DE: { lat: 51, lng: 10 },
  CH: { lat: 46.8, lng: 8.2 }, CN: { lat: 35, lng: 103 }, IR: { lat: 32, lng: 53 }, KW: { lat: 29.3, lng: 47.5 },
};

const topologyFeatures = feature(worldTopology as never, (worldTopology as { objects: { countries: unknown } }).objects.countries as never) as unknown as { features: GlobeFeature[] };

const geometryCenter = (geometry: unknown): { lat: number; lng: number } | null => {
  const points: Array<[number, number]> = [];
  const visit = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') { points.push([value[0], value[1]]); return; }
    value.forEach(visit);
  };
  visit((geometry as { coordinates?: unknown })?.coordinates);
  if (!points.length) return null;
  return { lng: points.reduce((sum, point) => sum + point[0], 0) / points.length, lat: points.reduce((sum, point) => sum + point[1], 0) / points.length };
};

const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date)) : 'Date unavailable';

export const StoryGlobeExplorer: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { openArticle } = useArticles();
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [coverage, setCoverage] = useState<CountryCoverage[]>([]);
  const [connections, setConnections] = useState<CountryConnection[]>([]);
  const [selected, setSelected] = useState<CountryCoverage | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<CountryConnection | null>(null);
  const [showConnections, setShowConnections] = useState(false);
  const [stories, setStories] = useState<CountryStorySummary[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [hovered, setHovered] = useState<CountryCoverage | null>(null);

  useEffect(() => {
    let active = true;
    fetchCountryCoverage().then((items) => { if (active) setCoverage(items); }).catch(() => { if (active) setCoverage([]); });
    fetchCountryConnections().then((items) => { if (active) setConnections(items); }).catch(() => { if (active) setConnections([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(300, Math.floor(entry.contentRect.width))));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const coverageByCode = useMemo(() => new Map(coverage.map((item) => [item.countryCode, item])), [coverage]);
  const coverageForFeature = (item: GlobeFeature | null) => {
    if (!item) return undefined;
    const name = item.properties?.name || '';
    const code = item.countryCode || countryAliases[name] || coverage.find((entry) => entry.countryName.toLowerCase() === name.toLowerCase())?.countryCode;
    return code ? coverageByCode.get(code) : undefined;
  };
  const polygons = useMemo(() => topologyFeatures.features.map((item) => {
    const name = item.properties?.name || '';
    const code = countryAliases[name] || coverage.find((entry) => entry.countryName.toLowerCase() === name.toLowerCase())?.countryCode;
    return { ...item, countryCode: code, coverage: code ? coverageByCode.get(code) : undefined };
  }), [coverage, coverageByCode]);
  const totalStories = coverage.reduce((total, item) => total + item.storyCount, 0);
  const topCoverage = coverage.slice(0, 5);
  const polygonCenters = useMemo(() => new Map(polygons.filter((item) => item.countryCode).map((item) => [item.countryCode as string, geometryCenter(item.geometry)])), [polygons]);
  const arcs = useMemo<GlobeArc[]>(() => connections.flatMap((connection) => {
    const start = polygonCenters.get(connection.source.countryCode.toUpperCase());
    const end = polygonCenters.get(connection.target.countryCode.toUpperCase());
    return start && end ? [{ ...connection, startLat: start.lat, startLng: start.lng, endLat: end.lat, endLng: end.lng }] : [];
  }), [connections, polygonCenters]);
  const visibleArcs = useMemo(() => {
    const activeCode = selected?.countryCode || selectedConnection?.source.countryCode || selectedConnection?.target.countryCode;
    if (!showConnections || !activeCode) return [];
    return arcs.filter((arc) => arc.source.countryCode === activeCode || arc.target.countryCode === activeCode);
  }, [arcs, selected, selectedConnection, showConnections]);

  const selectCountry = async (item: GlobeFeature) => {
    const itemCoverage = coverageForFeature(item);
    setSelectedConnection(null);
    if (!itemCoverage) { setSelected(null); setStories([]); return; }
    setShowConnections(true);
    setSelected(itemCoverage);
    setStories([]);
    setLoadingStories(true);
    const center = centroids[itemCoverage.countryCode];
    if (center) globeRef.current?.pointOfView({ ...center, altitude: 1.65 }, 700);
    try { setStories(await fetchCountryStories(itemCoverage.countryCode)); }
    finally { setLoadingStories(false); }
  };

  const resetGlobeView = () => {
    globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 2.35 }, 700);
    setSelected(null);
    setSelectedConnection(null);
    setShowConnections(false);
    setStories([]);
  };

  return <section className="story-globe-explorer" aria-labelledby="story-globe-title">
    <div className="story-globe-heading"><div><span className="section-type-pill"><MapPin size={13} /> Global story explorer</span><h2 id="story-globe-title">Explore stories around the world</h2><p>Countries with coverage are highlighted. Rotate the globe or select a country to discover related reporting.</p></div><div className="story-globe-heading-actions"><div className="story-globe-stats"><strong>{coverage.length}</strong><span>countries</span><strong>{totalStories}</strong><span>stories</span></div><button className={`story-globe-toggle ${showConnections ? 'is-active' : ''}`} onClick={() => setShowConnections((current) => !current)} disabled={!selected && !selectedConnection} aria-pressed={showConnections}><GitBranch size={15} /> {showConnections ? 'Hide connections' : 'Show connections'}</button>{onClose && <button className="story-panel-close story-globe-close" onClick={onClose} aria-label="Close global story explorer"><X size={17} /></button>}</div></div>
    <div className="story-globe-layout">
      <div ref={containerRef} className="story-globe-canvas">
        <Globe ref={globeRef} width={width} height={Math.min(600, Math.max(360, width * .66))} backgroundColor="rgba(0,0,0,0)" globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg" bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png" showAtmosphere atmosphereColor="#86c79a" atmosphereAltitude={0.08} showGraticules={false} polygonsData={polygons} polygonGeoJsonGeometry={(item) => (item as GlobeFeature).geometry as never} polygonCapColor={() => 'rgba(0,0,0,0)'} polygonSideColor={() => 'rgba(0,0,0,0)'} polygonStrokeColor={(item) => coverageForFeature(item as GlobeFeature)?.storyCount ? '#ef4444' : '#000000'} polygonAltitude={() => 0.002} polygonsTransitionDuration={0} polygonLabel={(item) => { const value = item as GlobeFeature; const itemCoverage = coverageForFeature(value); const name = itemCoverage?.countryName || value.properties?.name || 'Country'; const count = itemCoverage?.storyCount || 0; return `<div class="globe-tooltip"><strong>${name}</strong><span style="display:block;margin-top:3px">${count} ${count === 1 ? 'Story' : 'Stories'}</span></div>`; }} onPolygonHover={(item) => setHovered(coverageForFeature(item as GlobeFeature | null) || null)} onPolygonClick={(item) => void selectCountry(item as GlobeFeature)} arcsData={visibleArcs} arcStartLat={(arc) => (arc as GlobeArc).startLat} arcStartLng={(arc) => (arc as GlobeArc).startLng} arcEndLat={(arc) => (arc as GlobeArc).endLat} arcEndLng={(arc) => (arc as GlobeArc).endLng} arcColor={(arc: object) => (arc as GlobeArc).storyCount > 1 ? 'rgba(251,146,60,.78)' : 'rgba(251,146,60,.48)'} arcStroke={(arc) => (arc as GlobeArc).storyCount > 1 ? .45 : .22} arcAltitudeAutoScale={0.28} arcLabel={(arc) => { const value = arc as GlobeArc; return `<div class="globe-tooltip"><strong>${value.source.countryName} ↔ ${value.target.countryName}</strong><span style="display:block;margin-top:3px">${value.storyCount} shared ${value.storyCount === 1 ? 'story' : 'stories'}</span></div>`; }} onArcClick={(arc) => { const value = arc as GlobeArc; setSelected(null); setStories([]); setSelectedConnection(value); }} />
        {hovered && <div className="story-globe-hover-card"><strong>{hovered.countryName}</strong><span>{hovered.storyCount} {hovered.storyCount === 1 ? 'story' : 'stories'}</span></div>}
      </div>
      <aside className={`story-country-panel ${selected ? 'is-selected' : ''}`}>
        {selectedConnection ? <>
          <div className="story-country-panel-header"><div><span className="story-panel-kicker">Shared coverage</span><h3>{selectedConnection.source.countryName} ↔ {selectedConnection.target.countryName}</h3><p>{selectedConnection.storyCount} shared {selectedConnection.storyCount === 1 ? 'story' : 'stories'}</p></div><button className="story-panel-close" onClick={resetGlobeView} aria-label="Close shared stories"><X size={17} /></button></div>
          <div className="country-story-list">{selectedConnection.stories.map((story) => <button className="country-story-card" key={story.id} onClick={() => void openArticle(story.id)}><strong>{story.headline}</strong><span>{story.section || 'Uncategorised'} · {formatDate(story.publishedAt)}</span>{story.lead && <p>{story.lead}</p>}<small>Open story →</small></button>)}</div>
        </> : selected ? <>
          <div className="story-country-panel-header"><div><span className="story-panel-kicker">Selected country</span><h3>{selected.countryName}</h3><p>{selected.storyCount} related {selected.storyCount === 1 ? 'story' : 'stories'}</p></div><button className="story-panel-close" onClick={resetGlobeView} aria-label="Close country stories"><X size={17} /></button></div>
          {loadingStories ? <div className="story-panel-loading"><LoaderCircle className="spin" size={19} /> Loading stories…</div> : stories.length ? <div className="country-story-list">{stories.map((story) => <button className="country-story-card" key={story.id} onClick={() => void openArticle(story.id)}><strong>{story.headline}</strong><span>{story.section || 'Uncategorised'} · {formatDate(story.publishedAt)}</span>{story.lead && <p>{story.lead}</p>}<small>Open story →</small></button>)}</div> : <p className="story-panel-empty">No stories currently available for this country.</p>}
        </> : <>
          <div className="story-panel-kicker"><BookOpen size={14} /> Most covered</div>
          <div className="coverage-ranking">{topCoverage.map((item) => <button key={item.countryCode} onClick={() => { const polygon = polygons.find((entry) => entry.countryCode === item.countryCode); if (polygon) void selectCountry(polygon); }}><span>{item.countryName}</span><strong>{item.storyCount}</strong></button>)}</div>
          <p className="story-panel-hint">Select a highlighted country to browse its stories.</p>
        </>}
      </aside>
    </div>
  </section>;
};
