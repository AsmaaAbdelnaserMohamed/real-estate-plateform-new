import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getWorkflowRequests } from "../../utils/requestWorkflow";

const SOLD_UNIT_ICON = L.divIcon({
  className: "dashboard-sold-marker",
  html: "<span>✓</span>",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const STATUS_CLASS = {
  متاح: "badge--available",
  مباع: "badge--sold",
  معلق: "badge--pending",
  محجوز: "badge--reserved",
  "موافق عليه": "badge--approved",
  مرفوض: "badge--rejected",
  "قيد المراجعة": "badge--reviewing",
  "عميل نشط": "badge--active",
  مكتمل: "badge--completed",
  "في المفاوضات": "badge--negotiating",
};

const MONTHS = ["نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "أبريل","مايو","يونيو","يوليو" ];
const BARS = [45, 60, 38, 72, 55, 80,66, 60, 38];
const VALUES = ["4.5M", "6.1M", "3.8M", "7.2M", "5.5M", "8.1M","6.6M", "6.1M", "3.8M"];

const Badge = ({ label }) => {
  const mod = STATUS_CLASS[label] ?? "badge--default";
  return <span className={`badge ${mod}`}>{label}</span>;
};

const StatCard = ({ label, value, badge, badgeType }) => (
  <div className="stat-card">
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    <span className={`stat-badge stat-badge--${badgeType}`}>{badge}</span>
  </div>
);

function getApprovedWorkflowUnits() {
  return getWorkflowRequests()
    .filter(
      (request) =>
        request.kind === "unit" &&
        request.status === "eligible" &&
        request.decision === "eligible" &&
        request.reviewerDecisionAt &&
        Number.isFinite(Number(request.location?.lat)) &&
        Number.isFinite(Number(request.location?.lng)),
    )
    .map((request) => {
      const data = request.data || {};

      return {
        id: `approved-${request.id}`,
        name: data.unitType || "وحدة معتمدة",
        area: data.fullAddress || [data.governorate, data.district].filter(Boolean).join("، "),
        price: Number(data.price) || 0,
        size: Number(data.area) || 0,
        rooms: data.rooms || "",
        lat: Number(request.location.lat),
        lng: Number(request.location.lng),
        mapStatus: "طلب معتمد",
      };
    });
}

function DashboardMiniMap({ units, approvedUnits }) {
  const soldUnits = units.filter(
    (unit) => unit.status === "مباع" && Number.isFinite(Number(unit.lat)) && Number.isFinite(Number(unit.lng)),
  );
  const mapUnits = [
    ...soldUnits.map((unit) => ({ ...unit, mapStatus: "مباعة" })),
    ...approvedUnits,
  ];

  return (
    <MapContainer
      center={[30.0444, 31.2357]}
      zoom={7}
      scrollWheelZoom={false}
      zoomControl={false}
      className="dashboard-mini-map-container"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapUnits.map((unit) => (
        <Marker key={unit.id} position={[Number(unit.lat), Number(unit.lng)]} icon={SOLD_UNIT_ICON}>
          <Popup>
            <div className="dashboard-unit-popup" dir="rtl">
              <strong>{unit.name || "وحدة مباعة"}</strong>
              <span>{unit.area || unit.compound || "الموقع غير محدد"}</span>
              <span>السعر: {Number(unit.price || 0).toLocaleString("ar-EG")} ج.م</span>
              <span>المساحة: {unit.size || "—"} م²</span>
              {unit.rooms && <span>الغرف: {unit.rooms}</span>}
              <small>الحالة: {unit.mapStatus}</small>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function exportToCSV(data) {
  if (!data?.length) {
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((field) => {
        let value = row[field];

        if (value instanceof Date) {
          value = value.toLocaleDateString("ar-EG");
        }

        value = String(value ?? "");
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mortgage_requests.csv";
  link.click();
}

export default function DashboardHome({
  units,
  mortgageRequests,
  clients,
  onAddUnit,
}) {
  const [approvedUnits, setApprovedUnits] = useState([]);

  useEffect(() => {
    const refreshApprovedUnits = () => setApprovedUnits(getApprovedWorkflowUnits());

    refreshApprovedUnits();
    window.addEventListener("workflow-requests-changed", refreshApprovedUnits);
    window.addEventListener("storage", refreshApprovedUnits);

    return () => {
      window.removeEventListener("workflow-requests-changed", refreshApprovedUnits);
      window.removeEventListener("storage", refreshApprovedUnits);
    };
  }, []);

  const soldUnits = units.filter((unit) => unit.status === "مباع");
  const availableUnits = units.filter((unit) => unit.status === "متاح").length;
  const activeRequests = mortgageRequests.filter(
    (request) => request.status === "قيد المراجعة"
  ).length;
  const approvedRequests = mortgageRequests.filter(
    (request) => request.status === "موافق عليه"
  ).length;
  const revenue = soldUnits.reduce((sum, unit) => sum + unit.price, 0);
  const averageUnitPrice = units.length
    ? Math.round(units.reduce((sum, unit) => sum + unit.price, 0) / units.length)
    : 0;
  const approvalRate = mortgageRequests.length
    ? Math.round((approvedRequests / mortgageRequests.length) * 100)
    : 0;
  const revenueLabel =
    revenue >= 1_000_000
      ? `${(revenue / 1_000_000).toFixed(1)}M`
      : revenue.toLocaleString("ar-EG");
  const averageUnitLabel =
    averageUnitPrice >= 1_000_000
      ? `${(averageUnitPrice / 1_000_000).toFixed(2)}M`
      : averageUnitPrice.toLocaleString("ar-EG");

  return (
    <div className="dashboard">
 

      <div className="dashboard-insights">
        <div className="dashboard-insight-card">
          <span className="dashboard-insight-label">وحدات متاحة الآن</span>
          <strong className="dashboard-insight-value">{availableUnits}</strong>
          <p className="dashboard-insight-note">جاهزة للعرض والمتابعة المباشرة</p>
        </div>

        <div className="dashboard-insight-card">
          <span className="dashboard-insight-label">متوسط سعر الوحدة</span>
          <strong className="dashboard-insight-value">
            {averageUnitLabel} ج.م
          </strong>
          <p className="dashboard-insight-note">قراءة سريعة لمستوى التسعير الحالي</p>
        </div>

        <div className="dashboard-insight-card">
          <span className="dashboard-insight-label">نسبة الموافقات</span>
          <strong className="dashboard-insight-value">{approvalRate}%</strong>
          <p className="dashboard-insight-note">من إجمالي طلبات التمويل المسجلة</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="إجمالي الوحدات"
          value={units.length}
          badge="↑ 12 هذا الشهر"
          badgeType="up"
        />
        <StatCard
          label="وحدات مباعة"
          value={soldUnits.length}
          badge="↑ 8% من الشهر الماضي"
          badgeType="up"
        />
        <StatCard
          label="طلبات تمويل نشطة"
          value={activeRequests}
          badge="↓ 3 معلقة"
          badgeType="down"
        />
        <StatCard
          label="إجمالي المبيعات"
          value={`${revenueLabel} ج.م`}
          badge="↑ 18% هذا الربع"
          badgeType="up"
        />
      </div>

      <div className="dashboard-two-col dashboard-two-col--feature">
        <div className="card dashboard-map-card">
        <div className="map-header">
          <div>
            <div className="card-title">مواقع الوحدات</div>
          </div>

          <span className="map-link">تحديث مباشر</span>
        </div>

        <div className="mini-map" aria-label="خريطة مصغرة لمواقع الوحدات">
          <DashboardMiniMap units={units} approvedUnits={approvedUnits} />
        </div>
</div>

        <div className="card">
          <div className="card-title">مبيعات الأشهر الستة</div>
          <div className="sales-bars-list">
            {MONTHS.map((month, index) => (
              <div key={month} className="sales-bar-row">
                <div className="sales-bar-label">{month}</div>
                <div className="sales-bar-track">
                  <div
                    className="sales-bar-fill"
                    style={{ width: `${BARS[index]}%` }}
                  />
                </div>
                <div className="sales-bar-value">{VALUES[index]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-two-col">
        <div className="card">
          <div className="card-title">أحدث الوحدات</div>
          <div className="list-rows">
            {[...units].reverse().slice(0, 4).map((unit) => (
              <div key={unit.id} className="unit-row">
                <div className="unit-row-main">
                  <div className="unit-row-name">{unit.name}</div>
                  <div className="unit-row-sub">
                    {unit.area} · {unit.size} م²
                  </div>
                </div>

                <div className="unit-row-right">
                  <div className="unit-row-price">
                    {(unit.price / 1_000_000).toFixed(2)}M ج.م
                  </div>
                  <Badge label={unit.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">طلبات التمويل الأخيرة</div>
          <div className="list-rows">
            {mortgageRequests.map((request) => (
              <div key={request.id} className="mortgage-row">
                <div className="mortgage-row-main">
                  <div className="mortgage-row-ref">#{request.refNumber}</div>
                  <div className="mortgage-row-name">{request.clientName}</div>
                </div>

                <div className="mortgage-row-right">
                  <div className="mortgage-row-amount">
                    {(request.amount / 1000).toFixed(0)}K ج.م
                  </div>
                  <Badge label={request.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="clients-card">
        <div className="card-title">أحدث العملاء</div>
        <div>
          {clients.map((client, index) => (
            <div
              key={client.id}
              className={`client-row${
                index < clients.length - 1 ? " client-row--bordered" : ""
              }`}
            >
              <div className="client-avatar">{client.name.slice(0, 2)}</div>
              <div className="client-info">
                <div className="client-name">{client.name}</div>
                <div className="client-interest">{client.interest}</div>
              </div>
              <div className="client-status">
                <Badge label={client.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
