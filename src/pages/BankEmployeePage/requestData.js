import { getRequestStatusUpdates, getWorkflowRequests } from "../../utils/requestWorkflow";

export const DOC_LABELS = [
  {
    title: "شهادة مفردات مرتب معتمدة",
    filename: "شهادة_مفردات_مرتب_861.pdf",
    path: `${import.meta.env.BASE_URL}pdfs/sample_salary.pdf`,
  },
  {
    title: "كشف حساب بنكي (آخر 6 أشهر)",
    filename: "كشف_حساب_بنكي_أكتوبر_2026.pdf",
    path: `${import.meta.env.BASE_URL}pdfs/bank_statement.pdf`,
  },
  {
    title: "صورة بطاقة الهوية / الرقم القومي",
    filename: "بطاقة_الهوية_28905150101234.pdf",
    path: `${import.meta.env.BASE_URL}pdfs/id_card.pdf`,
  },
];

export const REQUESTS = [
  {
    id: 1,
    unitCode: "246",
    clientCode: "861",
    date: "2026-10-22",
    status: "review",
    branch: "cairo",
    applicant: {
      name: "عبدالرحمن خالد منصور",
      phone: "+20 100 123 4567",
      email: "abdelrahman.mansour@bank-mail.com",
      nationalId: "28905150101234",
    },
    docs: [true, true, true],
    unit: {
      district: "246 - حي الياسمين (التجمع الخامس)",
      spec: "شقة سكنية دوبلكس (195 م²) - 4 غرف + ريسيبشن",
      deed: "عقد مسجل برقم: 4521 لسنة 2022",
      value: "4,250,000 ج.م",
      lat: 30.0074,
      lng: 31.4913,
    },
  },
  {
    id: 2,
    unitCode: "362",
    clientCode: "618",
    date: "2026-10-22",
    status: "new",
    branch: "giza",
    applicant: {
      name: "سارة أحمد الشافعي",
      phone: "+20 111 842 1190",
      email: "sara.elshafey@bank-mail.com",
      nationalId: "29208222101526",
    },
    docs: [true, true, false],
    unit: {
      district: "362 - الحي الثاني (الشيخ زايد)",
      spec: "فيلا مستقلة (320 م²) - 5 غرف + ريسيبشن",
      deed: "عقد مسجل برقم: 1873 لسنة 2021",
      value: "9,800,000 ج.م",
      lat: 30.0444,
      lng: 30.976,
    },
  },
  {
    id: 3,
    unitCode: "452",
    clientCode: "186",
    date: "2026-10-21",
    status: "new",
    branch: "cairo",
    applicant: {
      name: "محمد سعيد الجمل",
      phone: "+20 122 331 7742",
      email: "mohamed.elgamal@bank-mail.com",
      nationalId: "29512300102173",
    },
    docs: [true, true, true],
    unit: {
      district: "452 - الحي السابع (مدينة نصر)",
      spec: "شقة سكنية (150 م²) - 3 غرف + ريسيبشن",
      deed: "عقد مسجل برقم: 6094 لسنة 2020",
      value: "3,100,000 ج.م",
      lat: 30.0561,
      lng: 31.33,
    },
  },
  {
    id: 4,
    unitCode: "674",
    clientCode: "234",
    date: "2026-10-20",
    status: "new",
    branch: "cairo",
    applicant: {
      name: "نورا عبدالعزيز الحسيني",
      phone: "+20 155 678 2203",
      email: "noura.elhosseiny@bank-mail.com",
      nationalId: "29907120100846",
    },
    docs: [true, false, false],
    unit: {
      district: "674 - حي دجلة (المعادي)",
      spec: "دوبلكس (230 م²) - 4 غرف + ريسيبشن",
      deed: "عقد مسجل برقم: 3350 لسنة 2023",
      value: "6,500,000 ج.م",
      lat: 29.9602,
      lng: 31.2569,
    },
  },
  {
    id: 5,
    unitCode: "321",
    clientCode: "432",
    date: "2026-10-19",
    status: "visit",
    branch: "alex",
    applicant: {
      name: "كريم ناصر عبدالله",
      phone: "+20 109 910 4457",
      email: "karim.abdallah@bank-mail.com",
      nationalId: "29103180201457",
    },
    docs: [true, true, true],
    unit: {
      district: "321 - الحي الخامس (6 أكتوبر)",
      spec: "شقة سكنية (120 م²) - 2 غرفة + ريسيبشن",
      deed: "عقد مسجل برقم: 2208 لسنة 2022",
      value: "2,400,000 ج.م",
      lat: 29.9285,
      lng: 30.9188,
    },
  },
];

export const formatDate = (iso) => iso.split("-").reverse().join("-");

export function getWorkflowFinancingRequests() {
  const statusUpdates = getRequestStatusUpdates();
  return getWorkflowRequests()
    .filter((request) => request.kind === "financing")
    .map((request) => {
      const data = request.data || {};
      const property = request.property || {};
      const beneficiary = request.beneficiary || request.applicant || {};
      const unitCode = data.unitNumber || property.id || request.propertyId || "—";
      const district = property.district || data.district || data.address || "—";
      const area = data.area || property.area || "—";
      const type = property.type || data.propertyType || "وحدة سكنية";
      const applicantName = beneficiary.name || data.fullName || "مستفيد جديد";
      const location = request.location || (property.lat && property.lng ? { lat: property.lat, lng: property.lng } : null);
      const governorate = property.governorate || data.governorate || "";
      const branch = governorate.includes("الجيزة") ? "giza" : governorate.includes("الإسكندرية") ? "alex" : "cairo";
      const statusUpdate = statusUpdates[String(request.id)] || {};
      const requestStatus = statusUpdate.status || request.status;

      return {
        id: request.id,
        workflowId: request.id,
        unitCode: String(unitCode),
        clientCode: String(data.nationalId || beneficiary.nationalId || request.id).slice(-6),
        date: String(request.createdAt || "").slice(0, 10),
        status:
          requestStatus === "approved"
            ? "approved"
            : requestStatus === "rejected"
              ? "rejected"
              : "review",
        branch,
        applicant: {
          name: applicantName,
          phone: beneficiary.phone || data.phone || "—",
          email: beneficiary.email || data.email || "—",
          nationalId: beneficiary.nationalId || data.nationalId || "—",
        },
        docs: request.documentChecks || [true, false, true],
        unit: {
          district,
          spec: `${type} (${area} م²)`,
          deed: "بيانات الملكية مرفقة مع طلب التمويل",
          value: `${Number(property.price || data.propertyPrice || data.price || 0).toLocaleString("ar-EG")} ج.م`,
          lat: Number(location?.lat) || 30.0444,
          lng: Number(location?.lng) || 31.2357,
        },
        financing: {
          loanAmount: data.loanAmount || 0,
          monthlyInstallment: data.monthlyInstallment || 0,
          bank: data.bank || "—",
          periodYears: data.periodYears || 0,
        },
        workflowRequest: { ...request, ...statusUpdate },
      };
    });
}

export function getBankEmployeeRequests() {
  const statusUpdates = getRequestStatusUpdates();
  const storedRequests = REQUESTS.map((request) => ({
    ...request,
    ...(statusUpdates[String(request.id)] || {}),
  }));

  return [...storedRequests, ...getWorkflowFinancingRequests()];
}
