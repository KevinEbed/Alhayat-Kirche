/* ═══════════════════════════════════════════════
   Al Hayat Kirche — Frontend Application
   ES6+ · Fetch API · SPA Router
═══════════════════════════════════════════════ */

const API = '';  // same origin

// ── State ─────────────────────────────────────
const state = {
  lang: localStorage.getItem('lang') || 'de',
  content: null,
  events: [],
  gallery: [],
  videos: [],
  calDate: new Date(),
  selectedDate: null,
  lightboxImages: [],
  lightboxIndex: 0,
  currentAlbum: null,
  focusedEventId: null,
};

// ── i18n strings ──────────────────────────────
const i18n = {
  de: {
    nav_home: 'Startseite',
    nav_vision: 'Unsere Selbstverständnis',
    nav_events: 'Kalender',
    nav_children: 'Kinderdienste',
    nav_gallery: 'Galerie',
    nav_videos: 'Videos',
    nav_about: 'Geschichte',
    nav_contact: 'Kontakt',
    see_calendar: 'Alle Termine ansehen',
    events_sub: 'Unsere Veranstaltungen und Gottesdienste',
    gallery_sub: 'Momente aus unserem Gemeindeleben',
    videos_sub: 'Predigten und Veranstaltungen',
    no_images: 'Noch keine Bilder vorhanden.',
    no_videos: 'Noch keine Videos vorhanden.',
    recurring_events: 'Wiederkehrende Veranstaltungen',
    all_albums: 'Alle',
    days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    no_events: 'Keine Veranstaltungen an diesem Tag',
    weekly: 'Wöchentlich',
    recurring_badge: 'Wiederkehrend',
    main_event_label: 'Wöchentlicher Gottesdienst',
    main_event_text: 'Jeden Sonntag · 10:30 – 12:30 Uhr',
    open_in_maps: 'In Google Maps öffnen',
    welcome_title: 'Herzlich Willkommen',
    welcome_text: 'Wir freuen uns, Sie in unserer Gemeinschaft begrüßen zu dürfen.',
    services_title: 'Gottesdienste & Termine',
    services_subtitle: 'Wir laden Sie herzlich ein, uns zu besuchen',
    hero_cta: 'Mehr erfahren',
    hero_verse_ref: 'Joh. 10:10',
    phone_display: '+49 1781 131477',
    footer_address_label: 'Adresse',
    footer_phone_label: 'Telefon',
    footer_email_label: 'E-Mail',
    footer_bank_label: 'Bankverbindung',
    footer_bank_name: 'Alhayat Kirche Lünen',
    footer_copy_text: '© 2024 Al Hayat Kirche Lünen. Alle Rechte vorbehalten.',
    special_events_title: 'Besondere Veranstaltungen',
    nav_media: 'Medien',
    media_sub: 'Fotos und Videos aus unserem Gemeindeleben',
    media_filter_all: 'Alle',
    media_filter_images: 'Fotos',
    media_filter_videos: 'Videos',
  },
  ar: {
    nav_home: 'الصفحة الرئسية',
    nav_vision: 'مفاهيم و توجوهات الكنيسة',
    nav_events: 'مواعيد الاجتماعات',
    nav_children: 'خدمة الاطفال',
    nav_gallery: 'ألبوم الصور',
    nav_videos: 'فيديوهات',
    nav_about: 'عن كنيسة الحياة',
    nav_contact: 'اتصل بنا',
    see_calendar: 'عرض جميع المواعيد',
    events_sub: 'فعالياتنا واجتماعاتنا',
    gallery_sub: 'لحظات من حياة كنيستنا',
    videos_sub: 'عظات وفعاليات',
    no_images: 'لا توجد صور بعد.',
    no_videos: 'لا توجد مقاطع فيديو بعد.',
    recurring_events: 'الفعاليات الأسبوعية المتكررة',
    all_albums: 'الكل',
    days: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    weekdays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    no_events: 'لا توجد فعاليات في هذا اليوم',
    weekly: 'أسبوعياً',
    recurring_badge: 'متكرر',
    main_event_label: 'اجتماع أسبوعي',
    main_event_text: 'كل أحد · ١٠:٣٠ – ١٢:٣٠',
    open_in_maps: 'فتح في خرائط Google',
    welcome_title: 'أهلاً وسهلاً بكم',
    welcome_text: 'يسعدنا الترحيب بكم في مجتمعنا.',
    services_title: 'الاجتماعات والمواعيد',
    services_subtitle: 'ندعوكم بحرارة لزيارتنا',
    hero_cta: 'اعرف المزيد',
    hero_verse_ref: 'يوحنا ١٠‏:١٠',
    phone_display: '+٤٩ ١٧٨١ ١٣١٤٧٧',
    footer_address_label: 'العنوان',
    footer_phone_label: 'الهاتف',
    footer_email_label: 'البريد الإلكتروني',
    footer_bank_label: 'الحساب البنكي',
    footer_bank_name: 'كنيسة الحياة - لونن',
    footer_copy_text: '© 2024 كنيسة الحياة لونن. جميع الحقوق محفوظة.',
    special_events_title: 'مناسبات خاصة',
    nav_media: 'صور و فيديوهات',
    media_sub: 'صور ومقاطع فيديو من حياة كنيستنا',
    media_filter_all: 'الكل',
    media_filter_images: 'صور',
    media_filter_videos: 'فيديوهات',
  }
};

function t(key) {
  return i18n[state.lang]?.[key] || key;
}

// ── BroadcastChannel for admin ↔ main sync ────
let channel = null;
try {
  channel = new BroadcastChannel('alhayat-sync');
  channel.onmessage = (e) => {
    if (e.data && e.data.type === 'content-updated') {
      // Re-fetch all data when admin makes changes
      loadAllData().then(() => renderAll());
    }
  };
} catch (err) {
  // BroadcastChannel not supported — fall back to storage event
  window.addEventListener('storage', (e) => {
    if (e.key === 'alhayat-data-updated') {
      loadAllData().then(() => renderAll());
    }
  });
}

// ── Init ──────────────────────────────────────
async function init() {
  // Apply language FIRST to set dir, lang attr, and switcher display
  applyLang(state.lang, false);
  // Load data from API
  await loadAllData();
  // NOW render everything with the loaded data
  renderAll();
  // Setup interactions
  setupRouter();
  setupNavbar();
  setupLangSwitcher();
  setupMediaFilters();
  setupLightbox();
  setupVideoModal();
  setupScrollAnimations();
  // Navigate to current hash page
  navigateTo(getHashPage());
}

async function loadAllData() {
  try {
    const [content, events, gallery, videos] = await Promise.all([
      fetch(`${API}/api/content`).then(r => r.json()),
      fetch(`${API}/api/events`).then(r => r.json()),
      fetch(`${API}/api/gallery`).then(r => r.json()),
      fetch(`${API}/api/videos`).then(r => r.json()),
    ]);
    state.content = content;
    state.events = events;
    state.gallery = gallery;
    state.videos = videos;
  } catch (e) {
    console.warn('Could not reach API, using demo mode', e);
    state.content = {};
    state.events = getDemoEvents();
    state.gallery = [];
    state.videos = [];
  }
}

// ── Language ──────────────────────────────────
function applyLang(lang, reload = true) {
  state.lang = lang;
  localStorage.setItem('lang', lang);

  // Set document language and direction
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Force nav-container direction (keeps logo on correct side)
  // .nav-links must NOT get row-reverse — in RTL, flex row already flows right→left
  const navContainer = document.querySelector('.nav-container');
  if (navContainer) navContainer.style.flexDirection = lang === 'ar' ? 'row-reverse' : '';

  // Sync the language switcher button text
  const langCurrentEl = document.getElementById('langCurrent');
  if (langCurrentEl) {
    langCurrentEl.textContent = lang === 'ar' ? 'AR العربية' : 'DE Deutsch';
  }

  // Update the hero eyebrow text based on language
  const eyebrow = document.querySelector('.hero-eyebrow');
  if (eyebrow) {
    eyebrow.textContent = lang === 'ar' ? 'مرحباً بكم في' : 'Willkommen bei';
  }

  if (reload) {
    // Fade out → swap content → fade back in
    const main = document.getElementById('main');
    if (main) {
      main.style.cssText = 'opacity:0;transform:translateY(6px);transition:opacity 0.15s ease,transform 0.15s ease;pointer-events:none;';
      setTimeout(() => {
        renderAll();
        observeScrollTargets();
        main.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity 0.22s ease,transform 0.22s ease;pointer-events:none;';
        setTimeout(() => { main.style.cssText = ''; }, 240);
      }, 160);
    } else {
      renderAll();
    }
  }
}

function setupLangSwitcher() {
  const btn = document.getElementById('langBtn');
  const dropdown = document.getElementById('langDropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown.classList.remove('open'));
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      applyLang(opt.dataset.lang);
      dropdown.classList.remove('open');
    });
  });
}

// ── Render All ────────────────────────────────
function renderAll() {
  renderI18nKeys();
  renderContentFields();
  renderHomeServices();
  renderCalendar();
  renderRecurringEvents();
  renderSpecialEvents();
  renderMedia();
  renderCustomSections();
}

function renderI18nKeys() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    el.textContent = t(key);
  });
}

function renderContentFields() {
  if (!state.content) return;
  document.querySelectorAll('[data-content]').forEach(el => {
    const fullPath = el.dataset.content;
    const parts = fullPath.split('.');
    if (parts.length < 2) return;
    const page = parts[0];
    const field = parts[1];
    const pageContent = state.content[page]?.[state.lang];
    // Only overwrite if the API returned a non-empty value — preserves HTML fallback text
    if (pageContent && pageContent[field] !== undefined && pageContent[field] !== '') {
      el.textContent = pageContent[field];
    }
  });
}

// ── Home Services ─────────────────────────────
function renderHomeServices() {
  const grid = document.getElementById('homeServicesGrid');
  if (!grid) return;
  const recurring = state.events.filter(e => e.recurring);
  if (!recurring.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = recurring.map(ev => {
    const title = ev[`title_${state.lang}`] || ev.title_de;
    const desc = ev[`description_${state.lang}`] || '';
    const day = t('weekdays')[ev.recurringDay] || '';
    return `<div class="service-card" data-event-id="${ev.id}">
      <div class="service-day">${day}</div>
      <div class="service-title">${title}</div>
      <div class="service-time">${ev.time}${ev.endTime ? ' – ' + ev.endTime : ''}</div>
      ${desc ? `<p style="font-size:0.82rem;color:var(--text-muted);margin-top:8px">${desc}</p>` : ''}
    </div>`;
  }).join('');

  grid.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => navigateToEventDetail(card.dataset.eventId));
  });
}

// Navigate to events page and highlight/focus a specific event
function navigateToEventDetail(evId) {
  state.focusedEventId = evId;
  navigateTo('events');
  history.pushState(null, '', '#events');
  // Wait for page to be visible before scrolling/highlighting
  setTimeout(() => {
    renderRecurringEvents();
    const card = document.getElementById('event-' + evId);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Also select the next upcoming date on the calendar
    const ev = state.events.find(e => e.id === evId);
    if (ev && ev.recurring) {
      const today = new Date();
      let daysUntil = (ev.recurringDay - today.getDay() + 7) % 7;
      if (daysUntil === 0) daysUntil = 7; // always show NEXT occurrence, not today
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntil);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      state.calDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
      state.selectedDate = dateStr;
      renderCalendar();
      renderDayEvents(dateStr);
    }
  }, 50);
}

// ── Calendar ──────────────────────────────────
function renderCalendar() {
  const d = state.calDate;
  const year = d.getFullYear();
  const month = d.getMonth();

  document.getElementById('calMonthLabel').textContent =
    `${t('months')[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = '';
  // Day headers
  const days = t('days');
  days.forEach(d => {
    html += `<div class="cal-day-header">${d}</div>`;
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDate = new Date(year, month, day);
    const isToday = today.toDateString() === dayDate.toDateString();
    const isSelected = state.selectedDate === dateStr;

    const dayEvents = getEventsForDay(dayDate);
    const dotHtml = dayEvents.slice(0, 3).map(ev => {
      const title = ev[`title_${state.lang}`] || ev.title_de;
      return `<div class="cal-event-dot" style="background:${ev.color || 'var(--green-medium)'}">${title}</div>`;
    }).join('');

    html += `<div class="cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}" data-date="${dateStr}">
      <div class="cal-day-num">${day}</div>
      ${dotHtml}
    </div>`;
  }

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = html;

  // Click events
  grid.querySelectorAll('.cal-day:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => {
      state.selectedDate = cell.dataset.date;
      renderCalendar();
      renderDayEvents(cell.dataset.date);
    });
  });

  // Nav buttons
  document.getElementById('calPrev').onclick = () => {
    state.calDate = new Date(year, month - 1, 1);
    renderCalendar();
  };
  document.getElementById('calNext').onclick = () => {
    state.calDate = new Date(year, month + 1, 1);
    renderCalendar();
  };
}

function getEventsForDay(date) {
  const dayOfWeek = date.getDay();
  // Use local year/month/day — toISOString() shifts to UTC and causes off-by-one
  // errors in timezones ahead of UTC (e.g. Germany UTC+1/+2), making the start
  // date appear one day too early and excluding it from the range.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  return state.events.filter(ev => {
    if (ev.recurring) return ev.recurringDay === dayOfWeek;
    const start = (ev.startDate || ev.date || '').slice(0, 10);
    const end   = (ev.endDate   || '').slice(0, 10) || start; // empty endDate = same as start (single-day)
    if (!start) return false;
    // Inclusive range: start <= dateStr <= end
    return dateStr >= start && dateStr <= end;
  });
}

function renderDayEvents(dateStr) {
  const sidebar = document.getElementById('eventsSidebar');
  const listEl = document.getElementById('dayEventsList');
  const labelEl = document.getElementById('selectedDateLabel');
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = t('weekdays')[date.getDay()];
  const dateFormatted = `${dayName}, ${date.getDate()}. ${t('months')[date.getMonth()]}`;
  labelEl.textContent = dateFormatted;

  const events = getEventsForDay(date);
  if (!events.length) {
    listEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem">${t('no_events')}</p>`;
  } else {
    listEl.innerHTML = events.map(ev => {
      const title = ev[`title_${state.lang}`] || ev.title_de;
      const desc = ev[`description_${state.lang}`] || '';
      const isSpecial = ev.type === 'special';
      return `<div class="day-event-item${isSpecial ? ' day-event-special' : ''}">
        ${isSpecial && ev.imageUrl ? `<img class="day-event-img" src="${ev.imageUrl}" alt="${title}" loading="lazy"/>` : ''}
        <div class="day-event-title">${title}</div>
        <div class="day-event-time">${ev.time || ''}${ev.endTime ? ' – ' + ev.endTime : ''}</div>
        ${desc ? `<div class="day-event-desc">${desc}</div>` : ''}
      </div>`;
    }).join('');
  }
  sidebar.style.display = 'block';
}

function renderRecurringEvents() {
  const list = document.getElementById('recurringList');
  if (!list) return;
  const recurring = state.events.filter(e => e.recurring);
  list.innerHTML = recurring.map(ev => {
    const title = ev[`title_${state.lang}`] || ev.title_de;
    const desc = ev[`description_${state.lang}`] || '';
    const day = t('weekdays')[ev.recurringDay] || '';
    const highlighted = state.focusedEventId === ev.id ? ' event-card-highlighted' : '';
    return `<div class="event-card${highlighted}" id="event-${ev.id}">
      <div class="event-color-bar" style="background:${ev.color || 'var(--green-medium)'}"></div>
      <div class="event-body">
        <div class="event-title">${title}</div>
        <div class="event-meta">${day} · ${ev.time}${ev.endTime ? ' – ' + ev.endTime : ''} · <span style="color:var(--green-medium)">${t('recurring_badge')}</span></div>
        ${desc ? `<div class="event-desc">${desc}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  // Clicking an event card scrolls the calendar to the next upcoming date for that event
  list.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => {
      const evId = card.id.replace('event-', '');
      const ev = state.events.find(e => e.id === evId);
      if (!ev || !ev.recurring) return;
      state.focusedEventId = evId;
      renderRecurringEvents();
      const today = new Date();
      let daysUntil = (ev.recurringDay - today.getDay() + 7) % 7;
      if (daysUntil === 0) daysUntil = 7;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntil);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      state.calDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
      state.selectedDate = dateStr;
      renderCalendar();
      renderDayEvents(dateStr);
      document.querySelector('.calendar-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── Special Events ───────────────────────────
function renderSpecialEvents() {
  const section = document.getElementById('specialEventsSection');
  const container = document.getElementById('specialEventsList');
  if (!section || !container) return;

  // Use local date (not toISOString/UTC) to avoid off-by-one in UTC+1/+2 timezones
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const specials = state.events
    .filter(e => {
      if (e.type !== 'special') return false;
      const start = e.startDate || e.date || '';
      const end   = (e.endDate && e.endDate !== e.startDate) ? e.endDate : start;
      return end >= today; // disappears the day after it ends
    })
    .sort((a, b) => {
      const aDate = a.startDate || a.date || '';
      const bDate = b.startDate || b.date || '';
      return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
    });

  if (!specials.length) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  // Update heading via i18n
  const heading = section.querySelector('.section-label');
  if (heading) heading.textContent = t('special_events_title');

  container.innerHTML = specials.map(ev => {
    const title = ev[`title_${state.lang}`] || ev.title_de || '';
    const desc  = ev[`description_${state.lang}`] || '';
    const startStr = ev.startDate || ev.date || '';
    const endStr   = ev.endDate && ev.endDate !== ev.startDate ? ev.endDate : '';
    const fmt = (s) => {
      if (!s) return '';
      const d = new Date(s + 'T00:00:00');
      return `${d.getDate()}. ${t('months')[d.getMonth()]} ${d.getFullYear()}`;
    };
    const dateLine = startStr
      ? (endStr ? `${fmt(startStr)} – ${fmt(endStr)}` : fmt(startStr))
      : '';
    return `<div class="special-event-card${ev.imageUrl ? ' special-event-card--clickable' : ''}" ${ev.imageUrl ? `data-img="${ev.imageUrl}"` : ''}>
      ${ev.imageUrl ? `<div class="special-event-img-wrap"><img src="${ev.imageUrl}" alt="${title}" loading="lazy"/></div>` : ''}
      <div class="special-event-body">
        ${dateLine ? `<div class="special-event-date">${dateLine}</div>` : ''}
        <div class="special-event-title">${title}</div>
        ${ev.time ? `<div class="special-event-time">${ev.time}${ev.endTime ? ' – ' + ev.endTime : ''} Uhr</div>` : ''}
        ${desc ? `<div class="special-event-desc">${desc}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  // Clicking anywhere on the card opens the poster in the lightbox
  container.querySelectorAll('.special-event-card--clickable').forEach(card => {
    card.addEventListener('click', () => {
      state.lightboxImages = [card.dataset.img];
      openLightbox(0);
    });
  });
}

// ── Media (unified Photos + Videos) ──────────
let _mediaFilter = 'all'; // 'all' | 'images' | 'videos'

function setupMediaFilters() {
  document.querySelectorAll('.media-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _mediaFilter = btn.dataset.filter;
      document.querySelectorAll('.media-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyMediaFilter();
    });
  });
}

function applyMediaFilter() {
  const imgSection = document.getElementById('mediaImagesSection');
  const vidSection = document.getElementById('mediaVideosSection');
  if (!imgSection || !vidSection) return;
  imgSection.style.display = (_mediaFilter === 'all' || _mediaFilter === 'images') ? '' : 'none';
  vidSection.style.display = (_mediaFilter === 'all' || _mediaFilter === 'videos') ? '' : 'none';
}

function renderMedia() {
  renderGallery();
  renderVideos();
  applyMediaFilter();
}

// ── Gallery ───────────────────────────────────
function renderGallery() {
  const tabsEl = document.getElementById('albumTabs');
  const gridEl = document.getElementById('galleryGrid');
  const emptyEl = document.getElementById('galleryEmpty');
  if (!tabsEl || !gridEl) return;

  if (!state.gallery.length) {
    tabsEl.innerHTML = '';
    gridEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  // Tabs
  let allTab = `<button class="album-tab${!state.currentAlbum ? ' active' : ''}" data-album="">${t('all_albums')}</button>`;
  const albumTabs = state.gallery.map(a => {
    const title = a[`title_${state.lang}`] || a.title_de;
    const active = state.currentAlbum === a.id ? ' active' : '';
    return `<button class="album-tab${active}" data-album="${a.id}">${title}</button>`;
  }).join('');
  tabsEl.innerHTML = allTab + albumTabs;

  tabsEl.querySelectorAll('.album-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.currentAlbum = tab.dataset.album || null;
      renderGallery();
    });
  });

  // Images
  let images = [];
  const albums = state.currentAlbum
    ? state.gallery.filter(a => a.id === state.currentAlbum)
    : state.gallery;

  albums.forEach(album => {
    album.images.forEach(img => {
      images.push({ ...img, albumTitle: album[`title_${state.lang}`] || album.title_de });
    });
  });

  state.lightboxImages = images.map(i => i.url);

  if (!images.length) {
    gridEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    gridEl.innerHTML = images.map((img, idx) =>
      `<div class="gallery-item" data-index="${idx}">
        <img src="${img.url}" alt="${img.albumTitle}" loading="lazy" />
      </div>`
    ).join('');

    gridEl.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => openLightbox(parseInt(item.dataset.index)));
    });
  }
}

// ── Videos ────────────────────────────────────
function renderVideos() {
  const grid = document.getElementById('videoGrid');
  const empty = document.getElementById('videoEmpty');
  if (!grid) return;

  if (!state.videos.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = state.videos.map(v => {
    const title = v[`title_${state.lang}`] || v.title_de || 'Video';
    const desc = v[`description_${state.lang}`] || v.description_de || '';
    return `<div class="video-card" data-url="${v.url}">
      <div class="video-thumb">
        <video src="${v.url}" preload="metadata"></video>
        <div class="video-play-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${title}</div>
        ${desc ? `<div class="video-desc">${desc}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', () => openVideoModal(card.dataset.url));
  });
}

// ── Lightbox ──────────────────────────────────
function setupLightbox() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => {
    state.lightboxIndex = (state.lightboxIndex - 1 + state.lightboxImages.length) % state.lightboxImages.length;
    document.getElementById('lightboxImg').src = state.lightboxImages[state.lightboxIndex];
  });
  document.getElementById('lightboxNext').addEventListener('click', () => {
    state.lightboxIndex = (state.lightboxIndex + 1) % state.lightboxImages.length;
    document.getElementById('lightboxImg').src = state.lightboxImages[state.lightboxIndex];
  });
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
  });
}

function openLightbox(idx) {
  state.lightboxIndex = idx;
  document.getElementById('lightboxImg').src = state.lightboxImages[idx];
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Hide nav arrows when only one image (e.g. event poster)
  const single = state.lightboxImages.length <= 1;
  document.getElementById('lightboxPrev').style.display = single ? 'none' : '';
  document.getElementById('lightboxNext').style.display = single ? 'none' : '';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Video Modal ───────────────────────────────
function setupVideoModal() {
  document.getElementById('videoModalClose').addEventListener('click', closeVideoModal);
  document.getElementById('videoModalOverlay').addEventListener('click', closeVideoModal);
}

function openVideoModal(url) {
  const video = document.getElementById('modalVideo');
  video.src = url;
  document.getElementById('videoModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  video.play().catch(() => { });
}

function closeVideoModal() {
  const video = document.getElementById('modalVideo');
  video.pause(); video.src = '';
  document.getElementById('videoModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Router ────────────────────────────────────
const pages = ['home', 'vision', 'events', 'children', 'media', 'about', 'contact'];

function setupRouter() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const page = href.slice(1);
        navigateTo(page);
        history.pushState(null, '', `#${page}`);
        // Close mobile menu
        document.getElementById('navLinks').classList.remove('open');
      }
    });
  });
  window.addEventListener('popstate', () => navigateTo(getHashPage()));
}

function getHashPage() {
  const hash = location.hash.slice(1);
  return pages.includes(hash) ? hash : 'home';
}

function navigateTo(page) {
  if (!pages.includes(page)) page = 'home';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(page);
  if (pageEl) {
    pageEl.classList.add('active');
    // Reset scroll animations so they replay on every visit (not just first load)
    resetScrollAnimations(pageEl);
  }
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${page}`);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Strip animate-on-scroll state from a page so elements re-animate next visit
function resetScrollAnimations(pageEl) {
  if (!_scrollObserver) return;
  SCROLL_SELECTORS.forEach(sel => {
    pageEl.querySelectorAll(sel).forEach(el => {
      el.classList.remove('animate-on-scroll', 'is-visible');
    });
  });
  // Two rAF frames: first lets display:block take effect, second lets layout settle
  requestAnimationFrame(() => requestAnimationFrame(() => observeScrollTargets()));
}

// ── Navbar ────────────────────────────────────
function setupNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });
}

// ── Scroll animations ────────────────────────
const SCROLL_SELECTORS = [
  '.page-hero',
  '.section-header',
  '.welcome-text',
  '.services-grid',
  '.contact-grid',
  '.contact-map',
  '.custom-section',
];

let _scrollObserver = null;

function observeScrollTargets() {
  if (!_scrollObserver) return;
  SCROLL_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.classList.contains('animate-on-scroll')) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      el.classList.add('animate-on-scroll');
      if (inView) {
        el.classList.add('is-visible');
      } else {
        _scrollObserver.observe(el);
      }
    });
  });
}

function setupScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  _scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        _scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -24px 0px' });

  observeScrollTargets();
}

// ── Demo data (when API is offline) ───────────
function getDemoEvents() {
  return [
    { id: '1', title_de: 'Gottesdienst', title_ar: 'اجتماع الأحد', time: '10:30', endTime: '12:30', recurring: true, recurringDay: 0, color: '#2e7d32', description_de: 'Wöchentlicher Gottesdienst für die ganze Familie', description_ar: 'اجتماع أسبوعي للعائلة بأكملها' },
    { id: '2', title_de: 'Morgen-Gebet', title_ar: 'صلاة الصباح', time: '07:30', endTime: '08:30', recurring: true, recurringDay: 3, color: '#558b2f', description_de: 'Wöchentliches Morgengebet', description_ar: 'صلاة صباحية أسبوعية' },
    { id: '3', title_de: 'Jugendtreff', title_ar: 'لقاء الشباب', time: '18:00', endTime: '19:30', recurring: true, recurringDay: 5, color: '#7cb342', description_de: 'Wöchentliches Jugendtreffen', description_ar: 'لقاء أسبوعي للشباب' },
    { id: '4', title_de: 'Bibelstunde', title_ar: 'درس الكتاب المقدس', time: '19:30', endTime: '21:30', recurring: true, recurringDay: 5, color: '#33691e', description_de: 'Wöchentliche Bibelstunde', description_ar: 'دراسة أسبوعية للكتاب المقدس' },
  ];
}

// ── Custom Sections ─────────────────────────────
function renderCustomSections() {
  if (!state.content) return;
  ['home', 'vision', 'events', 'children', 'gallery', 'videos', 'about', 'contact'].forEach(page => {
    let container = document.getElementById(`${page}-custom-sections`);
    if (!container) {
      const pageEl = document.getElementById(page);
      if (!pageEl) return;
      container = document.createElement('div');
      container.className = 'section custom-sections-wrapper';
      container.id = `${page}-custom-sections`;
      pageEl.appendChild(container);
    }
    const sections = state.content[page]?.custom_sections || [];
    if (!sections.length) { container.innerHTML = ''; return; }
    container.innerHTML = '<div class="container content-narrow">' + sections.map(s => {
      if (s.type === 'text') {
        const text = s[`content_${state.lang}`] || s.content_de || '';
        return text ? `<div class="custom-section custom-section-text" data-section-id="${s.id}" data-section-type="text"><p class="body-text">${text}</p></div>` : '';
      }
      if (s.type === 'image') {
        if (!s.url) return '';
        const cap = s[`caption_${state.lang}`] || s.caption_de || '';
        return `<div class="custom-section custom-section-image" data-section-id="${s.id}" data-section-type="image"><img src="${s.url}" alt="${cap}" loading="lazy"/>${cap ? `<p class="custom-section-caption">${cap}</p>` : ''}</div>`;
      }
      if (s.type === 'video') {
        if (!s.url) return '';
        const title = s[`title_${state.lang}`] || s.title_de || 'Video';
        return `<div class="custom-section custom-section-video" data-section-id="${s.id}" data-section-type="video"><div class="video-card" data-url="${s.url}"><div class="video-thumb"><video src="${s.url}" preload="metadata"></video><div class="video-play-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg></div></div><div class="video-info"><div class="video-title">${title}</div></div></div></div>`;
      }
      return '';
    }).join('') + '</div>';
    container.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', () => openVideoModal(card.dataset.url));
    });
  });
}

// ── Admin builder iframe communication ────────
window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'navigate' && e.data.page) {
    navigateTo(e.data.page);
    // Re-attach edit handlers after page switch
    if (document.body.classList.contains('editing-mode')) {
      setTimeout(attachEditHandlers, 100);
    }
  }
  if (e.data.type === 'enter-edit-mode') {
    enableEditMode();
  }
  if (e.data.type === 'highlight-section' && e.data.id) {
    highlightSection(e.data.id);
  }
  if (e.data.type === 'reload-data') {
    loadAllData().then(() => {
      renderAll();
      if (document.body.classList.contains('editing-mode')) {
        setTimeout(attachEditHandlers, 100);
      }
    });
  }
});

function enableEditMode() {
  document.body.classList.add('editing-mode');
  attachEditHandlers();
  // Watch for new sections rendered after page navigation
  if (!window._editObserver) {
    window._editObserver = new MutationObserver(() => attachEditHandlers());
    const main = document.getElementById('main');
    if (main) window._editObserver.observe(main, { childList: true, subtree: true });
  }
}

function attachEditHandlers() {
  document.querySelectorAll('.custom-section:not([data-edit-attached])').forEach(el => {
    el.setAttribute('data-edit-attached', '1');
    el.addEventListener('mouseenter', () => el.classList.add('sec-hover'));
    el.addEventListener('mouseleave', () => el.classList.remove('sec-hover'));
    el.addEventListener('click', (evt) => {
      const sid = el.dataset.sectionId;
      if (!sid) return;
      evt.preventDefault();
      evt.stopPropagation();
      document.querySelectorAll('.custom-section').forEach(s => s.classList.remove('sec-active'));
      el.classList.add('sec-active');
      window.parent.postMessage({ type: 'section-clicked', id: sid }, '*');
    });
  });
}

function highlightSection(id) {
  document.querySelectorAll('.custom-section').forEach(el => {
    const match = el.dataset.sectionId === id;
    el.classList.toggle('sec-active', match);
    if (match) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// ── Start ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
