import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
  LayersControl,
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
  ["القاهرة", "القاهرة", 30.0444, 31.2357, 18500],
  ["الجيزة", "الجيزة", 30.0131, 31.2089, 12800],
  ["الإسكندرية", "الإسكندرية", 31.2001, 29.9187, 14600],
  ["القليوبية", "بنها", 30.4667, 31.1833, 8200],
  ["الشرقية", "الزقازيق", 30.5877, 31.502, 6900],
  ["الدقهلية", "المنصورة", 31.0409, 31.3785, 7600],
  ["البحيرة", "دمنهور", 31.0341, 30.4682, 6100],
  ["كفر الشيخ", "كفر الشيخ", 31.1107, 30.9388, 5800],
  ["الغربية", "طنطا", 30.7865, 31.0004, 7300],
  ["المنوفية", "شبين الكوم", 30.5526, 31.009, 6400],
  ["دمياط", "دمياط", 31.4175, 31.8144, 7900],
  ["بورسعيد", "بورسعيد", 31.2653, 32.3019, 10800],
  ["الإسماعيلية", "الإسماعيلية", 30.5965, 32.2715, 7200],
  ["السويس", "السويس", 29.9668, 32.5498, 6800],
  ["الفيوم", "الفيوم", 29.3084, 30.8428, 4900],
  ["بني سويف", "بني سويف", 29.0661, 31.0994, 4700],
  ["المنيا", "المنيا", 28.1099, 30.7503, 4300],
  ["أسيوط", "أسيوط", 27.1809, 31.1837, 4400],
  ["سوهاج", "سوهاج", 26.5591, 31.6957, 4100],
  ["قنا", "قنا", 26.1551, 32.716, 3900],
  ["الأقصر", "الأقصر", 25.6872, 32.6396, 6200],
  ["أسوان", "أسوان", 24.0889, 32.8998, 5600],
  ["البحر الأحمر", "الغردقة", 27.2579, 33.8116, 11500],
  ["الوادي الجديد", "الخارجة", 25.4514, 30.5464, 3200],
  ["مطروح", "مرسى مطروح", 31.3543, 27.2373, 7600],
  ["شمال سيناء", "العريش", 31.1321, 33.8033, 5100],
  ["جنوب سيناء", "الطور", 28.2364, 33.6222, 8700],
].map(([name, capital, lat, lng, price]) => ({
  name,
  capital,
  lat,
  lng,
  price,
}));

const districts = {
  القاهرة: ["مدينة نصر", "مصر الجديدة", "المعادي", "حلوان"],
  الجيزة: ["الدقي", "العجوزة", "6 أكتوبر", "الهرم"],
  الإسكندرية: ["سموحة", "سيدي جابر", "المنتزه", "العطارين"],
  القليوبية: ["بنها", "شبرا الخيمة", "طوخ"],
  الشرقية: ["الزقازيق", "العاشر من رمضان", "بلبيس"],
  الدقهلية: ["المنصورة", "ميت غمر", "طلخا"],
  البحيرة: ["دمنهور", "كفر الدوار", "رشيد"],
  الغربية: ["طنطا", "المحلة الكبرى", "زفتى"],
  default: ["المركز الرئيسي", "المدينة", "المنطقة المركزية"],
};

const villages = {
  "مدينة نصر": ["الحي السابع", "الحي الثامن", "عباس العقاد"],
  "مصر الجديدة": ["روكسي", "الميرغني", "أرض الجولف"],
  الدقي: ["شارع التحرير", "ميدان الدقي", "المساحة"],
  سموحة: ["شارع فوزي معاذ", "جرين بلازا", "عزبة سعد"],
  "6 أكتوبر": ["الحي الأول", "الحي المتميز", "التوسعات الشمالية"],
  المنصورة: ["حي الجامعة", "توريل", "جديلة"],
  default: ["القرية الرئيسية", "القرية الجديدة", "المنطقة السكنية"],
};

function SearchSelect({
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
      <label>{label}</label>
      <div className={`search-select ${disabled ? "is-disabled" : ""}`}>
        <button
          type="button"
          disabled={disabled}
          className="search-select-trigger"
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
      onComplete(event.layer.getBounds().getCenter());
    };
    map.on(L.Draw.Event.CREATED, complete);
    return () => {
      map.off(L.Draw.Event.CREATED, complete);
      if (enabled) map.removeControl(control);
      map.removeLayer(layers);
    };
  }, [enabled, map, onComplete]);
  return null;
}

function FlyTo({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lng], 9, { duration: 0.8 });
  }, [map, selected]);
  return null;
}

export default function ValuationService({ embedded = false }) {
  const [governorate, setGovernorate] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [drawnArea, setDrawnArea] = useState(null);
  const selectedGov = governorates.find((item) => item.name === governorate);
  const districtOptions = governorate
    ? districts[governorate] || districts.default
    : [];
  const villageOptions = district ? villages[district] || villages.default : [];
  const selectedName = village || district || governorate;
  const price = selectedGov
    ? selectedGov.price + (district ? 700 : 0) + (village ? 350 : 0)
    : 0;
  const mapPolygon = useMemo(
    () =>
      selectedGov
        ? [
            [selectedGov.lat + 0.22, selectedGov.lng - 0.25],
            [selectedGov.lat + 0.2, selectedGov.lng + 0.25],
            [selectedGov.lat - 0.2, selectedGov.lng + 0.25],
            [selectedGov.lat - 0.22, selectedGov.lng - 0.25],
          ]
        : [],
    [selectedGov],
  );
  const reset = () => {
    setGovernorate("");
    setDistrict("");
    setVillage("");
    setDrawnArea(null);
    setDrawMode(false);
  };
  const completeDraw = (center) => {
    const nearest = governorates.reduce((best, item) => {
      const distance = Math.hypot(item.lat - center.lat, item.lng - center.lng);
      return !best || distance < best.distance ? { item, distance } : best;
    }, null)?.item;
    if (nearest) {
      setGovernorate(nearest.name);
      setDistrict("");
      setVillage("");
    }
    setDrawnArea(center);
    setDrawMode(false);
  };

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
              اعرف متوسط سعر المتر للبيع في منطقتك بسهولة، بناءً على المؤشرات
              العقارية المتاحة.
            </p>
          </div>
          <div className="header-badge">
            <span>▣</span>
            <div>
              <strong>تقدير استرشادي</strong>
              <small>محدث حسب بيانات السوق</small>
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
                  label="المحافظة"
                  value={governorate}
                  options={governorates.map((item) => item.name)}
                  onChange={(value) => {
                    setGovernorate(value);
                    setDistrict("");
                    setVillage("");
                  }}
                  placeholder="اختر المحافظة"
                />
                <SearchSelect
                  label="مركز / قسم"
                  value={district}
                  options={districtOptions}
                  disabled={!governorate}
                  onChange={(value) => {
                    setDistrict(value);
                    setVillage("");
                  }}
                  placeholder="اختر المركز أو القسم"
                />
                <SearchSelect
                  label="الشياخة / القرية"
                  value={village}
                  options={villageOptions}
                  disabled={!district}
                  onChange={setVillage}
                  placeholder="اختر الشياخة أو القرية"
                />
                <div className="selection-note">
                  {selectedName ? (
                    <>
                      ⌖ يتم عرض <b>{selectedName}</b> على الخريطة
                    </>
                  ) : (
                    "ابدأ باختيار المحافظة من القائمة"
                  )}
                </div>
              </div>
            ) : (
              <div className="geo-query">
                <div className="draw-illustration">⌁</div>
                <h3>ارسم المنطقة على الخريطة</h3>
                <p>
                  استخدم أداة المضلع أو المستطيل لتحديد المنطقة التي تريد معرفة
                  حدودها الإدارية وسعرها الاسترشادي.
                </p>
                <button
                  className="draw-action"
                  onClick={() => setDrawMode(true)}
                >
                  ✎ تفعيل أدوات الرسم
                </button>
                <div className="draw-hint">
                  بعد الانتهاء من الرسم ستظهر معلومات الموقع هنا
                </div>
              </div>
            )}
            {(selectedName || drawnArea) && (
              <div className="valuation-result">
                <div className="result-label">متوسط سعر المتر للبيع</div>
                <div className="result-price">
                  {selectedName ? price.toLocaleString("ar-EG") : "—"}{" "}
                  <span>جنيه</span>
                </div>
                <div className="result-divider" />
                <div className="result-location">
                  <span>⌖</span>
                  <div>
                    <b>{selectedName || "منطقة مرسومة على الخريطة"}</b>
                    <small>
                      {selectedGov?.name || "يتم تحليل الحدود الإدارية"} · سعر
                      استرشادي
                    </small>
                  </div>
                </div>
              </div>
            )}
            <button className="reset-btn" onClick={reset}>
              ↻ إعادة ضبط الاستعلام
            </button>
          </aside>
          <div className="valuation-map-wrap">
            {/* <div className="map-topbar">
              <span>
                <i className="live-dot" /> خريطة جمهورية مصر العربية
              </span>
              <span className="map-note">
                اختر من القوائم أو ارسم حدود المنطقة
              </span>
            </div> */}
            <MapContainer
              center={EGYPT_CENTER}
              zoom={5.3}
              minZoom={5}
              className="valuation-map"
              scrollWheelZoom
            >
              <LayersControl position="topright">
                <BaseLayer checked name="Satellite">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </BaseLayer>
                <BaseLayer name="OpenStreetMap">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </BaseLayer>
              </LayersControl>
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DrawTools enabled={drawMode} onComplete={completeDraw} />
              <FlyTo selected={selectedGov} />
              {mapPolygon.length > 0 && (
                <Polygon
                  positions={mapPolygon}
                  pathOptions={{
                    color: "#0b72b9",
                    weight: 3,
                    fillColor: "#32a7e8",
                    fillOpacity: 0.24,
                  }}
                />
              )}
            </MapContainer>

            {drawnArea && (
              <div className="draw-result">
                <span>✓</span>
                <div>
                  <b>تم تحديد منطقة جغرافية</b>
                  <small>اضغط على الاستعلام الإداري للتفاصيل</small>
                </div>
              </div>
            )}
          </div>
        </section>
        <div className="valuation-disclaimer">
          ⓘ الأسعار المعروضة استرشادية للاستخدام الأولي، وقد تختلف حسب حالة
          العقار وموقعه الدقيق ومواصفاته.
        </div>
      </main>
    </div>
  );
}
