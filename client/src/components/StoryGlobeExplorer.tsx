import React, { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { feature } from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json';
import { BookOpen, LoaderCircle, MapPin, X } from 'lucide-react';
import { fetchCountryCoverage, fetchCountryStories } from '../services/api';
import { CountryCoverage, CountryStorySummary } from '../types';
import { useArticles } from '../context/ArticleContext';

type GlobeFeature = { type: string; properties?: { name?: string }; geometry: unknown; countryCode?: string; coverage?: CountryCoverage };

const countryAliases: Record<string, string> = {
  'United States of America': 'US', 'United States': 'US', 'Sierra Leone': 'SL', 'South Africa': 'ZA', 'United Kingdom': 'GB', Switzerland: 'CH',
};
const centroids: Record<string, { lat: number; lng: number }> = {
  US: { lat: 38, lng: -98 }, CA: { lat: 57, lng: -106 }, PL: { lat: 52, lng: 19 }, IN: { lat: 22, lng: 79 },
  SL: { lat: 8.5, lng: -11.8 }, NL: { lat: 52.2, lng: 5.3 }, BE: { lat: 50.8, lng: 4.5 }, DE: { lat: 51, lng: 10 },
  CH: { lat: 46.8, lng: 8.2 }, CN: { lat: 35, lng: 103 }, IR: { lat: 32, lng: 53 }, KW: { lat: 29.3, lng: 47.5 },
};

const topologyFeatures = feature(worldTopology as never, (worldTopology as { objects: { countries: unknown } }).objects.countries as never) as unknown as { features: GlobeFeature[] };

const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date)) : 'Date unavailable';

export const StoryGlobeExplorer: React.FC = () => {
  const { openArticle } = useArticles();
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [coverage, setCoverage] = useState<CountryCoverage[]>([]);
  const [selected, setSelected] = useState<CountryCoverage | null>(null);
  const [stories, setStories] = useState<CountryStorySummary[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [hovered, setHovered] = useState<CountryCoverage | null>(null);

  useEffect(() => {
    let active = true;
    fetchCountryCoverage().then((items) => { if (active) setCoverage(items); }).catch(() => { if (active) setCoverage([]); });
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

  const selectCountry = async (item: GlobeFeature) => {
    const itemCoverage = coverageForFeature(item);
    if (!itemCoverage) { setSelected(null); setStories([]); return; }
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
    setStories([]);
  };

  return <section className="story-globe-explorer" aria-labelledby="story-globe-title">
    <div className="story-globe-heading"><div><span className="section-type-pill"><MapPin size={13} /> Global story explorer</span><h2 id="story-globe-title">Explore stories around the world</h2><p>Countries with coverage are highlighted. Rotate the globe or select a country to discover related reporting.</p></div><div className="story-globe-stats"><strong>{coverage.length}</strong><span>countries</span><strong>{totalStories}</strong><span>stories</span></div></div>
    <div className="story-globe-layout">
      <div ref={containerRef} className="story-globe-canvas">
        <Globe ref={globeRef} width={width} height={Math.min(600, Math.max(360, width * .66))} backgroundColor="rgba(0,0,0,0)" globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg" bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png" showAtmosphere atmosphereColor="#86c79a" atmosphereAltitude={0.08} showGraticules={false} polygonsData={polygons} polygonGeoJsonGeometry={(item) => (item as GlobeFeature).geometry as never} polygonCapColor={() => 'rgba(0,0,0,0)'} polygonSideColor={() => 'rgba(0,0,0,0)'} polygonStrokeColor={(item) => coverageForFeature(item as GlobeFeature)?.storyCount ? '#ef4444' : false} polygonAltitude={() => 0.002} polygonsTransitionDuration={0} polygonLabel={(item) => { const value = item as GlobeFeature; const itemCoverage = coverageForFeature(value); const name = itemCoverage?.countryName || value.properties?.name || 'Country'; const count = itemCoverage?.storyCount || 0; return `<div class="globe-tooltip"><strong>${name}</strong><span style="display:block;margin-top:3px">${count} ${count === 1 ? 'Story' : 'Stories'}</span></div>`; }} onPolygonHover={(item) => setHovered(coverageForFeature(item as GlobeFeature | null) || null)} onPolygonClick={(item) => void selectCountry(item as GlobeFeature)} />
        {hovered && <div className="story-globe-hover-card"><strong>{hovered.countryName}</strong><span>{hovered.storyCount} {hovered.storyCount === 1 ? 'story' : 'stories'}</span></div>}
      </div>
      <aside className={`story-country-panel ${selected ? 'is-selected' : ''}`}>
        {selected ? <>
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
