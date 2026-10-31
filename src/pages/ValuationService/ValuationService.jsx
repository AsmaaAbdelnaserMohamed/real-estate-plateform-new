import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  LayersControl,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import Navbar from "../../components/Layout/Navbar";
import "./ValuationService.css";

const { BaseLayer } = LayersControl;
const EGYPT_CENTER = [27.25, 30.8];
const governorates = [
  ["القاهرة", "القاهرة", 30.0444, 31.2357],
  ["الجيزة", "الجيزة", 30.0131, 31.2089],
  ["الإسكندرية", "الإسكندرية", 31.2001, 29.9187],
  ["القليوبية", "بنها", 30.4667, 31.1833],
  ["الشرقية", "الزقازيق", 30.5877, 31.502],
  ["الدقهلية", "المنصورة", 31.0409, 31.3785],
  ["البحيرة", "دمنهور", 31.0341, 30.4682],
  ["كفر الشيخ", "كفر الشيخ", 31.1107, 30.9388],
  ["الغربية", "طنطا", 30.7865, 31.0004],
  ["المنوفية", "شبين الكوم", 30.5526, 31.009],
  ["دمياط", "دمياط", 31.4175, 31.8144],
  ["بورسعيد", "بورسعيد", 31.2653, 32.3019],
  ["الإسماعيلية", "الإسماعيلية", 30.5965, 32.2715],
  ["السويس", "السويس", 29.9668, 32.5498],
  ["الفيوم", "الفيوم", 29.3084, 30.8428],
  ["بني سويف", "بني سويف", 29.0661, 31.0994],
  ["المنيا", "المنيا", 28.1099, 30.7503],
  ["أسيوط", "أسيوط", 27.1809, 31.1837],
  ["سوهاج", "سوهاج", 26.5591, 31.6957],
  ["قنا", "قنا", 26.1551, 32.716],
  ["الأقصر", "الأقصر", 25.6872, 32.6396],
  ["أسوان", "أسوان", 24.0889, 32.8998],
  ["البحر الأحمر", "الغردقة", 27.2579, 33.8116],
  ["الوادي الجديد", "الخارجة", 25.4514, 30.5464],
  ["مطروح", "مرسى مطروح", 31.3543, 27.2373],
  ["شمال سيناء", "العريش", 31.1321, 33.8033],
  ["جنوب سيناء", "الطور", 28.2364, 33.6222],
].map(([name, capital, lat, lng]) => ({
  name,
  capital,
  lat,
  lng,
}));

const districtGroups = [
  {
    governorate: "القاهرة",
    name: "مدينة نصر",
    lat: 30.0561,
    lng: 31.3300,
    areas: [
      ["الحي الأول", 31500], ["الحي السادس", 28200], ["الحي السابع", 29800],
      ["الحي الثامن", 27500], ["عباس العقاد", 36500], ["المنطقة العاشرة", 25500],
      ["زهراء مدينة نصر", 23800],
    ],
  },
  {
    governorate: "القاهرة",
    name: "مصر الجديدة",
    lat: 30.0870,
    lng: 31.3220,
    areas: [
      ["الكوربة", 40500], ["روكسي", 35500], ["أرض الجولف", 38200],
      ["الميريلاند", 33800], ["الماظة", 32800], ["شيراتون", 31500],
    ],
  },
  {
    governorate: "القاهرة",
    name: "المعادي",
    lat: 29.9602,
    lng: 31.2570,
    areas: [
      ["سرايات المعادي", 42000], ["دجلة المعادي", 38500], ["المعادي الجديدة", 29000],
      ["زهراء المعادي", 24500], ["حدائق المعادي", 22500],
    ],
  },
  {
    governorate: "القاهرة",
    name: "حلوان",
    lat: 29.8414,
    lng: 31.3342,
    areas: [
      ["وسط حلوان", 17500], ["حدائق حلوان", 19200], ["وادي حوف", 16000],
      ["المعصرة", 15500],
    ],
  },
  {
    governorate: "الجيزة",
    name: "الدقي",
    lat: 30.0380,
    lng: 31.2118,
    areas: [
      ["ميدان الدقي", 32500], ["المساحة", 34800], ["شارع التحرير", 31000],
      ["البحوث", 28700],
    ],
  },
  {
    governorate: "الجيزة",
    name: "المهندسين والعجوزة",
    lat: 30.0570,
    lng: 31.2020,
    areas: [
      ["ميدان لبنان", 35500], ["جامعة الدول العربية", 37500],
      ["شارع سوريا", 34000], ["العجوزة", 29500], ["ميت عقبة", 24500],
    ],
  },
  {
    governorate: "الجيزة",
    name: "الهرم وفيصل",
    lat: 29.9910,
    lng: 31.1620,
    areas: [
      ["المريوطية", 21500], ["الطالبية", 18500], ["فيصل", 19200],
      ["الرماية", 24000], ["حدائق الأهرام", 22500],
    ],
  },
  {
    governorate: "الجيزة",
    name: "مدينة 6 أكتوبر",
    lat: 29.9600,
    lng: 30.9400,
    areas: [
      ["الحي الأول", 20500], ["الحي السابع", 23000], ["الحي المتميز", 31500],
      ["غرب سوميد", 34500], ["التوسعات الشمالية", 28000],
    ],
  },
  {
    governorate: "الجيزة",
    name: "مدينة الشيخ زايد",
    lat: 30.0440,
    lng: 30.9810,
    areas: [
      ["الحي الأول", 32000], ["الحي الرابع", 35000], ["الحي الثامن", 38500],
      ["الحي الثالث عشر", 29500],
    ],
  },
  {
    governorate: "الإسكندرية",
    name: "سموحة وسيدي جابر",
    lat: 31.2150,
    lng: 29.9470,
    areas: [
      ["سموحة", 31500], ["سيدي جابر", 28500], ["رشدي", 33000],
      ["كفر عبده", 36500], ["سبورتنج", 34000],
    ],
  },
  {
    governorate: "الإسكندرية",
    name: "المنتزه",
    lat: 31.2810,
    lng: 30.0100,
    areas: [
      ["ميامي", 23800], ["سيدي بشر", 22500], ["المندرة", 20500],
      ["العصافرة", 19500], ["المعمورة", 27800],
    ],
  },
  {
    governorate: "الإسكندرية",
    name: "وسط الإسكندرية",
    lat: 31.2000,
    lng: 29.9100,
    areas: [
      ["محطة الرمل", 29500], ["المنشية", 20500], ["العطارين", 21500],
      ["كامب شيزار", 28000], ["محرم بك", 18500],
    ],
  },
  {
    governorate: "القليوبية",
    name: "شبرا الخيمة",
    lat: 30.1220,
    lng: 31.2440,
    areas: [
      ["بيجام", 15500], ["بهتيم", 13200], ["مسطرد", 12500],
      ["منشية الحرية", 14800],
    ],
  },
  {
    governorate: "القليوبية",
    name: "بنها",
    lat: 30.4667,
    lng: 31.1833,
    areas: [
      ["وسط بنها", 17800], ["كفر الجزار", 14800], ["منطقة الفلل", 21500],
      ["منشية النور", 16200],
    ],
  },
  {
    governorate: "القليوبية",
    name: "مدينة العبور",
    lat: 30.2280,
    lng: 31.4770,
    areas: [
      ["الحي الأول", 22500], ["الحي الخامس", 24800], ["الحي التاسع", 26500],
      ["الحي الترفيهي", 31000],
    ],
  },
  {
    governorate: "الشرقية",
    name: "الزقازيق",
    lat: 30.5877,
    lng: 31.5020,
    areas: [
      ["القومية", 19500], ["الغشام", 21800], ["وسط الزقازيق", 16800],
      ["كفر عبد العزيز", 14200],
    ],
  },
  {
    governorate: "الدقهلية",
    name: "المنصورة",
    lat: 31.0409,
    lng: 31.3785,
    areas: [
      ["حي الجامعة", 24500], ["توريل", 28500], ["المشاية", 31000],
      ["جديلة", 17500], ["سندوب", 15800],
    ],
  },
  {
    governorate: "البحيرة",
    name: "دمنهور",
    lat: 31.0341,
    lng: 30.4682,
    areas: [
      ["وسط دمنهور", 15800], ["شبّرا", 14200], ["أبو الريش", 13500],
      ["منطقة الجامعة", 16800],
    ],
  },
  {
    governorate: "كفر الشيخ",
    name: "مدينة كفر الشيخ",
    lat: 31.1107,
    lng: 30.9388,
    areas: [
      ["وسط المدينة", 14500], ["منطقة الجامعة", 16500],
      ["سخا", 12800], ["القنطرة", 13800],
    ],
  },
  {
    governorate: "الغربية",
    name: "طنطا",
    lat: 30.7865,
    lng: 31.0004,
    areas: [
      ["وسط طنطا", 18500], ["منطقة الاستاد", 21500],
      ["منطقة الجامعة", 19800], ["سيجر", 16800],
    ],
  },
  {
    governorate: "المنوفية",
    name: "شبين الكوم",
    lat: 30.5526,
    lng: 31.0090,
    areas: [
      ["وسط شبين الكوم", 15500], ["منطقة الجامعة", 17800],
      ["ميت خاقان", 13200], ["كفر المصيلحة", 14800],
    ],
  },
  {
    governorate: "دمياط",
    name: "مدينة دمياط",
    lat: 31.4175,
    lng: 31.8144,
    areas: [
      ["وسط دمياط", 19500], ["الأعصر", 17200],
      ["رأس البر", 32000], ["دمياط الجديدة", 22500],
    ],
  },
  {
    governorate: "بورسعيد",
    name: "مدينة بورسعيد",
    lat: 31.2653,
    lng: 32.3019,
    areas: [
      ["حي الشرق", 25500], ["حي العرب", 19500],
      ["حي الزهور", 17800], ["حي المناخ", 20500],
    ],
  },
  {
    governorate: "الإسماعيلية",
    name: "مدينة الإسماعيلية",
    lat: 30.5965,
    lng: 32.2715,
    areas: [
      ["حي الشيخ زايد", 20500], ["حي السلام", 16800],
      ["وسط الإسماعيلية", 18200], ["منطقة الجامعة", 19200],
    ],
  },
  {
    governorate: "السويس",
    name: "مدينة السويس",
    lat: 29.9668,
    lng: 32.5498,
    areas: [
      ["حي السويس", 17500], ["الأربعين", 14500],
      ["عتاقة", 16500], ["فيصل", 15200],
    ],
  },
  {
    governorate: "الفيوم",
    name: "مدينة الفيوم",
    lat: 29.3084,
    lng: 30.8428,
    areas: [
      ["وسط الفيوم", 12800], ["دار الرماد", 11200],
      ["المسلة", 14500], ["منطقة الجامعة", 13800],
    ],
  },
  {
    governorate: "بني سويف",
    name: "مدينة بني سويف",
    lat: 29.0661,
    lng: 31.0994,
    areas: [
      ["وسط بني سويف", 12500], ["حي مقبل", 13800],
      ["الحمرايا", 10500], ["شرق النيل", 16200],
    ],
  },
  {
    governorate: "المنيا",
    name: "مدينة المنيا",
    lat: 28.1099,
    lng: 30.7503,
    areas: [
      ["وسط المنيا", 12800], ["أرض سلطان", 15500],
      ["حي الجامعة", 14800], ["أبو هلال", 10500],
    ],
  },
  {
    governorate: "أسيوط",
    name: "مدينة أسيوط",
    lat: 27.1809,
    lng: 31.1837,
    areas: [
      ["وسط أسيوط", 14200], ["حي الجامعة", 16800],
      ["الأربعين", 11800], ["فريال", 15500],
    ],
  },
  {
    governorate: "سوهاج",
    name: "مدينة سوهاج",
    lat: 26.5591,
    lng: 31.6957,
    areas: [
      ["وسط سوهاج", 13200], ["حي الجامعة", 15200],
      ["الكوثر", 17500], ["مدينة ناصر", 11800],
    ],
  },
  {
    governorate: "قنا",
    name: "مدينة قنا",
    lat: 26.1551,
    lng: 32.7160,
    areas: [
      ["وسط قنا", 12800], ["حي الجامعة", 14800],
      ["المساكن", 11200], ["مدينة العمال", 11800],
    ],
  },
  {
    governorate: "الأقصر",
    name: "مدينة الأقصر",
    lat: 25.6872,
    lng: 32.6396,
    areas: [
      ["وسط الأقصر", 19500], ["العوامية", 16800],
      ["الكرنك", 18200], ["المنشأة", 13800],
    ],
  },
  {
    governorate: "أسوان",
    name: "مدينة أسوان",
    lat: 24.0889,
    lng: 32.8998,
    areas: [
      ["وسط أسوان", 18500], ["السيل", 13800],
      ["حي العقاد", 20500], ["الصداقة الجديدة", 15500],
    ],
  },
  {
    governorate: "البحر الأحمر",
    name: "الغردقة",
    lat: 27.2579,
    lng: 33.8116,
    areas: [
      ["الدهار", 21500], ["السقالة", 30500],
      ["الأحياء", 24500], ["الجونة", 52000],
    ],
  },
  {
    governorate: "الوادي الجديد",
    name: "مدينة الخارجة",
    lat: 25.4514,
    lng: 30.5464,
    areas: [
      ["وسط الخارجة", 9200], ["حي الزهور", 10500],
      ["حي البساتين", 8500],
    ],
  },
  {
    governorate: "مطروح",
    name: "مرسى مطروح",
    lat: 31.3543,
    lng: 27.2373,
    areas: [
      ["وسط مرسى مطروح", 18500], ["العوام", 21500],
      ["الكورنيش", 28500], ["حي الزهور", 15500],
    ],
  },
  {
    governorate: "شمال سيناء",
    name: "مدينة العريش",
    lat: 31.1321,
    lng: 33.8033,
    areas: [
      ["وسط العريش", 12500], ["المساعيد", 14500],
      ["الريسة", 11200], ["الضاحية", 13800],
    ],
  },
  {
    governorate: "جنوب سيناء",
    name: "مدينة الطور",
    lat: 28.2364,
    lng: 33.6222,
    areas: [
      ["وسط الطور", 14800], ["حي النصر", 13200],
      ["الجبيل", 11800],
    ],
  },
];

const areaOffsets = [
  [0, 0],
  [0.009, 0.008],
  [-0.009, 0.008],
  [0.009, -0.008],
  [-0.009, -0.008],
  [0.016, 0],
  [-0.016, 0],
];
const shiyakhas = districtGroups.flatMap((group) =>
  group.areas.map(([name, pricePerMeter], index) => {
    const [latOffset, lngOffset] = areaOffsets[index % areaOffsets.length];
    return {
      id: `${group.governorate}-${group.name}-${name}`,
      governorate: group.governorate,
      district: group.name,
      name,
      lat: group.lat + latOffset,
      lng: group.lng + lngOffset,
      pricePerMeter,
    };
  }),
);

function SearchSelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = options.filter((option) => option.includes(query));
  return (
    <div className="valuation-field">
      <label htmlFor={id}>{label}</label>
      <div className={`search-select ${disabled ? "is-disabled" : ""}`}>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className="search-select-trigger"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className={value ? "selected-value" : "placeholder"}>
            {value || placeholder}
          </span>
          <span>⌄</span>
        </button>
        {open && !disabled && (
          <div className="search-select-menu">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="اكتب أول حرفين للبحث..."
            />
            {filtered.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {option}
              </button>
            ))}
            {!filtered.length && (
              <span className="empty-option">لا توجد نتائج</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DrawTools({ enabled, onComplete }) {
  const map = useMap();
  const layerRef = useRef(new L.FeatureGroup());
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const layers = layerRef.current;
    map.addLayer(layers);
    const control = new L.Control.Draw({
      edit: { featureGroup: layers },
      draw: {
        polygon: true,
        rectangle: true,
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false,
      },
    });
    if (enabled) map.addControl(control);
    const complete = (event) => {
      layers.clearLayers();
      layers.addLayer(event.layer);
      onCompleteRef.current(event.layer.getBounds().getCenter());
    };
    map.on(L.Draw.Event.CREATED, complete);
    return () => {
      map.off(L.Draw.Event.CREATED, complete);
      if (enabled) map.removeControl(control);
      map.removeLayer(layers);
    };
  }, [enabled, map]);
  return null;
}

function MapFocus({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng) && zoom) {
      map.flyTo([lat, lng], zoom, { duration: 0.8 });
    }
  }, [lat, lng, map, zoom]);
  return null;
}

function MapResize() {
  const map = useMap();

  useEffect(() => {
    let frame;
    const resizeMap = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    };

    document.addEventListener("fullscreenchange", resizeMap);
    document.addEventListener("webkitfullscreenchange", resizeMap);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("fullscreenchange", resizeMap);
      document.removeEventListener("webkitfullscreenchange", resizeMap);
    };
  }, [map]);

  return null;
}

export default function ValuationService({ embedded = false }) {
  const [governorate, setGovernorate] = useState("");
  const [district, setDistrict] = useState("");
  const [shiyakhaId, setShiyakhaId] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [drawnArea, setDrawnArea] = useState(null);
  const selectedGov = governorates.find((item) => item.name === governorate);
  const governorateDistricts = districtGroups.filter(
    (group) => group.governorate === governorate,
  );
  const districtOptions = governorateDistricts.map((group) => group.name);
  const selectedDistrict = governorateDistricts.find(
    (group) => group.name === district,
  );
  const districtShiyakhas = selectedDistrict
    ? shiyakhas.filter((item) => item.governorate === governorate && item.district === district)
    : [];
  const selectedShiyakha = shiyakhas.find((item) => item.id === shiyakhaId);
  const priceRange = selectedShiyakha
    ? {
        low: Math.round((selectedShiyakha.pricePerMeter * 0.9) / 100) * 100,
        high: Math.round((selectedShiyakha.pricePerMeter * 1.1) / 100) * 100,
      }
    : null;
  const mapFocusLat = selectedShiyakha?.lat ?? selectedDistrict?.lat ?? selectedGov?.lat;
  const mapFocusLng = selectedShiyakha?.lng ?? selectedDistrict?.lng ?? selectedGov?.lng;
  const mapFocusZoom = selectedShiyakha ? 14 : selectedDistrict ? 12 : selectedGov ? 7.5 : null;

  const selectShiyakha = useCallback((item) => {
    setGovernorate(item.governorate);
    setDistrict(item.district);
    setShiyakhaId(item.id);
    setDrawnArea(null);
  }, []);

  const reset = () => {
    setGovernorate("");
    setDistrict("");
    setShiyakhaId("");
    setDrawnArea(null);
    setDrawMode(false);
  };

  const completeDraw = useCallback((center) => {
    const nearest = shiyakhas.reduce((best, item) => {
      const latDistance = (item.lat - center.lat) * 111;
      const lngDistance = (item.lng - center.lng) * 111 * Math.cos((center.lat * Math.PI) / 180);
      const distance = Math.hypot(latDistance, lngDistance);
      return !best || distance < best.distance ? { item, distance } : best;
    }, null);

    if (nearest && nearest.distance <= 5) {
      selectShiyakha(nearest.item);
    } else {
      setShiyakhaId("");
    }
    setDrawnArea(center);
    setDrawMode(false);
  }, [selectShiyakha]);

  return (
    <div
      className={`valuation-page${embedded ? " valuation-page--embedded" : ""}`}
      dir="rtl"
    >
      {!embedded && <Navbar />}
      <main className="valuation-shell">
        <header className="valuation-header">
          <div>
            <span className="eyebrow">خدمة رقمية جديدة</span>
            <h1>التقييم والتسعير الاسترشادي</h1>
            <p>
              اختر الشياخة لعرض نطاق تقديري لسعر المتر، أو استكشف المناطق
              مباشرةً من الخريطة.
            </p>
          </div>
          <div className="header-badge">
            <span>▣</span>
            <div>
              <strong>نطاق تقديري</strong>
              <small>قيم مرجعية غير مباشرة</small>
            </div>
          </div>
        </header>
        <section className="valuation-workspace">
          <aside className="valuation-panel">
            <div className="panel-heading">
              <span className="panel-icon">⌖</span>
              <div>
                <h2>اختر طريقة الاستعلام</h2>
                <p>حدد المنطقة أو ارسمها على الخريطة</p>
              </div>
            </div>
            <div className="query-tabs">
              <button
                className={!drawMode ? "active" : ""}
                onClick={() => setDrawMode(false)}
              >
                بالحدود الإدارية
              </button>
              <button
                className={drawMode ? "active" : ""}
                onClick={() => setDrawMode(true)}
              >
                الاستعلام الجغرافي
              </button>
            </div>
            {!drawMode ? (
              <div className="admin-query">
                <div className="query-title">
                  <span>01</span>
                  <div>
                    <strong>اختر الموقع</strong>
                    <small>القوائم مترابطة تلقائياً</small>
                  </div>
                </div>
                <SearchSelect
                  id="valuation-governorate"
                  label="المحافظة"
                  value={governorate}
                  options={governorates.map((item) => item.name)}
                  onChange={(value) => {
                    setGovernorate(value);
                    setDistrict("");
                    setShiyakhaId("");
                    setDrawnArea(null);
                  }}
                  placeholder="اختر المحافظة"
                />
                <SearchSelect
                  id="valuation-district"
                  label="المدينة / القسم"
                  value={district}
                  options={districtOptions}
                  disabled={!governorate}
                  onChange={(value) => {
                    setDistrict(value);
                    setShiyakhaId("");
                    setDrawnArea(null);
                  }}
                  placeholder="اختر المدينة أو القسم"
                />
                <SearchSelect
                  id="valuation-shiyakha"
                  label="الشياخة / المنطقة"
                  value={selectedShiyakha?.name || ""}
                  options={districtShiyakhas.map((item) => item.name)}
                  disabled={!district}
                  onChange={(value) => {
                    const item = districtShiyakhas.find((area) => area.name === value);
                    if (item) selectShiyakha(item);
                  }}
                  placeholder="اختر الشياخة"
                />
                <div className="selection-note">
                  {selectedShiyakha ? (
                    <>
                      ⌖ اضغط على نقطة الخريطة لاستكشاف شياخات <b>{district}</b>
                    </>
                  ) : district ? (
                    "اختر شياخة من القائمة أو اضغط على اسمها في الخريطة لعرض تقييمها"
                  ) : governorate ? (
                    "اختر المدينة أو القسم من القائمة أو مباشرةً من الخريطة"
                  ) : (
                    "ابدأ باختيار المحافظة، ثم المدينة، ثم الشياخة"
                  )}
                </div>
              </div>
            ) : (
              <div className="geo-query">
                <div className="draw-illustration">⌁</div>
                <h3>ارسم المنطقة على الخريطة</h3>
                <p>
                  استخدم المضلع أو المستطيل، وسيُعرض التقدير فقط عند مطابقة الرسم
                  مع شياخة قريبة.
                </p>
                <button
                  className="draw-action"
                  onClick={() => setDrawMode(true)}
                >
                  ✎ تفعيل أدوات الرسم
                </button>
                <div className="draw-hint">
                  الرسم لا ينتج سعرًا مستقلًا؛ التقييم متاح على مستوى الشياخة فقط
                </div>
              </div>
            )}
            {selectedShiyakha && (
              <div className="valuation-result">
                <div className="result-label">متوسط استرشادي لسعر المتر</div>
                <div className="result-price">
                  {selectedShiyakha.pricePerMeter.toLocaleString("ar-EG")}{" "}
                  <span>جنيه</span>
                </div>
                <div className="result-range">
                  نطاق تقريبي: {priceRange.low.toLocaleString("ar-EG")} –{" "}
                  {priceRange.high.toLocaleString("ar-EG")} جنيه / م²
                </div>
                <div className="result-divider" />
                <div className="result-location">
                  <span>⌖</span>
                  <div>
                    <b>{selectedShiyakha.name}</b>
                    <small>
                      {selectedShiyakha.district} · {selectedShiyakha.governorate}
                    </small>
                  </div>
                </div>
                <small className="result-caveat">
                  يتأثر السعر الفعلي بموقع العقار وحالته ومواصفاته.
                </small>
              </div>
            )}
            <button className="reset-btn" onClick={reset}>
              ↻ إعادة ضبط الاستعلام
            </button>
          </aside>
          <div className="valuation-map-wrap">
            {/* <div className="valuation-map-hint">
              <strong>
                {selectedDistrict
                  ? `شياخات ${selectedDistrict.name}`
                  : selectedGov
                    ? `مناطق ${selectedGov.name}`
                    : "خريطة مصر"}
              </strong>
              <small>
                {selectedDistrict
                  ? "اضغط على اسم الشياخة أو علامتها لعرض التقدير"
                  : selectedGov
                    ? "اضغط على المدينة أو القسم للانتقال إلى الشياخات"
                    : "اختر محافظة لعرض المناطق المتاحة"}
              </small>
            </div> */}
            <MapContainer
              center={EGYPT_CENTER}
              zoom={5.3}
              minZoom={4}
              className="valuation-map"
              scrollWheelZoom
            >
              <LayersControl position="topright">
                <BaseLayer name="Satellite">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </BaseLayer>
                <BaseLayer checked name="OpenStreetMap">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </BaseLayer>
              </LayersControl>
              <DrawTools enabled={drawMode} onComplete={completeDraw} />
              <MapFocus lat={mapFocusLat} lng={mapFocusLng} zoom={mapFocusZoom} />
              <MapResize />
              {!selectedDistrict &&
                governorateDistricts.map((group) => (
                  <CircleMarker
                    key={`${group.governorate}-${group.name}`}
                    center={[group.lat, group.lng]}
                    radius={7}
                    eventHandlers={{
                      click: () => {
                        setDistrict(group.name);
                        setShiyakhaId("");
                        setDrawnArea(null);
                      },
                    }}
                    pathOptions={{
                      color: "#075985",
                      weight: 2,
                      fillColor: "#38bdf8",
                      fillOpacity: 0.9,
                    }}
                  >
                    <Tooltip
                      permanent
                      direction="top"
                      offset={[0, -7]}
                      className="valuation-map-label"
                    >
                      {group.name}
                    </Tooltip>
                  </CircleMarker>
                ))}
              {selectedDistrict &&
                districtShiyakhas.map((item) => (
                  <CircleMarker
                    key={item.id}
                    center={[item.lat, item.lng]}
                    radius={selectedShiyakha?.id === item.id ? 10 : 7}
                    eventHandlers={{ click: () => selectShiyakha(item) }}
                    pathOptions={{
                      color: selectedShiyakha?.id === item.id ? "#075985" : "#0369a1",
                      weight: selectedShiyakha?.id === item.id ? 3 : 2,
                      fillColor: selectedShiyakha?.id === item.id ? "#fbbf24" : "#38bdf8",
                      fillOpacity: 0.95,
                    }}
                  >
                    <Tooltip
                      permanent
                      direction="top"
                      offset={[0, -7]}
                      className="valuation-map-label"
                    >
                      {item.name}
                    </Tooltip>
                  </CircleMarker>
                ))}
            </MapContainer>

            {drawnArea && (
              <div className={`draw-result${selectedShiyakha ? "" : " draw-result--unmatched"}`}>
                <span>{selectedShiyakha ? "✓" : "!"}</span>
                <div>
                  <b>
                    {selectedShiyakha
                      ? `أقرب شياخة: ${selectedShiyakha.name}`
                      : "لم يتطابق الرسم مع شياخة معروفة"}
                  </b>
                  <small>
                    {selectedShiyakha
                      ? "التقدير المعروض خاص بهذه الشياخة"
                      : "اختر شياخة من الخريطة لعرض تقديرها"}
                  </small>
                </div>
              </div>
            )}
          </div>
        </section>
        <div className="valuation-disclaimer">
          ⓘ الأسعار ونقاط المواقع تقديرية للتوضيح وليست بيانات سوق مباشرة أو
          حدودًا إدارية رسمية؛ يلزم تحديثها بمصادر موثقة قبل الاعتماد عليها.
        </div>
      </main>
    </div>
  );
}
