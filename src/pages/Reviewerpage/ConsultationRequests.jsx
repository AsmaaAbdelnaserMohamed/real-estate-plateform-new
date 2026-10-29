import { useEffect, useMemo, useState } from 'react';
import { getWorkflowFiles } from '../../utils/requestWorkflow';
import styles from './ReviewerPage.module.css';

const FIELD_LABELS = {
  fullName: 'الاسم بالكامل',
  consultantName: 'اسم مقدم الاستشارة',
  name: 'الاسم',
  phone: 'رقم الهاتف',
  consultantPhone: 'هاتف مقدم الاستشارة',
  email: 'البريد الإلكتروني',
  consultantEmail: 'بريد مقدم الاستشارة',
  consultTopic: 'موضوع الاستشارة',
  consultDetails: 'تفاصيل الاستشارة',
  urgency: 'درجة الاستعجال',
  preferredContact: 'طريقة التواصل المفضلة',
  governorate: 'المحافظة',
  district: 'المنطقة / الحي',
  address: 'العنوان',
  fullAddress: 'العنوان بالتفصيل',
};

const STATUS_LABELS = {
  review: 'قيد المراجعة',
  responded: 'تم الرد',
  scheduled: 'تم تحديد الموعد',
  eligible: 'مكتمل',
  ineligible: 'مغلق',
};

const EMPTY_APPOINTMENT = {
  type: 'zoom',
  dateTime: '',
  zoomUrl: '',
  location: '',
  notes: '',
};

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.map(formatValue).join('، ') : '—';
  }
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, entry]) => `${FIELD_LABELS[key] || key}: ${formatValue(entry)}`)
      .join('، ');
  }
  return String(value);
}

function displayDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('ar-EG', options).format(date);
}

function dateTimeInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function requestName(request) {
  const data = request.data || {};
  return data.fullName || data.consultantName || data.name || 'غير محدد';
}

function requestTopic(request) {
  const data = request.data || {};
  return data.consultTopic || data.consultationTopic || data.topic || 'غير محدد';
}

function requestStatus(request) {
  return request.status || 'review';
}

function contactMethod(request) {
  const appointment = request.consultationAppointment;
  if (!appointment) return formatValue(request.data?.preferredContact);
  const mode = appointment.type === 'zoom' ? 'جلسة Zoom' : 'زيارة داخل الشركة';
  return `${mode} — ${displayDate(appointment.dateTime, { dateStyle: 'short', timeStyle: 'short' })}`;
}

function requestFields(data = {}) {
  return Object.entries(data)
    .filter(([key, value]) => (
      !['docs', 'titleDocs', 'documents', 'attachments'].includes(key)
      && value !== ''
      && value !== null
      && value !== undefined
      && (!Array.isArray(value) || value.length > 0)
    ))
    .map(([key, value]) => ({
      key,
      label: FIELD_LABELS[key] || key,
      value: formatValue(value),
    }));
}

function statusClass(status) {
  if (['review', 'responded', 'scheduled', 'eligible', 'ineligible'].includes(status)) {
    return styles[`badge_${status}`];
  }
  return styles.badge_review;
}

function ConsultationIcon({ name, size = 16 }) {
  const path = name === 'close'
    ? <path d="m6 6 12 12M18 6 6 18" />
    : name === 'search'
      ? <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>
      : <path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

export default function ConsultationRequests({ requests, onUpdateRequest }) {
  const [selectedId, setSelectedId] = useState(() => requests[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reply, setReply] = useState('');
  const [appointment, setAppointment] = useState(EMPTY_APPOINTMENT);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);

  const uniqueRequests = useMemo(() => {
    const seen = new Set();
    return requests.filter((request) => {
      if (request?.id === undefined || request?.id === null || seen.has(String(request.id))) return false;
      seen.add(String(request.id));
      return true;
    });
  }, [requests]);

  const visibleRequests = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return uniqueRequests.filter((request) => {
      const matchesSearch = !search || [
        request.id,
        request.requestNumber,
        requestName(request),
        requestTopic(request),
        request.data?.consultDetails,
      ].some((value) => String(value || '').toLocaleLowerCase().includes(search));
      return matchesSearch && (!statusFilter || requestStatus(request) === statusFilter);
    });
  }, [uniqueRequests, query, statusFilter]);

  const selected = uniqueRequests.find((request) => String(request.id) === String(selectedId)) || null;
  const documents = selected?.documents || [];
  const responses = selected?.reviewerResponses || [];
  const scheduledAppointment = selected?.consultationAppointment || null;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPreview(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedId !== null && !uniqueRequests.some((request) => String(request.id) === String(selectedId))) {
      setSelectedId(null);
    }
  }, [selectedId, uniqueRequests]);

  useEffect(() => {
    if (!preview?.objectUrl) return undefined;
    return () => URL.revokeObjectURL(preview.objectUrl);
  }, [preview]);

  const persistUpdate = async (changes, action) => {
    if (!selected || busy) return false;
    setBusy(action);
    setMessage(null);
    try {
      await onUpdateRequest(selected.id, changes);
      setMessage({
        type: 'success',
        text: action === 'reply' ? 'تم حفظ الرد في سجل الطلب.' : 'تم حفظ الموعد في سجل الطلب.',
      });
      return true;
    } catch (error) {
      console.error('Failed to update consultation request', error);
      setMessage({ type: 'error', text: 'تعذّر حفظ التحديث. يُرجى المحاولة مرة أخرى.' });
      return false;
    } finally {
      setBusy('');
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    const text = reply.trim();
    if (!text || !selected || busy) return;
    const nextResponses = [
      ...responses,
      { id: `${selected.id}-${Date.now()}`, text, createdAt: new Date().toISOString() },
    ];
    const saved = await persistUpdate({
      reviewerResponses: nextResponses,
      status: scheduledAppointment ? 'scheduled' : 'responded',
    }, 'reply');
    if (saved) setReply('');
  };

  const submitAppointment = async (event) => {
    event.preventDefault();
    if (!selected || busy) return;
    const appointmentDate = new Date(appointment.dateTime);
    if (!Number.isFinite(appointmentDate.getTime())) {
      setMessage({ type: 'error', text: 'يرجى إدخال تاريخ ووقت صالحين للموعد.' });
      return;
    }
    const savedAppointment = {
      ...appointment,
      dateTime: appointmentDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await persistUpdate({
      consultationAppointment: savedAppointment,
      status: 'scheduled',
    }, 'appointment');
  };

  const openDocument = async (document) => {
    setBusy(`file-${document.id || document.meta}`);
    setMessage(null);
    try {
      const files = await getWorkflowFiles(selected.id);
      const storedFile = files.find((file) => (
        (document.fileKey && file.key === document.fileKey)
        || (document.id && file.key === document.id)
        || file.name === document.meta
      ));
      if (!storedFile?.blob) {
        setMessage({ type: 'error', text: 'بيانات المرفق موجودة، لكن الملف نفسه غير محفوظ في النظام.' });
        return;
      }
      const objectUrl = URL.createObjectURL(storedFile.blob);
      setPreview({
        title: document.title || document.meta || 'مرفق الطلب',
        fileName: storedFile.name,
        fileType: storedFile.type,
        url: objectUrl,
        objectUrl,
      });
    } catch (error) {
      console.error('Failed to load consultation attachment', error);
      setMessage({ type: 'error', text: 'تعذّر فتح المرفق. يُرجى المحاولة مرة أخرى.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className={`${styles.section} ${styles.themeConsultation}`}>
      <section className={styles.card}>
        <header className={styles.listHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.titleIcon}><ConsultationIcon /></span>
            طلبات الاستشارات القانونية العقارية
          </h2>
          <span className={styles.pill}>{uniqueRequests.length} طلبات مسجلة</span>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <input
              type="search"
              className={styles.input}
              placeholder="ابحث برقم الطلب أو الاسم أو موضوع الاستشارة..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="البحث في طلبات الاستشارات"
            />
            <span className={styles.searchIcon}><ConsultationIcon name="search" /></span>
          </div>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="تصفية حسب حالة الطلب"
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <span className={styles.consultationCount}>المعروض: {visibleRequests.length}</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>اسم مقدم الطلب</th>
                <th>تاريخ التسجيل</th>
                <th>موضوع الاستشارة</th>
                <th>طريقة التواصل</th>
                <th>الحالة</th>
                <th className={styles.actionCol}>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {!visibleRequests.length && (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    {uniqueRequests.length
                      ? 'لا توجد طلبات مطابقة للبحث أو التصفية.'
                      : 'لا توجد طلبات استشارات قانونية عقارية مسجلة حتى الآن.'}
                  </td>
                </tr>
              )}
              {visibleRequests.map((request) => {
                const status = requestStatus(request);
                return (
                  <tr key={request.id} className={styles.row}>
                    <td className={styles.cellStrong}>{request.requestNumber || request.id}</td>
                    <td>{requestName(request)}</td>
                    <td className={styles.cellMuted}>
                      {displayDate(request.createdAt, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </td>
                    <td>{requestTopic(request)}</td>
                    <td>{contactMethod(request)}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass(status)}`}>
                        {STATUS_LABELS[status] || status}
                      </span>
                    </td>
                    <td className={styles.actionCol}>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => {
                          setReply('');
                          setPreview(null);
                          setAppointment({
                            ...EMPTY_APPOINTMENT,
                            ...(request.consultationAppointment || {}),
                            dateTime: dateTimeInputValue(request.consultationAppointment?.dateTime),
                          });
                          setMessage(null);
                          setSelectedId(request.id);
                        }}
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.tableFooter}>
          <span>تُعرض الطلبات المسجلة من نموذج الاستشارات القانونية العقارية.</span>
          <span>الإجمالي: {uniqueRequests.length}</span>
        </footer>
      </section>

      {selected && (
          <section
            className={`${styles.card} ${styles.consultationDetail}`}
            aria-labelledby="consultation-detail-title"
          >
            <header className={styles.detailHeader}>
              <h2 id="consultation-detail-title" className={styles.cardTitle}>
                تفاصيل طلب الاستشارة
              </h2>
              <div className={styles.detailHeaderActions}>
                <span className={`${styles.badge} ${statusClass(requestStatus(selected))}`}>
                  {STATUS_LABELS[requestStatus(selected)] || requestStatus(selected)}
                </span>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setSelectedId(null)}
                  aria-label="إغلاق تفاصيل الطلب"
                >
                  <ConsultationIcon name="close" />
                </button>
              </div>
            </header>

            <div className={styles.fields}>
              <div className={styles.field} style={{ gridColumn: 'span 6' }}>
                <span className={styles.fieldLabel}>رقم الطلب</span>
                <div className={`${styles.fieldValue} ${styles.fieldMono}`}>
                  {selected.requestNumber || selected.id}
                </div>
              </div>
              <div className={styles.field} style={{ gridColumn: 'span 6' }}>
                <span className={styles.fieldLabel}>تاريخ التسجيل</span>
                <div className={styles.fieldValue}>{displayDate(selected.createdAt)}</div>
              </div>
              {requestFields(selected.data).map((field) => (
                <div key={field.key} className={styles.field} style={{ gridColumn: 'span 12' }}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <div className={styles.fieldValue}>{field.value}</div>
                </div>
              ))}
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>المرفقات</div>
              {documents.length ? (
                <div className={styles.docs}>
                  {documents.map((document, index) => {
                    const busyOpening = busy === `file-${document.id || document.meta}`;
                    return (
                      <div key={`${document.id || document.meta}-${index}`} className={styles.doc}>
                        <span className={`${styles.docIcon} ${styles.tone_blue}`}>
                          <ConsultationIcon />
                        </span>
                        <div className={styles.docText}>
                          <strong>{document.title || 'مرفق'}</strong>
                          <small>{document.meta || document.name || 'اسم الملف غير متاح'}</small>
                        </div>
                        <button
                          type="button"
                          className={styles.outlineBtn}
                          onClick={() => openDocument(document)}
                          disabled={Boolean(busy)}
                        >
                          {busyOpening ? 'جاري الفتح...' : 'عرض / تحميل'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.consultationEmpty}>لا توجد مرفقات لهذا الطلب.</p>
              )}
            </div>

            {scheduledAppointment && (
              <div className={styles.block}>
                <div className={styles.blockTitle}>موعد الاستشارة</div>
                <div className={styles.fields}>
                  <div className={styles.field} style={{ gridColumn: 'span 6' }}>
                    <span className={styles.fieldLabel}>نوع الموعد</span>
                    <div className={styles.fieldValue}>
                      {scheduledAppointment.type === 'zoom' ? 'جلسة عن بُعد (Zoom)' : 'زيارة داخل الشركة'}
                    </div>
                  </div>
                  <div className={styles.field} style={{ gridColumn: 'span 6' }}>
                    <span className={styles.fieldLabel}>التاريخ والوقت</span>
                    <div className={styles.fieldValue}>
                      {displayDate(scheduledAppointment.dateTime, { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  {scheduledAppointment.zoomUrl && (
                    <div className={styles.field} style={{ gridColumn: 'span 12' }}>
                      <span className={styles.fieldLabel}>رابط Zoom</span>
                      <a className={styles.consultationLink} href={scheduledAppointment.zoomUrl} target="_blank" rel="noreferrer">
                        {scheduledAppointment.zoomUrl}
                      </a>
                    </div>
                  )}
                  {scheduledAppointment.location && (
                    <div className={styles.field} style={{ gridColumn: 'span 12' }}>
                      <span className={styles.fieldLabel}>المكان</span>
                      <div className={styles.fieldValue}>{scheduledAppointment.location}</div>
                    </div>
                  )}
                  {scheduledAppointment.notes && (
                    <div className={styles.field} style={{ gridColumn: 'span 12' }}>
                      <span className={styles.fieldLabel}>ملاحظات الموعد</span>
                      <div className={styles.fieldValue}>{scheduledAppointment.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={styles.block}>
              <div className={styles.blockTitle}>الردود السابقة</div>
              {responses.length ? (
                <div className={styles.consultationResponses}>
                  {responses.map((entry) => (
                    <article key={entry.id || entry.createdAt} className={styles.consultationResponse}>
                      <p>{entry.text || entry.message}</p>
                      <small>{displayDate(entry.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles.consultationEmpty}>لم يتم تسجيل ردود سابقة.</p>
              )}
            </div>

            <div className={styles.consultationActions}>
              <form className={styles.block} onSubmit={submitReply}>
                <label className={styles.consultationLabel} htmlFor="consultation-reply">
                  الرد على طلب الاستشارة
                </label>
                <p className={styles.consultationHint}>
                  يُحفظ الرد ضمن سجل الطلب؛ لا يوجد تكامل إرسال خارجي للمواطن في النظام الحالي.
                </p>
                <textarea
                  id="consultation-reply"
                  className={styles.consultationTextarea}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={4}
                  required
                  placeholder="اكتب الرد الذي سيُحفظ على هذا الطلب..."
                />
                <button type="submit" className={styles.submit} disabled={!reply.trim() || Boolean(busy)}>
                  حفظ الرد
                </button>
              </form>

              <form className={styles.block} onSubmit={submitAppointment}>
                <label className={styles.consultationLabel} htmlFor="consultation-appointment-type">
                  تحديد موعد للاستشارة
                </label>
                <div className={styles.consultationForm}>
                  <select
                    id="consultation-appointment-type"
                    className={styles.select}
                    value={appointment.type}
                    onChange={(event) => setAppointment((current) => ({ ...current, type: event.target.value }))}
                  >
                    <option value="zoom">جلسة عن بُعد (Zoom)</option>
                    <option value="office">زيارة داخل الشركة</option>
                  </select>
                  <input
                    className={styles.input}
                    type="datetime-local"
                    value={appointment.dateTime}
                    onChange={(event) => setAppointment((current) => ({ ...current, dateTime: event.target.value }))}
                    required
                    aria-label="تاريخ ووقت الموعد"
                  />
                  {appointment.type === 'zoom' ? (
                    <input
                      className={styles.input}
                      type="url"
                      value={appointment.zoomUrl}
                      onChange={(event) => setAppointment((current) => ({ ...current, zoomUrl: event.target.value }))}
                      placeholder="رابط جلسة Zoom"
                      required
                    />
                  ) : (
                    <input
                      className={styles.input}
                      type="text"
                      value={appointment.location}
                      onChange={(event) => setAppointment((current) => ({ ...current, location: event.target.value }))}
                      placeholder="مكان الزيارة داخل الشركة"
                      required
                    />
                  )}
                  <textarea
                    className={styles.consultationTextarea}
                    value={appointment.notes}
                    onChange={(event) => setAppointment((current) => ({ ...current, notes: event.target.value }))}
                    rows={2}
                    placeholder="ملاحظات إضافية (اختياري)"
                  />
                  <button type="submit" className={styles.submit} disabled={!appointment.dateTime || Boolean(busy)}>
                    حفظ الموعد
                  </button>
                </div>
              </form>
            </div>

            {message && (
              <p className={`${styles.consultationMessage} ${message.type === 'error' ? styles.consultationMessageError : ''}`} role="status">
                {message.text}
              </p>
            )}
          </section>
      )}

      {preview && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setPreview(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label={preview.title} onClick={(event) => event.stopPropagation()}>
            <header className={styles.modalHead}>
              <strong>{preview.title}</strong>
              <div className={styles.detailHeaderActions}>
                <a className={styles.outlineBtn} href={preview.url} download={preview.fileName}>تحميل الملف</a>
                <button type="button" className={styles.iconBtn} onClick={() => setPreview(null)} aria-label="إغلاق المعاينة">
                  <ConsultationIcon name="close" />
                </button>
              </div>
            </header>
            {preview.fileType?.startsWith('image/') || preview.fileType === 'application/pdf' ? (
              <iframe title={preview.title} src={preview.url} className={styles.modalFrame} />
            ) : (
              <div className={styles.modalPlaceholder}>
                <p>هذا النوع من الملفات لا يدعم المعاينة داخل الصفحة.</p>
                <small>استخدم زر «تحميل الملف» لفتحه على جهازك.</small>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
