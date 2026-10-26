import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";
import "./FinanceMap.css";
import PropertyCard from "../../components/UI/PropertyCard/PropertyCard";
import * as turf from "@turf/turf";
import { getWorkflowFiles, getWorkflowRequests } from "../../utils/requestWorkflow";

const { BaseLayer } = LayersControl;

// ── Fix default Leaflet marker icons ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://static.vecteezy.com/system/resources/previews/016/314/735/original/home-icon-free-png.png",
  iconRetinaUrl: "https://cdn-icons-png.flaticon.com/512/619/619034.png",
  shadowUrl: "",
  iconSize: [35, 35],
  iconAnchor: [20, 35],
});

// ── Map controller ──
function MapController({ setMapInstance }) {
  const map = useMap();
  useEffect(() => { setMapInstance(map); }, [map]);
  return null;
}

// ── Zoom to selected marker ──
function ZoomToLocation({ lat, lng }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 18, { duration: 1 }); }, [lat, lng]);
  return null;
}

function formatPropertyPrice(value) {
  return Number(value || 0).toLocaleString("ar-EG");
}

function PropertyResultCard({ property, selected, nearby, onSelect, onOpen }) {
  const image = property.images?.[0];
  const isReferenceImage = !property.unitData;
  const type = property.unitData?.unitType || (property.bedrooms ? "شقة سكنية" : "وحدة سكنية");
  const location = [property.gov, property.center, property.areaName].filter(Boolean).join(" · ");
  const estimatedInstallment = property.monthlyInstallment || property.unitData?.monthlyInstallment ||
    (property.price ? Math.round((property.price * 0.8 * 0.125 / 12)) : 0);

  return (
    <article className={`result-property-card${selected ? " is-selected" : ""}`} onClick={() => onSelect(property)}>
      <div className="result-card-image-wrap">
        {image ? (
          <img src={image} alt={`صورة مرجعية لعقار ${property.name || property.id}`} className="result-card-image" />
        ) : (
          <div className="result-card-placeholder"><span>⌂</span><small>صورة مرجعية</small></div>
        )}
        {isReferenceImage && <span className="result-image-label">صورة مرجعية</span>}
        {nearby && <span className="result-nearby-label">قريب منك</span>}
        <span className="result-card-type">{type}</span>
      </div>
      <div className="result-card-body">
        <div className="result-card-price">{formatPropertyPrice(property.price)} <small>جنيه</small></div>
        <h3>{property.title || property.name || "وحدة عقارية"}</h3>
        <p className="result-card-location">⌖ {location || "مصر"}</p>
        <div className="result-card-specs">
          <span>▣ {property.area || "—"} م²</span>
          {property.bedrooms ? <span>⌂ {property.bedrooms} غرف</span> : null}
          {property.bathrooms ? <span>♢ {property.bathrooms} حمام</span> : null}
        </div>
        <div className="result-card-footer">
          <span className="result-card-installment">قسط تقريبي <b>{formatPropertyPrice(estimatedInstallment)} ج</b></span>
          <span className="result-card-reference">#{property.id}</span>
        </div>
        <button type="button" className="result-card-action" onClick={(event) => { event.stopPropagation(); onOpen(property); }}>
          عرض تفاصيل التمويل <span>←</span>
        </button>
      </div>
    </article>
  );
}

function ResultsPanel({ properties, selected, nearbyProperties, onSelect, onOpen }) {
  const [expanded, setExpanded] = useState(true);
  const [large, setLarge] = useState(false);
  const nearbyIds = new Set(nearbyProperties.map((property) => property.id));
  const handleCardWheel = (event) => {
    const scroller = event.currentTarget;
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation?.();

    // In expanded mode the list becomes a vertical grid, so keep the
    // browser's native vertical scrolling inside the results container.
    if (scroller.querySelector(".results-panel-large-marker")) return;

    // In the compact horizontal mode, convert the wheel gesture to a
    // horizontal card scroll and always cancel the map's wheel interaction.
    event.preventDefault();
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
      ? event.deltaY
      : event.deltaX;
    if (delta) scroller.scrollBy({ left: -delta, behavior: "auto" });
  };

  return (
    <section className={`results-panel${expanded ? " results-panel--expanded" : " results-panel--collapsed"}`} aria-label="نتائج البحث">
      <header className="results-panel-header">
        <div className="results-panel-heading">
          <span className="results-panel-icon">⌕</span>
          <div>
            <strong>نتائج البحث</strong>
            <span>{properties.length} عقار مطابق للبحث</span>
          </div>
        </div>
        <div className="results-panel-tools">
          {expanded && <button type="button" className="results-panel-resize" onClick={() => setLarge((value) => !value)}>^</button>}
          <span className="results-panel-context">اسحب البطاقات لاستكشاف العقارات</span>
          <button type="button" className="results-panel-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
            {expanded ? "⌄ تصغير" : "⌃ عرض النتائج"}
          </button>
        </div>
      </header>
      {expanded && (
        <div className="results-card-scroller" onWheelCapture={handleCardWheel}>
          {large && <span className="results-panel-large-marker" aria-hidden="true" />}
          {properties.length > 0 ? properties.map((property) => (
            <PropertyResultCard
              key={property.id}
              property={property}
              selected={selected?.id === property.id}
              nearby={nearbyIds.has(property.id)}
              onSelect={onSelect}
              onOpen={onOpen}
            />
          )) : <div className="results-empty-state"><span>⌂</span><strong>لا توجد عقارات مطابقة</strong><small>جرّب تغيير الفلاتر أو تكبير نطاق البحث</small></div>}
        </div>
      )}
    </section>
  );
}

// ── Draw polygon / rectangle ──
function DrawControl({ setFilteredByDraw, setHasFiltered, setPolygonDrawn, properties, clearDrawRef }) {
  const map = useMap();
  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    clearDrawRef.current = () => drawnItems.clearLayers();
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems },
      draw: { rectangle: true, polygon: true, circle: false, marker: false, polyline: false },
    });
    map.addControl(drawControl);
    const handleCreated = (event) => {
      drawnItems.clearLayers();
      const layer = event.layer;
      drawnItems.addLayer(layer);
      const drawnGeo = layer.toGeoJSON();
      const results = properties.filter((p) =>
        turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), drawnGeo)
      );
      setFilteredByDraw(results);
      setPolygonDrawn(true);
      setHasFiltered(true);
    };
    map.on(L.Draw.Event.CREATED, handleCreated);
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.removeControl(drawControl);
    };
  }, [map, properties]);
  return null;
}

// ── Fullscreen control ──
function FullscreenControl() {
  const map = useMap();
  useEffect(() => {
    const FullscreenBtn = L.Control.extend({
      onAdd() {
        const btn = L.DomUtil.create("button", "leaflet-bar leaflet-control");
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        btn.title = "تكبير الشاشة";
        btn.style.cssText = "width:30px;height:30px;cursor:pointer;background:#fff;border:none;display:flex;align-items:center;justify-content:center;";
        L.DomEvent.on(btn, "click", (e) => {
          L.DomEvent.stopPropagation(e);
          const container = map.getContainer();
          if (!document.fullscreenElement) {
            container.requestFullscreen();
            btn.style.background = "#f0f9ff";
          } else {
            document.exitFullscreen();
            btn.style.background = "#fff";
          }
        });
        return btn;
      },
      onRemove() {},
    });
    const ctrl = new FullscreenBtn({ position: "topleft" });
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

// ── FitBounds ──
function FitBounds({ data, selected, isUserZooming }) {
  const map = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (!data || data.length === 0) return;
    if (selected) return;
    if (isUserZooming) return;
    if (JSON.stringify(prevRef.current) === JSON.stringify(data)) return;
    prevRef.current = data;
    const bounds = L.latLngBounds(data.map((p) => [p.lat, p.lng]));
    map.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
  }, [data, selected, isUserZooming]);
  return null;
}

// ── Custom person icon ──
const personIcon = L.divIcon({
  html: `<div style="font-size:46px;line-height:1;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.55));animation:person-bounce 1.4s ease-in-out infinite;">🧍</div>`,
  className: "",
  iconSize: [50, 56],
  iconAnchor: [25, 56],
  popupAnchor: [0, -56],
});

// ── Property data ──
const BASE_PROPERTIES = [
  { id: 1, gov: "القاهرة", center: "مدينة نصر", areaName: "عباس العقاد", name: "مدينة نصر", title: "شقة بمدينة نصر - عباس العقاد", address: "شارع عباس العقاد", area: 220, finishing: "تشطيب كامل", utilities: "كاملة", price: 1250000, lat: 30.056, lng: 31.337, images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c", "https://images.unsplash.com/photo-1560448204-603b3fc33ddc"], video: "https://www.youtube.com/embed/iqlohXTD6Zs" },
  { id: 2, gov: "القاهرة", center: "التجمع الخامس", areaName: "شارع التسعين", name: "التجمع الخامس", title: "شقة بالتجمع الخامس - شارع التسعين", address: "التسعين الشمالي", area: 160, finishing: "نصف تشطيب", utilities: "كاملة", price: 2100000, lat: 30.028, lng: 31.47, images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511", "https://images.unsplash.com/photo-1493809842364-78817add7ffb"], video: null },
  { id: 3, gov: "القاهرة", center: "التجمع الخامس", areaName: "بيت الوطن", name: "التجمع الخامس", title: "شقة ببيت الوطن - التجمع", address: "حي بيت الوطن", area: 180, finishing: "تشطيب كامل", utilities: "كاملة", price: 2600000, lat: 30.032, lng: 31.48, images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"], video: null },
  { id: 4, gov: "القاهرة", center: "التجمع الخامس", areaName: "اللوتس", name: "التجمع الخامس", title: "شقة في اللوتس - التجمع", address: "حي اللوتس", area: 140, finishing: "نصف تشطيب", utilities: "كاملة", price: 1950000, lat: 30.025, lng: 31.46, images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7"], video: null },
  { id: 5, gov: "الجيزة", center: "الدقي", areaName: "شارع التحرير", name: "الدقي", title: "شقة بالدقي - شارع التحرير", address: "شارع التحرير", area: 130, finishing: "تشطيب متوسط", utilities: "كاملة", price: 1550000, lat: 30.038, lng: 31.21, images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc"], video: null },
  { id: 6, gov: "الإسكندرية", center: "سموحة", areaName: "شارع فوزي معاذ", name: "سموحة", title: "شقة بسموحة - شارع فوزي معاذ", address: "شارع فوزي معاذ", area: 200, finishing: "تشطيب كامل", utilities: "كاملة", price: 1800000, lat: 31.22, lng: 29.95, images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"], video: null },
  { id: 9, gov: "القاهرة", center: "حلوان", areaName: "كورنيش النيل", name: "حلوان", title: "شقة بحلوان - كورنيش النيل", address: "كورنيش النيل", area: 120, finishing: "تشطيب كامل", utilities: "كاملة", price: 950000, lat: 29.899, lng: 31.298, images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7"], video: null },
  { id: 10, gov: "القاهرة", center: "حلوان", areaName: "شارع الحرية", name: "حلوان", title: "شقة بحلوان - شارع الحرية", address: "شارع الحرية", area: 95, finishing: "نصف تشطيب", utilities: "كاملة", price: 780000, lat: 29.896, lng: 31.296, images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb"], video: null },
  { id: 11, gov: "القاهرة", center: "حلوان", areaName: "شارع الصناعة", name: "حلوان", title: "شقة بحلوان - شارع الصناعة", address: "شارع الصناعة", area: 160, finishing: "تشطيب سوبر لوكس", utilities: "كاملة", price: 1350000, lat: 29.9, lng: 31.295, images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"], video: null },
  { id: 12, gov: "القاهرة", center: "التجمع الخامس", areaName: "شارع التسعين1", name: "التجمع الخامس", title: "شقة بالتجمع الخامس - شارع التسعين1", address: "التسعين الشمالي", area: 150, finishing: "سوبر لوكس", utilities: "كاملة", price: 5000000, lat: 30.02909869912692, lng: 31.464569314799622, images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511"], video: null },
  { id: 13, gov: "القاهرة", center: "التجمع الخامس", areaName: "2شارع التسعين", name: "التجمع الخامس", title: "شقة بالتجمع الخامس - شارع التسعين2", address: "التسعين الشمالي", area: 120, finishing: "سوبر لوكس", utilities: "كاملة", price: 4000000, lat: 30.031518380835916, lng: 31.457531198420472, images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511"], video: null },
  { id: 14, gov: "القاهرة", center: "التجمع الخامس", areaName: "3شارع التسعين", name: "التجمع الخامس", title: "شقة بالتجمع الخامس - شارع التسعين3", address: "التسعين الشمالي", area: 150, finishing: "سوبر لوكس", utilities: "كاملة", price: 7000000, lat: 30.027984046605617, lng: 31.457745775139347, images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511"], video: null },
];

const locations = {
  القاهرة: { "مدينة نصر": ["عباس العقاد", "مكرم عبيد"], التجمع: ["التجمع الخامس", "التجمع الأول"], حلوان: ["حلوان"] },
  الجيزة: { الدقي: ["شارع التحرير", "البحوث"], المهندسين: ["جامعة الدول", "العجوزة"] },
  الإسكندرية: { سموحة: ["شارع فوزي معاذ", "شارع أبو قير"], "سيدي جابر": ["شارع المشير", "شارع جمال عبد الناصر"] },
};

// ── Main Component ──
export default function FinanceMap() {
  const [workflowRevision, setWorkflowRevision] = useState(0);
  useEffect(() => {
    const refreshWorkflow = () => setWorkflowRevision((value) => value + 1);
    window.addEventListener("storage", refreshWorkflow);
    window.addEventListener("workflow-requests-changed", refreshWorkflow);
    return () => {
      window.removeEventListener("storage", refreshWorkflow);
      window.removeEventListener("workflow-requests-changed", refreshWorkflow);
    };
  }, []);

  const approvedRequests = useMemo(() => getWorkflowRequests()
    .filter((request) => request.kind === "unit" && request.status === "eligible" && request.decision === "eligible" && request.reviewerDecisionAt && Number.isFinite(Number(request.location?.lat)) && Number.isFinite(Number(request.location?.lng))), [workflowRevision]);
  const [approvedAssets, setApprovedAssets] = useState({});
  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];
    Promise.all(approvedRequests.map(async (request) => {
      try {
        const files = await getWorkflowFiles(request.id);
        const images = files.filter((file) => file.key.startsWith("photo-") && file.blob.type.startsWith("image/"));
        const video = files.find((file) => file.key === "video" && file.blob.type.startsWith("video/"));
        const imageUrls = images.map((file) => { const url = URL.createObjectURL(file.blob); objectUrls.push(url); return url; });
        const videoUrl = video ? URL.createObjectURL(video.blob) : null;
        if (videoUrl) objectUrls.push(videoUrl);
        return [request.id, { images: imageUrls, video: videoUrl }];
      } catch {
        return [request.id, { images: [], video: null }];
      }
    })).then((entries) => { if (!cancelled) setApprovedAssets(Object.fromEntries(entries)); });
    return () => { cancelled = true; objectUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [approvedRequests]);
  const approvedProperties = useMemo(() => approvedRequests.map((request) => {
      const data = request.data || {};
      const address = [data.street, data.buildingNumber && `عمارة ${data.buildingNumber}`, data.floor && `الدور ${data.floor}`, data.unitNumber && `وحدة ${data.unitNumber}`].filter(Boolean).join("، ");
      return {
        id: `approved-${request.id}`, gov: data.governorate || "", center: data.district || "", areaName: data.street || "",
        name: data.district || data.governorate || "وحدة معتمدة", title: `${data.unitType || "وحدة"} في ${data.district || data.governorate || "مصر"}`,
        address: address || data.fullAddress || "", area: Number(data.area) || 0, finishing: data.condition || "غير محدد",
        utilities: (data.utilities || []).join("، ") || "غير محددة", price: Number(data.price) || 0,
        lat: Number(request.location.lat), lng: Number(request.location.lng),
        images: approvedAssets[request.id]?.images || [], video: approvedAssets[request.id]?.video || null,
        bedrooms: Number(data.rooms) || 0, bathrooms: Number(data.bathrooms) || 0, floor: data.floor || "",
        unitData: data,
      };
    }), [approvedRequests, approvedAssets]);
  const properties = useMemo(() => [...BASE_PROPERTIES, ...approvedProperties], [approvedProperties]);
  const [gov, setGov] = useState("");
  const [center, setCenter] = useState("");
  const [area, setArea] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filteredByDraw, setFilteredByDraw] = useState([]);
  const [hasFiltered, setHasFiltered] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [polygonDrawn, setPolygonDrawn] = useState(false);
  const [drawBtnText, setDrawBtnText] = useState("🟦 استعلام مكاني");
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [isUserZooming, setIsUserZooming] = useState(false);
  const [popupPos, setPopupPos] = useState(null);

  // ── Sidebar state (desktop/tablet) ──
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Bottom sheet state (mobile) ──
  const [sheetSnap, setSheetSnap] = useState("collapsed"); // "collapsed" | "expanded"

  // ── Detect mobile ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 700);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Track fullscreen state ──
  // Leaflet calls requestFullscreen() on its own map container element,
  // leaving the sidebar/sheet outside the fullscreen DOM.
  // We use a React Portal to inject the filters INSIDE that container.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsContainer, setFsContainer] = useState(null);
  const [fsSidebarOpen, setFsSidebarOpen] = useState(true);
  const [fsSheetSnap, setFsSheetSnap] = useState("collapsed");

  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement;
      if (!el?.classList.contains("map-container")) {
        setIsFullscreen(false);
        setFsContainer(null);
        return;
      }
      setIsFullscreen(!!el);
      setFsContainer(el || null);
      if (!el) { setFsSidebarOpen(true); setFsSheetSnap("collapsed"); }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Price filter state
  const PRICE_MIN = Math.min(...properties.map((p) => p.price));
  const PRICE_MAX = Math.max(...properties.map((p) => p.price));
  const [priceMin, setPriceMin] = useState(PRICE_MIN);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [priceFilterActive, setPriceFilterActive] = useState(false);
  const [showPricePanel, setShowPricePanel] = useState(false);
  const sliderTrackRef = useRef(null);

  // Area filter state
  const AREA_MIN = Math.min(...properties.filter((p) => p.area).map((p) => p.area));
  const AREA_MAX = Math.max(...properties.filter((p) => p.area).map((p) => p.area));
  const [areaMin, setAreaMin] = useState(AREA_MIN);
  const [areaMax, setAreaMax] = useState(AREA_MAX);
  const [areaFilterActive, setAreaFilterActive] = useState(false);
  const [showAreaPanel, setShowAreaPanel] = useState(false);
  const areaSliderTrackRef = useRef(null);

  const mapRef = useRef(null);
  const clearDrawRef = useRef(null);
  const popupRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const sheetStartY = useRef(null);

  // ── Touch drag for bottom sheet ──
  const handleSheetTouchStart = (e) => {
    sheetStartY.current = e.touches[0].clientY;
  };
  const handleSheetTouchEnd = (e) => {
    if (sheetStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - sheetStartY.current;
    if (delta < -40) setSheetSnap("expanded");
    else if (delta > 40) setSheetSnap("collapsed");
    sheetStartY.current = null;
  };

  // ── Results popup drag (desktop) ──
  const handlePopupDragStart = (e) => {
    e.preventDefault();
    const popup = popupRef.current;
    const container = mapRef.current;
    if (!popup || !container) return;
    const rect = popup.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const startLeft = rect.left - containerRect.left;
    const startTop = rect.top - containerRect.top;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - startLeft, y: e.clientY - startTop };
    const onMove = (ev) => {
      if (!isDragging.current || !container) return;
      const cr = container.getBoundingClientRect();
      const newLeft = Math.max(0, Math.min(ev.clientX - dragOffset.current.x, cr.width - rect.width));
      const newTop = Math.max(0, Math.min(ev.clientY - dragOffset.current.y, cr.height - 60));
      setPopupPos({ left: newLeft, top: newTop });
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  useEffect(() => {
    if (!isUserZooming) return;
    const t = setTimeout(() => setIsUserZooming(false), 3000);
    return () => clearTimeout(t);
  }, [isUserZooming]);

  useEffect(() => {
    if (!userLocation || !mapInstance) return;
    const points = nearbyProperties.map((p) => [p.lat, p.lng]);
    setTimeout(() => {
      if (points.length === 0) {
        mapInstance.setView(L.latLng(userLocation[0], userLocation[1]), 17);
      } else {
        const bounds = L.latLngBounds([userLocation, ...points]);
        mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, duration: 1 });
      }
    }, 100);
  }, [userLocation, nearbyProperties, mapInstance]);

  const handleDrawBtnClick = () => {
    setDrawMode((d) => {
      const next = !d;
      setDrawBtnText(next ? "❌ إلغاء الاستعلام المكاني" : "🟦 استعلام مكاني");
      return next;
    });
  };

  const findNearby = (loc) => {
    setUserLocation(loc);
    setIsUserZooming(true);
    const nearby = properties.filter((p) => {
      const dist = turf.distance(turf.point([loc[1], loc[0]]), turf.point([p.lng, p.lat]), { units: "meters" });
      return dist <= 500;
    });
    setNearbyProperties(nearby);
  };

  const handleUserLocationZoom = () => {
    if (!navigator.geolocation) return alert("المتصفح لا يدعم تحديد الموقع");
    navigator.geolocation.getCurrentPosition(
      (pos) => findNearby([pos.coords.latitude, pos.coords.longitude]),
      () => alert("تعذر الحصول على الموقع الحالي")
    );
  };

  const filteredProperties = properties.filter(
    (p) =>
      (gov === "ALL" || !gov || p.gov === gov) &&
      (!center || p.center === center) &&
      (!area || p.areaName === area) &&
      (!priceFilterActive || (p.price >= priceMin && p.price <= priceMax)) &&
      (!areaFilterActive || !p.area || (p.area >= areaMin && p.area <= areaMax))
  );

  const displayProperties = (() => {
    if (drawMode) {
      if (!polygonDrawn) return [];
      const drawIds = new Set(filteredByDraw.map((p) => p.id));
      return filteredProperties.filter((p) => drawIds.has(p.id));
    }
    if (hasFiltered) return filteredProperties;
    return [];
  })();

  const allDisplayed = [
    ...new Map([...displayProperties, ...nearbyProperties, ...approvedProperties].map((p) => [p.id, p])).values(),
  ];

  const handlePropertySelect = (property) => {
    setSelected(property);
    if (mapInstance && Number.isFinite(Number(property.lat)) && Number.isFinite(Number(property.lng))) {
      mapInstance.flyTo([property.lat, property.lng], 18, { duration: 1 });
    }
  };

  // Price histogram
  const PRICE_BUCKETS = 10;
  const priceBucketSize = (PRICE_MAX - PRICE_MIN) / PRICE_BUCKETS;
  const priceHistogram = Array.from({ length: PRICE_BUCKETS }, (_, i) => {
    const lo = PRICE_MIN + i * priceBucketSize;
    const hi = lo + priceBucketSize;
    return properties.filter((p) => p.price >= lo && (i === PRICE_BUCKETS - 1 ? p.price <= hi : p.price < hi)).length;
  });
  const priceHistMax = Math.max(...priceHistogram, 1);

  // Area histogram
  const AREA_BUCKETS = 8;
  const areaBucketSize = (AREA_MAX - AREA_MIN) / AREA_BUCKETS;
  const areaHistogram = Array.from({ length: AREA_BUCKETS }, (_, i) => {
    const lo = AREA_MIN + i * areaBucketSize;
    const hi = lo + areaBucketSize;
    return properties.filter((p) => p.area && p.area >= lo && (i === AREA_BUCKETS - 1 ? p.area <= hi : p.area < hi)).length;
  });
  const areaHistMax = Math.max(...areaHistogram, 1);

  const applyPriceFilter = () => { setPriceFilterActive(true); setHasFiltered(true); setShowPricePanel(false); };
  const resetPriceFilter = () => { setPriceMin(PRICE_MIN); setPriceMax(PRICE_MAX); setPriceFilterActive(false); };
  const applyAreaFilter = () => { setAreaFilterActive(true); setHasFiltered(true); setShowAreaPanel(false); };
  const resetAreaFilter = () => { setAreaMin(AREA_MIN); setAreaMax(AREA_MAX); setAreaFilterActive(false); };

 const makeDragHandler =
  (
    handle,
    setMin,
    setMax,
    minVal,
    maxVal,
    globalMin,
    globalMax,
    trackRef,
    step = 10000
  ) =>
  (e) => {

    e.preventDefault();
    e.stopPropagation();

    const track = trackRef.current;

    if (!track) return;

    const rect = track.getBoundingClientRect();

    const move = (clientX) => {

      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width)
      );

      const value =
        Math.round(
          (globalMin + ratio * (globalMax - globalMin)) / step
        ) * step;

      if (handle === "min") {
        setMin(Math.min(value, maxVal - step));
      } else {
        setMax(Math.max(value, minVal + step));
      }
    };

    const onMouseMove = (ev) => {
      move(ev.clientX);
    };

    const onTouchMove = (ev) => {
      move(ev.touches[0].clientX);
    };

    const cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", cleanup);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", cleanup);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", cleanup);

    document.addEventListener("touchmove", onTouchMove, {
      passive: false,
    });

    document.addEventListener("touchend", cleanup);
  };

  const startPriceDrag = (h) => makeDragHandler(h, setPriceMin, setPriceMax, priceMin, priceMax, PRICE_MIN, PRICE_MAX, sliderTrackRef, 50000);
  const startAreaDrag = (h) => makeDragHandler(h, setAreaMin, setAreaMax, areaMin, areaMax, AREA_MIN, AREA_MAX, areaSliderTrackRef, 5);

  const pMinPct = ((priceMin - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const pMaxPct = ((priceMax - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const aMinPct = ((areaMin - AREA_MIN) / (AREA_MAX - AREA_MIN)) * 100;
  const aMaxPct = ((areaMax - AREA_MIN) / (AREA_MAX - AREA_MIN)) * 100;

  const activeFiltersCount = [gov, center, area, priceFilterActive, areaFilterActive, userLocation].filter(Boolean).length;
  const pricePreviewCount = properties.filter((p) => p.price >= priceMin && p.price <= priceMax).length;
  const areaPreviewCount = properties.filter((p) => !p.area || (p.area >= areaMin && p.area <= areaMax)).length;
  const displayedResultsCount = allDisplayed.length;
  const locationSummary = gov === "ALL" ? "جميع المحافظات" : [area, center, gov].filter(Boolean).join(" / ") || "ابحث حسب الموقع والسعر والمساحة";

  // Close panels on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".filter-pill-popup")) {
        setShowPricePanel(false);
        setShowAreaPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleResetAll = () => {
    setFilteredByDraw([]); setHasFiltered(false); setPolygonDrawn(false);
    setDrawMode(false); setDrawBtnText("🟦 استعلام مكاني");
    setGov(""); setCenter(""); setArea("");
    setUserLocation(null); setNearbyProperties([]); setPopupPos(null);
    setPriceMin(PRICE_MIN); setPriceMax(PRICE_MAX); setPriceFilterActive(false); setShowPricePanel(false);
    setAreaMin(AREA_MIN); setAreaMax(AREA_MAX); setAreaFilterActive(false); setShowAreaPanel(false);
    if (clearDrawRef.current) clearDrawRef.current();
    if (mapInstance) mapInstance.flyTo([30.0444, 31.2357], 10, { duration: 1 });
  };

  // ── RangePanel component ──
  const RangePanel = ({
  title,
  icon,
  globalMin,
  globalMax,
  curMin,
  curMax,
  setCurMin,
  setCurMax,
  startMinDrag,
  startMaxDrag,
  trackRef,
  minPct,
  maxPct,
  onApply,
  onCancel,
  step = 50000,
  formatVal = (v) => v.toLocaleString("ar-EG"),
  unitLabel = "جنيه",
  previewMsg,
}) => {

  // local input states
  const [minInput, setMinInput] = useState(curMin);
  const [maxInput, setMaxInput] = useState(curMax);

  useEffect(() => {
    setMinInput(curMin);
  }, [curMin]);

  useEffect(() => {
    setMaxInput(curMax);
  }, [curMax]);

  const handleMinBlur = () => {
    let value = Number(minInput);

    if (isNaN(value)) value = globalMin;

    value = Math.max(globalMin, value);
    value = Math.min(value, curMax - step);

    setCurMin(value);
    setMinInput(value);
  };

  const handleMaxBlur = () => {
    let value = Number(maxInput);

    if (isNaN(value)) value = globalMax;

    value = Math.min(globalMax, value);
    value = Math.max(value, curMin + step);

    setCurMax(value);
    setMaxInput(value);
  };

  return (
    <div
      className="filter-pill-popup range-panel"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >

      {/* header */}
      <div className="rp-header">
        <span className="rp-icon">{icon}</span>
        <span className="rp-title">{title}</span>
      </div>

  

      {/* inputs */}
      <div className="rp-inputs">

        {/* min */}
        <div className="rp-input-block">
          <label className="rp-input-label">
            الحد الأدنى
          </label>

          <div className="rp-input-field">
            <input
              type="number"
              value={minInput}
              step={step}
              onChange={(e) => setMinInput(e.target.value)}
              onBlur={handleMinBlur}
            />

            <span className="rp-input-unit">
              {unitLabel}
            </span>
          </div>
        </div>

        <div className="rp-input-sep">
          <div className="rp-sep-line" />
        </div>

        {/* max */}
        <div className="rp-input-block">
          <label className="rp-input-label">
            الحد الأقصى
          </label>

          <div className="rp-input-field">
            <input
              type="number"
              value={maxInput}
              step={step}
              onChange={(e) => setMaxInput(e.target.value)}
              onBlur={handleMaxBlur}
            />

            <span className="rp-input-unit">
              {unitLabel}
            </span>
          </div>
        </div>

      </div>

      {/* preview */}
      <div className={`rp-preview ${previewMsg > 0 ? "found" : "empty"}`}>
        {previewMsg > 0 ? (
          <>
            <span className="rp-dot green" />
            {previewMsg} عقار متاح
          </>
        ) : (
          <>
            <span className="rp-dot amber" />
            لا يوجد عقارات
          </>
        )}
      </div>

      {/* actions */}
      <div className="rp-actions">

        <button
          type="button"
          className="rp-btn-cancel"
          onClick={onCancel}
        >
          إلغاء
        </button>

        <button
          type="button"
          className="rp-btn-apply"
          onClick={onApply}
          disabled={previewMsg === 0}
        >
          تطبيق
        </button>

      </div>
    </div>
  );
};

  // ── Shared filter body (used in both sidebar and bottom sheet) ──
  const FiltersBody = () => (
    <div className="filters-toolbar">
      {/* Brand chip */}
      <div className="filter-brand">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>عقارات</span>
      </div>

      <div className="filter-sep" />

      {/* الموقع */}
      <div className="filter-pill-group">
        <span className="fpg-label">📍 الموقع</span>
        <div className="fpg-controls">
          <div className="fp-select-wrap">
            <select className="fp-select" value={gov} onChange={(e) => { setGov(e.target.value); setCenter(""); setArea(""); setHasFiltered(true); setSelected(null); }}>
              <option value="">المحافظة</option>
              {Object.keys(locations).map((g) => <option key={g}>{g}</option>)}
              <option value="ALL">الكل</option>
            </select>
          </div>
          <div className="fp-select-wrap">
            <select className="fp-select" value={center} onChange={(e) => { setCenter(e.target.value); setArea(""); setHasFiltered(true); setSelected(null); }}>
              <option value="">المركز</option>
              {gov && locations[gov] && Object.keys(locations[gov]).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="fp-select-wrap">
            <select className="fp-select" value={area} onChange={(e) => { setArea(e.target.value); setHasFiltered(true); setSelected(null); }}>
              <option value="">الشياخة</option>
              {gov && center && locations[gov]?.[center]?.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="filter-sep" />

      {/* السعر */}
      <div className="filter-pill-group" style={{ position: "relative" }}>
        <span className="fpg-label">💰 السعر</span>
        <div className="fpg-controls">
          <button  type="button" className={`fp-pill-btn${priceFilterActive ? " fp-pill-active" : ""}${showPricePanel ? " fp-pill-open" : ""}`} onClick={() => { setShowPricePanel((v) => !v); setShowAreaPanel(false); }}>
            <span className="fp-pill-icon">💰</span>
            <span className="fp-pill-label">{priceFilterActive ? `${(priceMin / 1000000).toFixed(1)}م — ${(priceMax / 1000000).toFixed(1)}م` : "نطاق السعر"}</span>
            {priceFilterActive ? (
              <span className="fp-pill-clear" onMouseDown={(e) => { e.stopPropagation(); resetPriceFilter(); }}>✕</span>
            ) : (
              <svg className="fp-pill-chevron" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            )}
          </button>
          {showPricePanel && (
            <RangePanel title="نطاق السعر" icon="💰" histogram={priceHistogram} histMax={priceHistMax} globalMin={PRICE_MIN} globalMax={PRICE_MAX} curMin={priceMin} curMax={priceMax} setCurMin={setPriceMin} setCurMax={setPriceMax} startMinDrag={startPriceDrag("min")} startMaxDrag={startPriceDrag("max")} trackRef={sliderTrackRef} minPct={pMinPct} maxPct={pMaxPct} onApply={applyPriceFilter} onCancel={() => setShowPricePanel(false)} step={50000} formatVal={(v) => `${(v / 1000000).toFixed(2)}م`} unitLabel="جنيه" previewMsg={pricePreviewCount} />
          )}
        </div>
      </div>

      <div className="filter-sep" />

      {/* المساحة */}
      <div className="filter-pill-group" style={{ position: "relative" }}>
        <span className="fpg-label">📐 المساحة</span>
        <div className="fpg-controls">
          <button  type="button" className={`fp-pill-btn${areaFilterActive ? " fp-pill-active fp-pill-area" : ""}${showAreaPanel ? " fp-pill-open" : ""}`} onClick={() => { setShowAreaPanel((v) => !v); setShowPricePanel(false); }}>
            <span className="fp-pill-icon">📐</span>
            <span className="fp-pill-label">{areaFilterActive ? `${areaMin} — ${areaMax} م²` : "نطاق المساحة"}</span>
            {areaFilterActive ? (
              <span className="fp-pill-clear" onMouseDown={(e) => { e.stopPropagation(); resetAreaFilter(); }}>✕</span>
            ) : (
              <svg className="fp-pill-chevron" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            )}
          </button>
          {showAreaPanel && (
            <RangePanel title="نطاق المساحة" icon="📐" histogram={areaHistogram} histMax={areaHistMax} globalMin={AREA_MIN} globalMax={AREA_MAX} curMin={areaMin} curMax={areaMax} setCurMin={setAreaMin} setCurMax={setAreaMax} startMinDrag={startAreaDrag("min")} startMaxDrag={startAreaDrag("max")} trackRef={areaSliderTrackRef} minPct={aMinPct} maxPct={aMaxPct} onApply={applyAreaFilter} onCancel={() => setShowAreaPanel(false)} step={5} formatVal={(v) => `${v} م²`} unitLabel="م²" previewMsg={areaPreviewCount} />
          )}
        </div>
      </div>

      <div className="filter-sep" />

      {/* جغرافي */}
      <div className="filter-pill-group">
        <span className="fpg-label">🧭 جغرافي</span>
        <div className="fpg-controls">
          <button  type="button" className={`fp-pill-btn fp-geo-btn${userLocation ? " fp-pill-active" : ""}`} onClick={handleUserLocationZoom}>
            <span className="fp-pill-icon">🧭</span>
            <span className="fp-pill-label">موقعي</span>
          </button>
          <button  type="button" className={`fp-pill-btn fp-geo-btn${drawMode ? " fp-pill-draw" : ""}`} onClick={handleDrawBtnClick} title={drawBtnText} aria-label={drawBtnText}>
            <span className="fp-pill-icon">{drawMode ? "❌" : "🟦"}</span>
            <span className="fp-pill-label">{drawMode ? "إلغاء" : "استعلام"}</span>
          </button>
        </div>
      </div>

      <div className="filter-sep" />

      {/* مسح الكل */}
      <button  type="button" className="fp-reset-btn" onClick={handleResetAll}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
        مسح الكل
        {activeFiltersCount > 0 && <span className="fp-reset-badge">{activeFiltersCount}</span>}
      </button>
    </div>
  );

  return (
    <div className="finance-page" ref={mapRef}>

      {/* ══════════════════════════════════════════
          DESKTOP / TABLET: sidebar layout
      ══════════════════════════════════════════ */}
      {!isMobile && (
        <div className={`fm-layout${sidebarOpen ? " fm-layout--open" : " fm-layout--closed"}`}>

          {/* ── Sidebar panel ── */}
          <aside className="fm-sidebar">
            {/* Sidebar header */}
            <div className="fm-sidebar-header">
              <div className="fm-sidebar-heading">
                <span className="filters-kicker">لوحة البحث الذكية</span>
                <strong className="filters-title">اختيار أسرع للعقار المناسب</strong>
                <p className="filters-summary">{locationSummary}</p>
              </div>
              <div className="fm-sidebar-chips">
                <div className="filters-status-chip">
                  <span className="filters-status-value">{displayedResultsCount}</span>
                  <span className="filters-status-label">نتيجة</span>
                </div>
                <div className="filters-status-chip">
                  <span className="filters-status-value">{activeFiltersCount}</span>
                  <span className="filters-status-label">فلتر</span>
                </div>
              </div>
            </div>

            {/* Sidebar filter body */}
            <div className="fm-sidebar-body">
              <FiltersBody />
            </div>
          </aside>

          {/* ── Sidebar toggle tab ── */}
          <button
           type="button"
            className="fm-sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "إخفاء الفلاتر" : "عرض الفلاتر"}
            title={sidebarOpen ? "إخفاء الفلاتر" : "عرض الفلاتر"}
          >
            <svg viewBox="0 0 10 16" fill="none" width="10" height="16">
              <path d={sidebarOpen ? "M7 1L2 8l5 7" : "M3 1l5 7-5 7"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* ── Map area ── */}
          <div className="fm-map-area">
            {/* Results popup */}
            {(allDisplayed.length > 0 || (drawMode && polygonDrawn)) && (
              <div className="results-popup" ref={popupRef} style={popupPos ? { top: popupPos.top, left: popupPos.left, right: "unset" } : undefined}>
                <div className="popup-drag-handle" onMouseDown={handlePopupDragStart} title="اسحب لتحريك الجدول">
                  <span className="drag-dots">⠿</span>
                  <h3 className="popup-title" style={{ margin: 0 }}>
                    {allDisplayed.length > 0 ? `نتائج البحث (${allDisplayed.length})` : "نتائج البحث"}
                    {nearbyProperties.length > 0 && <span className="nearby-badge" style={{ marginRight: 8, fontSize: 11 }}>{nearbyProperties.length} قريب منك</span>}
                  </h3>
                  <span className="drag-dots">⠿</span>
                </div>
                {allDisplayed.length === 0 ? (
                  <div className="no-results"><span>🏠</span><p>لا يوجد عقارات في هذه المنطقة</p></div>
                ) : (
                  <table className="results-table">
                    <thead><tr><th>المنطقة</th><th>السعر</th><th>المساحة</th><th></th></tr></thead>
                    <tbody>
                      {allDisplayed.map((p) => {
                        const isNearby = nearbyProperties.some((n) => n.id === p.id);
                        return (
                          <tr key={p.id} style={isNearby ? { background: "rgba(16,185,129,0.07)" } : {}}>
                            <td>{isNearby && <span className="nearby-badge">📍قريب</span>}{p.name}</td>
                            <td className="price">{p.price.toLocaleString("ar-EG")}جنيه</td>
                            <td className="area">{p.area ? `${p.area} م²` : "غير محددة"}</td>
                            <td><button  type="button" className="zoomBtn" onClick={() => setSelected(p)}>عرض</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            <ResultsPanel
              properties={allDisplayed}
              selected={selected}
              nearbyProperties={nearbyProperties}
              onSelect={handlePropertySelect}
              onOpen={(property) => { setSelected(property); setSelectedProperty(property); }}
            />

            {/* Map */}
            <MapContainer center={[30.0444, 31.2357]} zoom={7} className="map-container">
              <MapController setMapInstance={setMapInstance} />
              <FullscreenControl />
              <LayersControl position="topright">
                <BaseLayer checked name="Satellite">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </BaseLayer>
                <BaseLayer name="OpenStreetMap">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </BaseLayer>
              </LayersControl>
              {allDisplayed.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]} opacity={selected?.id === p.id ? 1 : 0.78} zIndexOffset={selected?.id === p.id ? 1000 : 0} eventHandlers={{ click: () => { handlePropertySelect(p); setSelectedProperty(p); } }}>
                  <Popup><strong>{p.name}</strong><br />السعر: {p.price.toLocaleString("ar-EG")} جنيه</Popup>
                </Marker>
              ))}
              {userLocation && (
                <>
                  <Marker position={userLocation} icon={personIcon}>
                    <Popup><div style={{ textAlign: "center", fontFamily: "Tajawal, sans-serif", direction: "rtl" }}><strong>📍 أنت هنا</strong><br /><small style={{ color: "#64748b" }}>دائرة 500 متر حولك</small></div></Popup>
                  </Marker>
                  <Circle center={userLocation} radius={500} pathOptions={{ color: "#3b82f6", fillColor: "#000000", fillOpacity: 0.5, weight: 3 }} />
                </>
              )}
              {allDisplayed.length > 0 && <FitBounds data={allDisplayed} selected={selected} isUserZooming={isUserZooming} />}
              {selected && <ZoomToLocation lat={selected.lat} lng={selected.lng} />}
              {drawMode && <DrawControl setFilteredByDraw={setFilteredByDraw} setHasFiltered={setHasFiltered} setPolygonDrawn={setPolygonDrawn} properties={properties} clearDrawRef={clearDrawRef} />}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MOBILE: full map + bottom sheet
      ══════════════════════════════════════════ */}
      {isMobile && (
        <div className="fm-mobile-layout">

          {/* Map fills full height */}
          <div className="fm-mobile-map">
            <MapContainer center={[30.0444, 31.2357]} zoom={10} className="map-container">
              <MapController setMapInstance={setMapInstance} />
              <FullscreenControl />
              <LayersControl position="topright">
                <BaseLayer checked name="Satellite">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </BaseLayer>
                <BaseLayer name="OpenStreetMap">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </BaseLayer>
              </LayersControl>
              {allDisplayed.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]} opacity={selected?.id === p.id ? 1 : 0.78} zIndexOffset={selected?.id === p.id ? 1000 : 0} eventHandlers={{ click: () => { handlePropertySelect(p); setSelectedProperty(p); } }}>
                  <Popup><strong>{p.name}</strong><br />السعر: {p.price.toLocaleString("ar-EG")} جنيه</Popup>
                </Marker>
              ))}
              {userLocation && (
                <>
                  <Marker position={userLocation} icon={personIcon}>
                    <Popup><div style={{ textAlign: "center", fontFamily: "Tajawal, sans-serif", direction: "rtl" }}><strong>📍 أنت هنا</strong><br /><small style={{ color: "#64748b" }}>دائرة 500 متر حولك</small></div></Popup>
                  </Marker>
                  <Circle center={userLocation} radius={500} pathOptions={{ color: "#3b82f6", fillColor: "#000000", fillOpacity: 0.5, weight: 3 }} />
                </>
              )}
              {allDisplayed.length > 0 && <FitBounds data={allDisplayed} selected={selected} isUserZooming={isUserZooming} />}
              {selected && <ZoomToLocation lat={selected.lat} lng={selected.lng} />}
              {drawMode && <DrawControl setFilteredByDraw={setFilteredByDraw} setHasFiltered={setHasFiltered} setPolygonDrawn={setPolygonDrawn} properties={properties} clearDrawRef={clearDrawRef} />}
            </MapContainer>
          </div>

          {/* ── Bottom sheet ── */}
          <div
            className={`fm-sheet fm-sheet--${sheetSnap}`}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
          >
            {/* Drag handle + summary header */}
            <div className="fm-sheet-handle-area" onClick={() => setSheetSnap((s) => s === "collapsed" ? "expanded" : "collapsed")}>
              <div className="fm-sheet-handle" />
              <div className="fm-sheet-summary">
                <div className="fm-sheet-summary-left">
                  <span className="fm-sheet-title">الفلاتر</span>
                  {activeFiltersCount > 0 && <span className="fm-sheet-badge">{activeFiltersCount} نشط</span>}
                </div>
                <div className="fm-sheet-chips">
                  <span className="fm-sheet-chip">{displayedResultsCount} نتيجة</span>
                  <span className="fm-sheet-chevron">{sheetSnap === "expanded" ? "↓" : "↑"}</span>
                </div>
              </div>
            </div>

            {/* Scrollable filter content */}
            <div className="fm-sheet-content">
              <FiltersBody />
            </div>

            {/* Results inside sheet when expanded */}
            {sheetSnap === "expanded" && allDisplayed.length > 0 && (
              <div className="fm-sheet-results">
                <div className="fm-sheet-results-title">نتائج البحث ({allDisplayed.length})</div>
                <div className="fm-sheet-results-list">
                  {allDisplayed.map((p) => {
                    const isNearby = nearbyProperties.some((n) => n.id === p.id);
                    return (
                      <div key={p.id} className={`fm-result-row${isNearby ? " fm-result-nearby" : ""}`} onClick={() => { setSelected(p); setSheetSnap("collapsed"); }}>
                        <div className="fm-result-info">
                          {isNearby && <span className="nearby-badge">📍قريب</span>}
                          <span className="fm-result-name">{p.name}</span>
                          <span className="fm-result-area">{p.area ? `${p.area} م²` : ""}</span>
                        </div>
                        <span className="fm-result-price">{p.price.toLocaleString("ar-EG")} جنيه</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Property Card Modal (shared) ── */}
      {selectedProperty && (
        isFullscreen && fsContainer
          ? createPortal(
              <div
                className="fullscreen-property-card-layer"
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerMove={(event) => event.stopPropagation()}
              >
                <PropertyCard property={selectedProperty} onClose={() => setSelectedProperty(null)} />
              </div>,
              fsContainer
            )
          : <PropertyCard property={selectedProperty} onClose={() => setSelectedProperty(null)} />
      )}

      {/* ══════════════════════════════════════════
          FULLSCREEN PORTAL
          When Leaflet enters fullscreen it moves its map container
          into the top-level fullscreen layer. We portal a complete
          filter UI into that container so it stays visible.
      ══════════════════════════════════════════ */}
      {isFullscreen && fsContainer &&
        createPortal(
          <div className={`fs-overlay${window.innerWidth <= 700 ? " fs-overlay--mobile" : ""} ${fsSidebarOpen ? "fs-overlay--sidebar-open" : "fs-overlay--sidebar-closed"}`} dir="rtl">
            <ResultsPanel
              properties={allDisplayed}
              selected={selected}
              nearbyProperties={nearbyProperties}
              onSelect={handlePropertySelect}
              onOpen={(property) => { setSelected(property); setSelectedProperty(property); }}
            />

            {/* ── DESKTOP fullscreen: sidebar ── */}
            {window.innerWidth > 700 && (
              <>
                <div className={`fs-sidebar${fsSidebarOpen ? " fs-sidebar--open" : " fs-sidebar--closed"}`}>
                  <div className="fs-sidebar-header">
                    <div className="fs-sidebar-heading">
                      <span className="filters-kicker">لوحة البحث الذكية</span>
                      <strong className="filters-title">اختيار أسرع للعقار المناسب</strong>
                      <p className="filters-summary">{locationSummary}</p>
                    </div>
                    <div className="fm-sidebar-chips">
                      <div className="filters-status-chip">
                        <span className="filters-status-value">{displayedResultsCount}</span>
                        <span className="filters-status-label">نتيجة</span>
                      </div>
                      <div className="filters-status-chip">
                        <span className="filters-status-value">{activeFiltersCount}</span>
                        <span className="filters-status-label">فلتر</span>
                      </div>
                    </div>
                  </div>
                  <div className="fm-sidebar-body">
                    <FiltersBody />
                  </div>
                </div>

                {/* Toggle tab */}
                <button
                 type="button"
                  className="fs-sidebar-toggle"
                  onClick={() => setFsSidebarOpen((v) => !v)}
                  aria-label={fsSidebarOpen ? "إخفاء الفلاتر" : "عرض الفلاتر"}
                >
                  <svg viewBox="0 0 10 16" fill="none" width="10" height="16">
                    <path d={fsSidebarOpen ? "M7 1L2 8l5 7" : "M3 1l5 7-5 7"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Results popup */}
                {(allDisplayed.length > 0 || (drawMode && polygonDrawn)) && (
                  <div className="fs-results-popup">
                    <div className="popup-drag-handle" style={{ cursor: "default" }}>
                      <span className="drag-dots">⠿</span>
                      <h3 className="popup-title" style={{ margin: 0 }}>
                        {allDisplayed.length > 0 ? `نتائج البحث (${allDisplayed.length})` : "نتائج البحث"}
                        {nearbyProperties.length > 0 && <span className="nearby-badge" style={{ marginRight: 8, fontSize: 11 }}>{nearbyProperties.length} قريب منك</span>}
                      </h3>
                      <span className="drag-dots">⠿</span>
                    </div>
                    {allDisplayed.length === 0 ? (
                      <div className="no-results"><span>🏠</span><p>لا يوجد عقارات في هذه المنطقة</p></div>
                    ) : (
                      <table className="results-table">
                        <thead><tr><th>المنطقة</th><th>السعر</th><th>المساحة</th><th></th></tr></thead>
                        <tbody>
                          {allDisplayed.map((p) => {
                            const isNearby = nearbyProperties.some((n) => n.id === p.id);
                            return (
                              <tr key={p.id} style={isNearby ? { background: "rgba(16,185,129,0.07)" } : {}}>
                                <td>{isNearby && <span className="nearby-badge">📍قريب</span>}{p.name}</td>
                                <td className="price">{p.price.toLocaleString("ar-EG")}جنيه</td>
                                <td className="area">{p.area ? `${p.area} م²` : "غير محددة"}</td>
                                <td><button  type="button" className="zoomBtn" onClick={() => setSelected(p)}>عرض</button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── MOBILE fullscreen: bottom sheet ── */}
            {window.innerWidth <= 700 && (
              <div
                className={`fm-sheet fm-sheet--${fsSheetSnap} fs-sheet`}
                onTouchStart={(e) => { sheetStartY.current = e.touches[0].clientY; }}
                onTouchEnd={(e) => {
                  if (sheetStartY.current === null) return;
                  const delta = e.changedTouches[0].clientY - sheetStartY.current;
                  if (delta < -40) setFsSheetSnap("expanded");
                  else if (delta > 40) setFsSheetSnap("collapsed");
                  sheetStartY.current = null;
                }}
              >
                <div className="fm-sheet-handle-area" onClick={() => setFsSheetSnap((s) => s === "collapsed" ? "expanded" : "collapsed")}>
                  <div className="fm-sheet-handle" />
                  <div className="fm-sheet-summary">
                    <div className="fm-sheet-summary-left">
                      <span className="fm-sheet-title">الفلاتر</span>
                      {activeFiltersCount > 0 && <span className="fm-sheet-badge">{activeFiltersCount} نشط</span>}
                    </div>
                    <div className="fm-sheet-chips">
                      <span className="fm-sheet-chip">{displayedResultsCount} نتيجة</span>
                      <span className="fm-sheet-chevron">{fsSheetSnap === "expanded" ? "↓" : "↑"}</span>
                    </div>
                  </div>
                </div>
                <div className="fm-sheet-content">
                  <FiltersBody />
                </div>
                {fsSheetSnap === "expanded" && allDisplayed.length > 0 && (
                  <div className="fm-sheet-results">
                    <div className="fm-sheet-results-title">نتائج البحث ({allDisplayed.length})</div>
                    <div className="fm-sheet-results-list">
                      {allDisplayed.map((p) => {
                        const isNearby = nearbyProperties.some((n) => n.id === p.id);
                        return (
                          <div key={p.id} className={`fm-result-row${isNearby ? " fm-result-nearby" : ""}`} onClick={() => { setSelected(p); setFsSheetSnap("collapsed"); }}>
                            <div className="fm-result-info">
                              {isNearby && <span className="nearby-badge">📍قريب</span>}
                              <span className="fm-result-name">{p.name}</span>
                              <span className="fm-result-area">{p.area ? `${p.area} م²` : ""}</span>
                            </div>
                            <span className="fm-result-price">{p.price.toLocaleString("ar-EG")} جنيه</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>,
          fsContainer
        )
      }
    </div>
  );
}
