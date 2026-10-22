import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Navbar from "../../components/Layout/Navbar";
import "leaflet/dist/leaflet.css";
import "./AddUnitRequest.css";

const DEFAULT_LOCATION = { lat: 30.0444, lng: 31.2357 };
const PHOTO_FIELDS = [
  ["livingRoom", "غرفة المعيشة"],
  ["bedroom1", "غرفة النوم - 1"],
  ["bedroom2", "غرفة النوم - 2"],
  ["kitchen", "المطبخ"],
  ["frontDoor", "الباب الأمامي"],
  ["view", "المطل / البلكونة"],
  ["bathroom1", "الحمام - 1"],
  ["bathroom2", "الحمام - 2"],
];

const LEGAL_SINGLE_FIELDS = [
  ["registeredContract", "العقد المسجل للوحدة"],
  ["saleContracts", "تسلسل عقود البيع"],
  ["baseContract", "العقد الأساسي"],
];

const initialData = {
  usageType: "",
  unitType: "",
  governorate: "",
  district: "",
  street: "",
  buildingNumber: "",
  floor: "",
  unitNumber: "",
  buildYear: "",
  area: "",
  elevator: "",
  condition: "",
  utilities: [],
  rooms: 1,
  kitchens: 1,
  bathrooms: 1,
  receptionRooms: 1,
  structuralIssues: "",
  access: "",
  parking: "",
  nearbyServices: [],
};

const options = {
  usageType: ["سكني", "تجاري", "إداري", "طبي", "سياحي"],
  unitType: ["شقة", "فيلا", "دوبلكس", "استوديو", "محل", "مكتب"],
  governorate: ["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "المنوفية"],
  condition: ["جديدة", "مستعملة بحالة ممتازة", "تحتاج إلى تشطيب", "تحتاج إلى صيانة"],
  access: ["الطريق الرئيسي", "شارع جانبي"],
  parking: ["نعم", "لا"],
};

function MapPositionSync({ position, onChange }) {
  const map = useMap();
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  if (position) map.setView([position.lat, position.lng], map.getZoom());
  return null;
}

function SelectField({ label, name, value, onChange, values, required }) {
  return (
    <label className="unit-field">
      <span>{label}{required && <b>*</b>}</span>
      <select name={name} value={value} onChange={onChange} required={required}>
        <option value="">اختر من القائمة</option>
        {values.map((valueItem) => <option key={valueItem} value={valueItem}>{valueItem}</option>)}
      </select>
    </label>
  );
}

function TextField({ label, name, value, onChange, type = "text", required, placeholder }) {
  return (
    <label className="unit-field">
      <span>{label}{required && <b>*</b>}</span>
      <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} />
    </label>
  );
}

function ChoiceGroup({ label, name, value, onChange, values, multiple, data, setData }) {
  const toggle = (item) => {
    const next = data[name].includes(item)
      ? data[name].filter((entry) => entry !== item)
      : [...data[name], item];
    setData((current) => ({ ...current, [name]: next }));
  };

  return (
    <fieldset className="unit-choice-group">
      <legend>{label}</legend>
      <div className="choice-list">
        {values.map((item) => (
          <label className={`choice-pill ${multiple ? data[name].includes(item) : value === item ? "selected" : ""}`} key={item}>
            <input type={multiple ? "checkbox" : "radio"} name={name} value={item} checked={multiple ? data[name].includes(item) : value === item} onChange={() => multiple ? toggle(item) : onChange({ target: { name, value: item } })} />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CounterField({ label, name, value, setData }) {
  const change = (amount) => setData((current) => ({ ...current, [name]: Math.max(0, Number(current[name]) + amount) }));
  return (
    <div className="counter-field">
      <span>{label}</span>
      <div className="counter-control">
        <button type="button" onClick={() => change(-1)} aria-label={`تقليل ${label}`}>−</button>
        <strong>{value}</strong>
        <button type="button" onClick={() => change(1)} aria-label={`زيادة ${label}`}>+</button>
      </div>
    </div>
  );
}

function FilePreview({ file, video = false }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) return undefined;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file || !url) return null;
  return video ? <video className="review-video" src={url} controls /> : <img className="review-image" src={url} alt={file.name} />;
}

export default function AddUnitRequest() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [photos, setPhotos] = useState({});
  const [video, setVideo] = useState(null);
  const [legalDocuments, setLegalDocuments] = useState({ registeredContract: null, saleContracts: null, baseContract: null, powers: [], judgments: [] });
  const [location, setLocation] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const navigate = useNavigate();
  const markerIcon = useMemo(() => L.divIcon({ className: "unit-map-marker", html: "<span>●</span>", iconSize: [30, 30], iconAnchor: [15, 15] }), []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
  };

  const updatePhoto = (event) => {
    const { name, files } = event.target;
    setPhotos((current) => ({ ...current, [name]: files?.[0] || null }));
  };

  const removePhoto = (name) => setPhotos((current) => ({ ...current, [name]: null }));

  const updateLegalSingle = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      alert("الحد الأقصى لحجم الملف هو 10 ميجابايت.");
      event.target.value = "";
      return;
    }
    setLegalDocuments((current) => ({ ...current, [event.target.name]: file }));
  };

  const updateLegalMultiple = (event) => {
    const validFiles = Array.from(event.target.files || []).filter((file) => file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== event.target.files?.length) alert("تم تجاهل الملفات التي يتجاوز حجمها 10 ميجابايت.");
    setLegalDocuments((current) => ({ ...current, [event.target.name]: [...current[event.target.name], ...validFiles] }));
    event.target.value = "";
  };

  const removeLegalMultiple = (name, index) => setLegalDocuments((current) => ({ ...current, [name]: current[name].filter((_, fileIndex) => fileIndex !== index) }));

  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocation(DEFAULT_LOCATION);
      setMapOpen(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocation({ lat: coords.latitude, lng: coords.longitude }); setMapOpen(true); },
      () => { setLocation(DEFAULT_LOCATION); setMapOpen(true); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = (event) => {
    event.preventDefault();
    if (step < 5) {
      if (step === 1 && !location) {
        alert("يرجى تحديد موقع الوحدة واعتماده أولًا.");
        return;
      }
      if (step === 3 && LEGAL_SINGLE_FIELDS.some(([name]) => !legalDocuments[name])) {
        alert("يرجى رفع مستندات إثبات الملكية الثلاثة قبل المتابعة.");
        return;
      }
      setStep((current) => current + 1);
      return;
    }
    if (!location) {
      alert("يرجى تحديد موقع الوحدة واعتماده أولًا.");
      return;
    }
    const generatedNumber = `UNT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setRequestNumber(generatedNumber);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="unit-page" dir="rtl">
        <Navbar />
        <main className="unit-shell">
          <section className="unit-success">
            <div className="unit-success-icon">✓</div>
            <span className="unit-kicker">تم استلام بيانات الوحدة</span>
            <h1>تم تسجيل الوحدة بنجاح</h1>
            <p>سيتم مراجعة بيانات الوحدة والتواصل معك عند اكتمال المراجعة.</p>
            <div className="unit-request-number"><span>رقم الطلب</span><strong>{requestNumber}</strong></div>
            <button type="button" className="unit-primary" onClick={() => navigate("/")}>العودة إلى الرئيسية</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="unit-page" dir="rtl">
      <Navbar />
      <main className="unit-shell">
        <div className="unit-heading">
          <div><span className="unit-kicker">خدمة تسجيل الوحدات</span><h1>إضافة وحدة جديدة</h1><p>أدخل بيانات الوحدة بدقة، وحدد موقعها على الخريطة لتسهيل الوصول إليها.</p></div>
          <Link className="unit-back" to="/">العودة للرئيسية</Link>
        </div>

        <form className="unit-card" onSubmit={submit}>
          <div className="unit-stepper">
            {["بيانات الوحدة والموقع", "الحالة والخدمات", "المستندات القانونية", "الصور والفيديو", "المراجعة النهائية"].map((title, index) => (
              <div className={`unit-step ${step >= index + 1 ? "active" : ""}`} key={title}><span>{step > index + 1 ? "✓" : index + 1}</span><b>{title}</b></div>
            ))}
          </div>

          {step === 1 && <section className="unit-section">
            <div className="unit-section-heading"><span>المجموعة الأولى</span><h2>تحديد الموقع وبيانات الوحدة</h2><p>حدد الموقع الجغرافي ثم أكمل البيانات الأساسية للوحدة.</p></div>
            <div className="location-box">
              <div><strong>موقع الوحدة</strong><small>{location ? `تم الحفظ: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "لم يتم تحديد موقع الوحدة بعد"}</small></div>
              <button type="button" className="location-button" onClick={locateUser}>⌖ تحديد الموقع على الخريطة</button>
            </div>
            <div className="unit-grid">
              <SelectField label="نوع الاستخدام" name="usageType" value={data.usageType} onChange={updateField} values={options.usageType} required />
              <SelectField label="نوع الوحدة" name="unitType" value={data.unitType} onChange={updateField} values={options.unitType} required />
              <SelectField label="المحافظة" name="governorate" value={data.governorate} onChange={updateField} values={options.governorate} required />
              <TextField label="المنطقة / الحي" name="district" value={data.district} onChange={updateField} required placeholder="مثال: مدينة نصر" />
              <TextField label="اسم الشارع" name="street" value={data.street} onChange={updateField} required />
              <TextField label="رقم المبنى" name="buildingNumber" value={data.buildingNumber} onChange={updateField} required />
              <TextField label="الدور" name="floor" value={data.floor} onChange={updateField} type="number" required />
              <TextField label="رقم الوحدة" name="unitNumber" value={data.unitNumber} onChange={updateField} required />
              <TextField label="سنة البناء تقريبًا" name="buildYear" value={data.buildYear} onChange={updateField} type="number" required placeholder="YYYY" />
              <TextField label="مساحة الوحدة بالمتر المربع" name="area" value={data.area} onChange={updateField} type="number" required placeholder="مثال: 120" />
            </div>
            <ChoiceGroup label="المصعد متاح؟" name="elevator" value={data.elevator} onChange={updateField} values={["نعم", "لا"]} data={data} setData={setData} />
          </section>}

          {step === 2 && <section className="unit-section">
            <div className="unit-section-heading"><span>المجموعة الثانية</span><h2>الحالة والخدمات</h2><p>أخبرنا عن حالة الوحدة والخدمات الموجودة حولها.</p></div>
            <div className="unit-grid"><SelectField label="حالة الوحدة" name="condition" value={data.condition} onChange={updateField} values={options.condition} required /></div>
            <ChoiceGroup label="المرافق متصلة" name="utilities" values={["كهرباء", "ماء", "غاز"]} multiple data={data} setData={setData} />
            <div className="counter-grid"><CounterField label="عدد الغرف" name="rooms" value={data.rooms} setData={setData} /><CounterField label="عدد المطابخ" name="kitchens" value={data.kitchens} setData={setData} /><CounterField label="عدد الحمامات" name="bathrooms" value={data.bathrooms} setData={setData} /><CounterField label="عدد غرف الاستقبال" name="receptionRooms" value={data.receptionRooms} setData={setData} /></div>
            <ChoiceGroup label="هل تمت ملاحظة أي مشاكل هيكلية؟" name="structuralIssues" value={data.structuralIssues} onChange={updateField} values={["نعم", "لا", "لست متأكدًا"]} data={data} setData={setData} />
            <div className="unit-subheading">تقييم المباني والأحياء</div>
            <div className="unit-grid"><ChoiceGroup label="الوصول إلى العقار" name="access" value={data.access} onChange={updateField} values={options.access} data={data} setData={setData} /><ChoiceGroup label="توافر مواقف السيارات" name="parking" value={data.parking} onChange={updateField} values={options.parking} data={data} setData={setData} /></div>
            <ChoiceGroup label="الخدمات القريبة — خلال 7 دقائق سيرًا على الأقدام" name="nearbyServices" values={["سوق", "محطات نقل عام", "المدارس", "المستشفيات", "مترو", "أوتوبيس", "صيدلية", "نادي رياضي", "جيم"]} multiple data={data} setData={setData} />
          </section>}

          {step === 3 && <section className="unit-section">
            <div className="unit-section-heading"><span>الخطوة الثالثة</span><h2>المستندات القانونية</h2><p>ارفع مستندات إثبات الملكية والمستندات الداعمة بصيغة PDF أو JPG أو PNG.</p></div>
            <div className="media-note">الحد الأقصى لحجم كل ملف 10 ميجابايت. يجب أن تكون المستندات واضحة ومقروءة.</div>
            <div className="legal-documents-grid">
              {LEGAL_SINGLE_FIELDS.map(([name, label]) => (
                <label className="legal-upload" key={name}>
                  <input name={name} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={updateLegalSingle} />
                  <span className="document-icon">▣</span><span className="photo-copy"><b>{label}</b><small>{legalDocuments[name]?.name || "لم يتم رفع ملف بعد"}</small></span><span className="photo-action">{legalDocuments[name] ? "استبدال" : "رفع ملف"}</span>
                </label>
              ))}
            </div>
            <div className="legal-support-grid">
              {[ ["powers", "التوكيلات", "ارفع التوكيلات الخاصة بالعقار"], ["judgments", "الأحكام الصادرة", "ارفع الأحكام المتعلقة بالعقار إن وُجدت"] ].map(([name, label, hint]) => (
                <div className="legal-support" key={name}>
                  <label className="legal-upload">
                    <input name={name} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={updateLegalMultiple} />
                    <span className="document-icon">＋</span><span className="photo-copy"><b>{label}</b><small>{hint}</small><em>{legalDocuments[name].length ? `${legalDocuments[name].length} ملف مرفق` : "لم يتم رفع ملف بعد"}</em></span><span className="photo-action">إضافة ملفات</span>
                  </label>
                  {legalDocuments[name].map((file, index) => <div className="legal-file-row" key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" onClick={() => removeLegalMultiple(name, index)}>حذف</button></div>)}
                </div>
              ))}
            </div>
          </section>}

          {step === 4 && <section className="unit-section">
            <div className="unit-section-heading"><span>الخطوة الرابعة</span><h2>الصور والفيديو</h2><p>يمكنك إرفاق صور الوحدة والفيديو بشكل اختياري. يمكنك إرسال الطلب بدون صور أو فيديو.</p></div>
            <div className="media-note">الصور اختيارية، لكن إضافة صور واضحة تساعد على سرعة مراجعة طلب الإدراج.</div>
            <div className="photo-grid">
              {PHOTO_FIELDS.map(([name, label]) => (
                <label className="photo-upload" key={name}>
                  <input name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={updatePhoto} />
                  <span className="photo-preview">{photos[name] ? "✓" : "＋"}</span>
                  <span className="photo-copy"><b>{label}</b><small>{photos[name]?.name || "رفع صورة اختيارية"}</small></span>
                  <span className="photo-action">{photos[name] ? "استبدال" : "رفع صورة"}</span>
                  {photos[name] && <button type="button" className="photo-remove" onClick={(event) => { event.preventDefault(); removePhoto(name); }}>حذف</button>}
                </label>
              ))}
            </div>
            <div className="video-upload-wrap">
              <label className="video-upload">
                <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setVideo(event.target.files?.[0] || null)} />
                <span className="video-icon">▶</span><span className="photo-copy"><b>فيديو مصور للوحدة</b><small>{video?.name || "فيديو اختياري بصيغة MP4 أو WebM"}</small></span><span className="photo-action">{video ? "استبدال الفيديو" : "إضافة فيديو"}</span>
              </label>
              {video && <button type="button" className="video-remove" onClick={() => setVideo(null)}>حذف الفيديو</button>}
            </div>
          </section>}

          {step === 5 && <section className="unit-section review-section">
            <div className="unit-section-heading"><span>الخطوة الخامسة والأخيرة</span><h2>مراجعة البيانات والمرفقات</h2><p>تأكد من صحة البيانات والمستندات والصور قبل إرسال طلب تسجيل الوحدة.</p></div>
            <div className="review-data-card">
              <h3>بيانات الوحدة والموقع</h3>
              <div className="review-data-grid">
                {[["نوع الاستخدام", "usageType"], ["نوع الوحدة", "unitType"], ["المحافظة", "governorate"], ["المنطقة / الحي", "district"], ["اسم الشارع", "street"], ["رقم المبنى", "buildingNumber"], ["الدور", "floor"], ["رقم الوحدة", "unitNumber"], ["سنة البناء", "buildYear"], ["المساحة", "area"], ["المصعد", "elevator"], ["حالة الوحدة", "condition"], ["المرافق", "utilities"], ["المشاكل الهيكلية", "structuralIssues"], ["الوصول", "access"], ["مواقف السيارات", "parking"], ["الخدمات القريبة", "nearbyServices"]].map(([label, key]) => <div className="review-data-row" key={key}><span>{label}</span><strong>{Array.isArray(data[key]) ? (data[key].join("، ") || "لم يتم الاختيار") : data[key] || "لم يتم الإدخال"}</strong></div>)}
                <div className="review-data-row"><span>الإحداثيات النهائية</span><strong>{location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "لم يتم التحديد"}</strong></div>
              </div>
            </div>
            <div className="review-data-card">
              <h3>المستندات القانونية</h3>
              <div className="review-legal-list">
                {LEGAL_SINGLE_FIELDS.map(([name, label]) => <div className="review-legal-row" key={name}><span>{label}</span><b>{legalDocuments[name]?.name || "لم يتم الرفع"}</b></div>)}
                {[ ["powers", "التوكيلات"], ["judgments", "الأحكام الصادرة"] ].map(([name, label]) => <div className="review-legal-row" key={name}><span>{label}</span><b>{legalDocuments[name].length ? legalDocuments[name].map((file) => file.name).join("، ") : "لم يتم الرفع"}</b></div>)}
              </div>
            </div>
            <div className="review-data-card">
              <h3>صور وفيديو الوحدة</h3>
              <div className="review-media-grid">
                {PHOTO_FIELDS.map(([name, label]) => photos[name] && <div className="review-media-item" key={name}><FilePreview file={photos[name]} /><span>{label}</span></div>)}
              </div>
              {!Object.values(photos).some(Boolean) && <p className="empty-review">لم يتم رفع صور — يمكن إرسال الطلب بدون صور.</p>}
              {video ? <div className="review-video-wrap"><FilePreview file={video} video /><span>{video.name}</span></div> : <p className="empty-review">لم يتم رفع فيديو.</p>}
            </div>
          </section>}
          <div className="unit-actions">
            {step > 1 && <button type="button" className="unit-secondary" onClick={() => setStep((current) => current - 1)}>السابق</button>}
            <button type="submit" className="unit-primary">{step === 5 ? "تأكيد وإرسال الطلب" : "التالي"} <span>←</span></button>
          </div>
        </form>
      </main>

      {mapOpen && (
        <div className="map-overlay" role="dialog" aria-modal="true" aria-label="تحديد موقع الوحدة">
          <div className="map-dialog">
            <div className="map-dialog-heading"><div><span>تحديد الموقع</span><h2>حرّك العلامة إلى المكان الدقيق</h2></div><button type="button" onClick={() => setMapOpen(false)} aria-label="إغلاق الخريطة">×</button></div>
            <div className="map-wrap"><MapContainer center={[location?.lat || DEFAULT_LOCATION.lat, location?.lng || DEFAULT_LOCATION.lng]} zoom={15} scrollWheelZoom><TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /><MapPositionSync position={location || DEFAULT_LOCATION} onChange={setLocation} /><Marker position={[location?.lat || DEFAULT_LOCATION.lat, location?.lng || DEFAULT_LOCATION.lng]} icon={markerIcon} draggable eventHandlers={{ dragend: (event) => { const point = event.target.getLatLng(); setLocation({ lat: point.lat, lng: point.lng }); } }} /></MapContainer></div>
            <div className="map-coordinates"><span>خط العرض (X): <strong>{(location || DEFAULT_LOCATION).lat.toFixed(6)}</strong></span><span>خط الطول (Y): <strong>{(location || DEFAULT_LOCATION).lng.toFixed(6)}</strong></span></div>
            <div className="map-actions"><button type="button" className="map-cancel" onClick={() => setMapOpen(false)}>إلغاء</button><button type="button" className="unit-primary" onClick={() => setMapOpen(false)}>اعتماد الموقع</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
