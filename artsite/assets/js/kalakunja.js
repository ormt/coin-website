/* ============================================================
   कलाकुञ्ज · Kalakunja Art House — shared data layer + UI kit
   No build step, no dependencies. Works from file:// as well as
   from GitHub Pages. All state lives in localStorage so the
   commission → dispatch → delivery loop is fully demonstrable.
   ============================================================ */
(function (global) {
  'use strict';

  /* ── 0. Storage (localStorage with in-memory fallback) ──── */
  var memory = {};
  var hasLS = (function () {
    try { window.localStorage.setItem('__kk', '1'); window.localStorage.removeItem('__kk'); return true; }
    catch (e) { return false; }
  })();
  function readRaw(k) { return hasLS ? window.localStorage.getItem(k) : (memory[k] || null); }
  function writeRaw(k, v) { if (hasLS) { window.localStorage.setItem(k, v); } else { memory[k] = v; } }
  function readJSON(k, fallback) {
    try { var v = readRaw(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function writeJSON(k, v) { writeRaw(k, JSON.stringify(v)); }

  var KEY_ORDERS = 'kk.orders.v1';
  var KEY_ARTISTS = 'kk.artists.v1';

  /* ── 1. Catalogue ───────────────────────────────────────── */

  // Traditions we take commissions in. `mult` scales the base price.
  var STYLES = [
    { id: 'paubha',   name: 'Paubha',            deva: 'पौभा',       glyph: '🪷',
      mult: 1.65, complexity: 3, atelier: 'Paubha Atelier',
      blurb: 'Sacred Newar scroll painting of the Kathmandu Valley — mineral pigments, 24k gold detailing, iconographic grids drawn by hand.' },
    { id: 'thangka',  name: 'Thangka',           deva: 'थान्का',     glyph: '☸️',
      mult: 1.7,  complexity: 3, atelier: 'Thangka Atelier',
      blurb: 'Himalayan Buddhist scroll painting with brocade mount. Deity proportions follow the traditional iconometric measure.' },
    { id: 'mithila',  name: 'Mithila / Madhubani', deva: 'मिथिला',   glyph: '🐟',
      mult: 1.15, complexity: 2, atelier: 'Mithila Atelier',
      blurb: 'Line-dense folk painting from the Terai — natural dyes, kachni and bharni fill work, motifs of fish, peacock and lotus.' },
    { id: 'portrait', name: 'Portrait & Likeness', deva: 'चित्र',    glyph: '👤',
      mult: 1.25, complexity: 2, atelier: 'Portrait Studio',
      blurb: 'Hand-painted likeness from your photographs — single subject, couple, family group or a remembrance portrait.' },
    { id: 'landscape',name: 'Himalayan Landscape', deva: 'हिमाल',    glyph: '🏔️',
      mult: 1.0,  complexity: 1, atelier: 'Landscape Studio',
      blurb: 'Ranges, valleys, temple squares and trail scenes — from Machhapuchhre at dawn to a Patan courtyard in monsoon light.' },
    { id: 'mural',    name: 'Mural & Wall Work',  deva: 'भित्तेचित्र', glyph: '🧱',
      mult: 1.45, complexity: 3, atelier: 'Mural Unit',
      blurb: 'On-site wall painting for cafés, hotels, schools and homes. Surveyed, primed, painted and sealed by our mural unit.' },
    { id: 'modern',   name: 'Contemporary',       deva: 'समकालीन',   glyph: '🎨',
      mult: 1.1,  complexity: 2, atelier: 'Contemporary Studio',
      blurb: 'Abstract, semi-abstract and mixed-media work developed to your brief, palette and room.' },
    { id: 'calligraphy', name: 'Ranjana Calligraphy', deva: 'रञ्जना', glyph: '🖋️',
      mult: 1.2,  complexity: 2, atelier: 'Lipi Desk',
      blurb: 'Ranjana, Devanagari and Lantsa lettering — mantras, names, dates and blessings, gilded or in single ink.' }
  ];

  // Base price in Nepali rupees, before style / medium / finish multipliers.
  var SIZES = [
    { id: 'xs', label: 'Small',      dims: '20 × 25 cm',  base: 9000 },
    { id: 'sm', label: 'Medium',     dims: '30 × 45 cm',  base: 18000 },
    { id: 'md', label: 'Large',      dims: '60 × 90 cm',  base: 38000 },
    { id: 'lg', label: 'Extra Large',dims: '90 × 120 cm', base: 72000 },
    { id: 'xl', label: 'Wall Scale', dims: '150 cm +',    base: 140000 }
  ];

  var MEDIUMS = [
    { id: 'mineral', label: 'Stone-ground mineral pigment', sub: 'Traditional; on primed cotton', mult: 1.35 },
    { id: 'acrylic', label: 'Acrylic on canvas',            sub: 'Durable, vivid, low upkeep',    mult: 1.0 },
    { id: 'oil',     label: 'Oil on canvas',                sub: 'Deep blending, longer cure',    mult: 1.2 },
    { id: 'water',   label: 'Watercolour on lokta paper',   sub: 'Handmade Nepali paper',         mult: 0.9 },
    { id: 'ink',     label: 'Ink & wash',                   sub: 'Line-led, monochrome or tinted',mult: 0.8 },
    { id: 'wall',    label: 'Wall paint (on site)',         sub: 'Mural unit, surveyed first',    mult: 1.15 }
  ];

  var FINISHES = [
    { id: 'standard', label: 'Studio finish',   sub: 'Clean, confident, gallery-ready',            mult: 1.0,  skill: 1 },
    { id: 'fine',     label: 'Fine detail',     sub: 'Dense ornament, layered shading',            mult: 1.3,  skill: 2 },
    { id: 'museum',   label: 'Museum grade',    sub: 'Gold work, archival ground, senior hand',    mult: 1.75, skill: 3 }
  ];

  var TIMELINES = [
    { id: 'relaxed',  label: 'Relaxed',  sub: '8–10 weeks', mult: 0.95, days: 63 },
    { id: 'standard', label: 'Standard', sub: '5–6 weeks',  mult: 1.0,  days: 38 },
    { id: 'priority', label: 'Priority', sub: '3 weeks',    mult: 1.25, days: 21 },
    { id: 'express',  label: 'Express',  sub: '10 days',    mult: 1.6,  days: 10 }
  ];

  var EXTRAS = [
    { id: 'frame',   label: 'Hand-carved wooden frame', sub: 'Bhaktapur workshop, sal wood', price: 12000 },
    { id: 'brocade', label: 'Silk brocade mount',       sub: 'Traditional thangka mount',    price: 15000 },
    { id: 'gold',    label: '24k gold line work',       sub: 'Applied over finished paint',  price: 22000 },
    { id: 'crate',   label: 'Export crating + shipping',sub: 'Insured, door to door',        price: 18000 }
  ];

  // Commission pipeline, in order. `client` is the wording the client sees.
  var STAGES = [
    { id: 'received',  label: 'Brief received',   client: 'Brief received',            deva: 'प्राप्त' },
    { id: 'review',    label: 'Brief review',     client: 'Studio reviewing the brief',deva: 'समीक्षा' },
    { id: 'assigned',  label: 'Assigned to hand', client: 'Assigned to a studio hand', deva: 'सुम्पिएको' },
    { id: 'sketch',    label: 'Sketch approval',  client: 'Sketch ready for your nod', deva: 'रेखाचित्र' },
    { id: 'painting',  label: 'Painting',         client: 'Painting in progress',      deva: 'चित्रण' },
    { id: 'qc',        label: 'Studio review',    client: 'Final studio review',       deva: 'जाँच' },
    { id: 'ready',     label: 'Ready to ship',    client: 'Ready — awaiting dispatch', deva: 'तयार' },
    { id: 'delivered', label: 'Delivered',        client: 'Delivered',                 deva: 'पुर्‍याइयो' }
  ];

  var TIERS = {
    master:     { label: 'Guild Master', skill: 3, rank: 3 },
    senior:     { label: 'Senior Hand',  skill: 2, rank: 2 },
    apprentice: { label: 'Apprentice',   skill: 1, rank: 1 }
  };

  /* ── 2. Member artists (internal records) ───────────────── */
  /* Clients never see `name`, `town`, `phone` — only `handle`,
     tier and atelier. See KK.publicHand(). */
  var ARTIST_SEED = [
    { id: 'KK-A01', handle: 'Hand No. 01', name: 'Sujata Chitrakar', town: 'Bhaktapur',
      tier: 'master', ateliers: ['paubha', 'thangka', 'calligraphy'], capacity: 3,
      rating: 4.9, since: 2011, pin: '1101', note: 'Fourth-generation Chitrakar family; gold line work.' },
    { id: 'KK-A02', handle: 'Hand No. 02', name: 'Tenzin Lama', town: 'Boudha, Kathmandu',
      tier: 'master', ateliers: ['thangka', 'paubha'], capacity: 2,
      rating: 4.95, since: 2008, pin: '1102', note: 'Trained in Tsang-ri iconometry; brocade mounting in house.' },
    { id: 'KK-A03', handle: 'Hand No. 03', name: 'Rekha Jha', town: 'Janakpur',
      tier: 'senior', ateliers: ['mithila', 'calligraphy'], capacity: 4,
      rating: 4.8, since: 2014, pin: '1103', note: 'Kachni line specialist, natural dye preparation.' },
    { id: 'KK-A04', handle: 'Hand No. 04', name: 'Bikash Maharjan', town: 'Patan',
      tier: 'senior', ateliers: ['portrait', 'modern'], capacity: 3,
      rating: 4.7, since: 2016, pin: '1104', note: 'Oil portraiture from photographic reference.' },
    { id: 'KK-A05', handle: 'Hand No. 05', name: 'Anjali Gurung', town: 'Pokhara',
      tier: 'senior', ateliers: ['landscape', 'modern', 'portrait'], capacity: 4,
      rating: 4.75, since: 2015, pin: '1105', note: 'Annapurna range plein-air studies.' },
    { id: 'KK-A06', handle: 'Hand No. 06', name: 'Prakash Tamang', town: 'Kathmandu',
      tier: 'senior', ateliers: ['mural', 'modern'], capacity: 2,
      rating: 4.6, since: 2017, pin: '1106', note: 'Leads the mural unit; scaffold-certified.' },
    { id: 'KK-A07', handle: 'Hand No. 07', name: 'Nirajan Shakya', town: 'Patan',
      tier: 'apprentice', ateliers: ['paubha', 'calligraphy'], capacity: 3,
      rating: 4.5, since: 2021, pin: '1107', note: 'Third year under Hand No. 01.' },
    { id: 'KK-A08', handle: 'Hand No. 08', name: 'Sarita Thapa', town: 'Dhulikhel',
      tier: 'apprentice', ateliers: ['landscape', 'mithila'], capacity: 4,
      rating: 4.4, since: 2022, pin: '1108', note: 'Watercolour on lokta; quick turnaround.' },
    { id: 'KK-A09', handle: 'Hand No. 09', name: 'Deepak Ranjit', town: 'Bhaktapur',
      tier: 'master', ateliers: ['mural', 'portrait', 'landscape'], capacity: 2,
      rating: 4.85, since: 2009, pin: '1109', note: 'Large-format wall commissions, heritage restoration.' }
  ];

  /* ── 3. Money, dates, ids ───────────────────────────────── */

  // Nepali/South-Asian digit grouping: 12,34,567
  function groupNPR(n) {
    var s = String(Math.round(Math.abs(n)));
    if (s.length <= 3) { return s; }
    var last3 = s.slice(-3);
    var rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return rest + ',' + last3;
  }
  function npr(n) { return 'रु ' + groupNPR(n); }
  function usd(n) { return '$' + Math.round(n / 141).toLocaleString('en-US'); }

  function ktm(d) {
    var date = (d instanceof Date) ? d : new Date(d);
    try {
      return date.toLocaleString('en-GB', {
        timeZone: 'Asia/Kathmandu', day: '2-digit', month: 'short',
        year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) + ' NPT';
    } catch (e) { return date.toDateString(); }
  }
  function ktmDate(d) {
    var date = (d instanceof Date) ? d : new Date(d);
    try {
      return date.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kathmandu', day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (e) { return date.toDateString(); }
  }
  function daysFromNow(days) {
    var d = new Date(); d.setDate(d.getDate() + days); return d.toISOString();
  }

  function orderCode() {
    var alphabet = 'ACDEFHJKLMNPRTUVWXY349';   // no lookalikes
    var out = '';
    for (var i = 0; i < 5; i++) { out += alphabet[Math.floor(Math.random() * alphabet.length)]; }
    return 'KK-' + out;
  }

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } }
    return null;
  }

  /* ── 4. Pricing ─────────────────────────────────────────── */
  function quote(brief) {
    var size = byId(SIZES, brief.size) || SIZES[1];
    var style = byId(STYLES, brief.style) || STYLES[4];
    var medium = byId(MEDIUMS, brief.medium) || MEDIUMS[1];
    var finish = byId(FINISHES, brief.finish) || FINISHES[0];
    var timing = byId(TIMELINES, brief.timeline) || TIMELINES[1];

    var art = size.base * style.mult * medium.mult * finish.mult * timing.mult;
    art = Math.round(art / 500) * 500;

    var extras = 0;
    var chosen = brief.extras || [];
    for (var i = 0; i < EXTRAS.length; i++) {
      if (chosen.indexOf(EXTRAS[i].id) !== -1) { extras += EXTRAS[i].price; }
    }
    var total = art + extras;
    return {
      art: art,
      extras: extras,
      total: total,
      deposit: Math.round(total * 0.4 / 500) * 500,
      etaDays: timing.days,
      etaDate: daysFromNow(timing.days)
    };
  }

  /* ── 5. Artist roster ───────────────────────────────────── */
  function artists() {
    var list = readJSON(KEY_ARTISTS, null);
    if (!list) { list = ARTIST_SEED.slice(); writeJSON(KEY_ARTISTS, list); }
    return list;
  }
  function saveArtists(list) { writeJSON(KEY_ARTISTS, list); }
  function artist(id) { return byId(artists(), id); }

  function loadOf(artistId) {
    var n = 0, all = orders();
    for (var i = 0; i < all.length; i++) {
      var o = all[i];
      if (o.assignedTo === artistId && o.status !== 'delivered') { n++; }
    }
    return n;
  }

  /* What the client is allowed to see about the person painting. */
  function publicHand(artistId, styleId) {
    var a = artist(artistId);
    if (!a) { return null; }
    var st = byId(STYLES, styleId);
    return {
      handle: a.handle,
      tier: TIERS[a.tier].label,
      atelier: st ? st.atelier : 'Kalakunja Studio',
      yearsAtStudio: Math.max(1, new Date().getFullYear() - a.since)
    };
  }

  /* ── 6. Matching engine ─────────────────────────────────── */
  /* Scores every member against a brief. 100 points:
       40  atelier / tradition match
       22  skill tier vs. finish grade required
       20  free capacity
       10  studio rating
        8  timeline headroom                                   */
  function matchScores(order) {
    var brief = order.brief;
    var style = byId(STYLES, brief.style);
    var finish = byId(FINISHES, brief.finish) || FINISHES[0];
    var timing = byId(TIMELINES, brief.timeline) || TIMELINES[1];
    var needSkill = Math.max(finish.skill, style ? style.complexity : 1);

    return artists().map(function (a) {
      var reasons = [];
      var score = 0;
      var primary = a.ateliers[0] === brief.style;
      var knows = a.ateliers.indexOf(brief.style) !== -1;

      if (primary) { score += 40; reasons.push('Primary atelier'); }
      else if (knows) { score += 30; reasons.push('Secondary atelier'); }
      else { reasons.push('Outside atelier'); }

      var skill = TIERS[a.tier].skill;
      if (skill >= needSkill) {
        score += 22 - (skill - needSkill) * 5;           // don't waste a master on simple work
        reasons.push(TIERS[a.tier].label + ' clears ' + finish.label.toLowerCase());
      } else {
        score += 6;
        reasons.push('Below required grade — needs supervision');
      }

      var load = loadOf(a.id);
      var free = a.capacity - load;
      if (free <= 0) { reasons.push('At full capacity (' + load + '/' + a.capacity + ')'); }
      else {
        score += Math.min(20, free * 7);
        reasons.push(free + ' of ' + a.capacity + ' slots free');
      }

      score += (a.rating - 4.3) * 16;                     // ~0–10

      if (timing.days <= 21) {
        if (free >= 2) { score += 8; reasons.push('Headroom for a rush job'); }
        else if (free <= 0) { score -= 10; reasons.push('Rush job with no headroom'); }
      } else { score += 4; }

      return {
        artist: a,
        load: load,
        free: free,
        score: Math.max(0, Math.min(100, Math.round(score))),
        reasons: reasons
      };
    }).sort(function (x, y) { return y.score - x.score; });
  }

  /* ── 7. Orders ──────────────────────────────────────────── */
  function orders() { return readJSON(KEY_ORDERS, []); }
  function saveOrders(list) { writeJSON(KEY_ORDERS, list); }
  function order(code) { return byId(orders(), String(code || '').trim().toUpperCase()); }

  function stageIndex(id) {
    for (var i = 0; i < STAGES.length; i++) { if (STAGES[i].id === id) { return i; } }
    return 0;
  }

  function createOrder(payload) {
    var list = orders();
    var code = orderCode();
    while (byId(list, code)) { code = orderCode(); }
    var q = quote(payload.brief);
    var now = new Date().toISOString();
    var o = {
      id: code,
      createdAt: now,
      client: payload.client,
      brief: payload.brief,
      quote: q,
      status: 'received',
      assignedTo: null,
      events: [{ at: now, stage: 'received', note: 'Commission brief received by the studio desk.', actor: 'Studio desk' }]
    };
    list.unshift(o);
    saveOrders(list);
    return o;
  }

  function updateOrder(code, patch) {
    var list = orders();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === code) {
        for (var k in patch) { if (Object.prototype.hasOwnProperty.call(patch, k)) { list[i][k] = patch[k]; } }
        saveOrders(list);
        return list[i];
      }
    }
    return null;
  }

  function addEvent(code, stage, note, actor) {
    var o = order(code);
    if (!o) { return null; }
    o.events = o.events || [];
    o.events.push({ at: new Date().toISOString(), stage: stage, note: note, actor: actor || 'Studio desk' });
    o.status = stage;
    return updateOrder(code, { events: o.events, status: o.status });
  }

  function assign(code, artistId, note) {
    var a = artist(artistId);
    var o = order(code);
    if (!a || !o) { return null; }
    updateOrder(code, { assignedTo: artistId });
    return addEvent(code, 'assigned',
      note || ('Brief routed to ' + a.handle + ' · ' + TIERS[a.tier].label + '.'),
      'Dispatch desk');
  }

  /* ── 8. Demo seed so the desk is never empty ────────────── */
  function seedDemo(force) {
    if (!force && orders().length) { return; }
    var demo = [
      { client: { name: 'Marianne Weber', email: 'm.weber@example.de', phone: '+49 30 555 0142', country: 'Germany' },
        brief: { style: 'thangka', size: 'md', medium: 'mineral', finish: 'museum', timeline: 'standard',
          extras: ['brocade', 'crate'], subject: 'Green Tara, full brocade mount',
          notes: 'For a meditation room. Prefer the traditional blue-green ground.', palette: 'Traditional' },
        status: 'painting', assignedTo: 'KK-A02', age: 26 },
      { client: { name: 'Rohan Shrestha', email: 'rohan.s@example.com', phone: '+977 9801 234567', country: 'Nepal' },
        brief: { style: 'portrait', size: 'sm', medium: 'oil', finish: 'fine', timeline: 'priority',
          extras: ['frame'], subject: 'Portrait of my grandparents from a 1978 photograph',
          notes: 'Photo is faded — please restore the colour of her sari to deep red.', palette: 'Warm' },
        status: 'sketch', assignedTo: 'KK-A04', age: 9 },
      { client: { name: 'Aiko Tanaka', email: 'aiko.t@example.jp', phone: '+81 3 5555 0198', country: 'Japan' },
        brief: { style: 'mithila', size: 'sm', medium: 'water', finish: 'standard', timeline: 'relaxed',
          extras: [], subject: 'Fish and lotus panel for a tea house',
          notes: 'Two matching panels if possible.', palette: 'Earthy' },
        status: 'review', assignedTo: null, age: 2 },
      { client: { name: 'Hotel Malla Group', email: 'projects@example.np', phone: '+977 1 4555 019', country: 'Nepal' },
        brief: { style: 'mural', size: 'xl', medium: 'wall', finish: 'fine', timeline: 'priority',
          extras: [], subject: 'Lobby wall — Patan Durbar Square in monsoon',
          notes: 'Wall is 6.2 m wide. Work must happen overnight, 10 pm to 6 am.', palette: 'Muted' },
        status: 'received', assignedTo: null, age: 1 },
      { client: { name: 'Élodie Marchand', email: 'elodie.m@example.fr', phone: '+33 1 55 55 01 76', country: 'France' },
        brief: { style: 'paubha', size: 'md', medium: 'mineral', finish: 'museum', timeline: 'relaxed',
          extras: ['gold', 'frame', 'crate'], subject: 'Chandra Mandala, gold line work',
          notes: 'Gift for a museum patron. Certificate of provenance required.', palette: 'Traditional' },
        status: 'qc', assignedTo: 'KK-A01', age: 54 },
      { client: { name: 'Bhawana Adhikari', email: 'b.adhikari@example.com', phone: '+977 9812 345678', country: 'Nepal' },
        brief: { style: 'calligraphy', size: 'xs', medium: 'ink', finish: 'fine', timeline: 'express',
          extras: [], subject: 'Ranjana lipi — family name and wedding date',
          notes: 'Wedding gift, needed before the 28th.', palette: 'Monochrome' },
        status: 'ready', assignedTo: 'KK-A07', age: 12 }
    ];

    var list = [];
    demo.forEach(function (d) {
      var created = new Date(); created.setDate(created.getDate() - d.age);
      var code = orderCode();
      var q = quote(d.brief);
      var events = [];
      var upto = stageIndex(d.status);
      for (var i = 0; i <= upto; i++) {
        var when = new Date(created.getTime() + i * Math.max(1, d.age / (upto + 1)) * 86400000);
        events.push({
          at: when.toISOString(), stage: STAGES[i].id,
          note: STAGES[i].label + ' — logged by the studio desk.',
          actor: i === 2 ? 'Dispatch desk' : 'Studio desk'
        });
      }
      list.push({
        id: code, createdAt: created.toISOString(), client: d.client, brief: d.brief,
        quote: q, status: d.status, assignedTo: d.assignedTo, events: events, demo: true
      });
    });
    saveOrders(list);
  }

  function resetAll() {
    writeJSON(KEY_ORDERS, []);
    writeJSON(KEY_ARTISTS, ARTIST_SEED.slice());
    seedDemo(true);
  }

  /* ── 9. Small UI kit ────────────────────────────────────── */
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function initChrome() {
    // mobile nav
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () { links.classList.toggle('open'); });
    }
    // mark current page in nav
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (href && href === here) { a.classList.add('active'); }
    });
    // reveal on scroll
    var targets = document.querySelectorAll('.reveal');
    if (targets.length) {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
          });
        }, { threshold: .12, rootMargin: '0px 0px -40px' });
        targets.forEach(function (t) { io.observe(t); });
      } else {
        targets.forEach(function (t) { t.classList.add('in'); });
      }
    }
    // current year
    document.querySelectorAll('[data-year]').forEach(function (n) {
      n.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    artists();       // ensure roster exists
    seedDemo(false); // ensure the desk has something to show
    initChrome();
  });

  /* ── 10. Export ─────────────────────────────────────────── */
  global.KK = {
    STYLES: STYLES, SIZES: SIZES, MEDIUMS: MEDIUMS, FINISHES: FINISHES,
    TIMELINES: TIMELINES, EXTRAS: EXTRAS, STAGES: STAGES, TIERS: TIERS,
    byId: byId, quote: quote,
    artists: artists, artist: artist, saveArtists: saveArtists, loadOf: loadOf, publicHand: publicHand,
    matchScores: matchScores,
    orders: orders, order: order, createOrder: createOrder, updateOrder: updateOrder,
    addEvent: addEvent, assign: assign, stageIndex: stageIndex, saveOrders: saveOrders,
    seedDemo: seedDemo, resetAll: resetAll,
    npr: npr, usd: usd, ktm: ktm, ktmDate: ktmDate,
    toast: toast, esc: esc, hasStorage: hasLS
  };
})(window);
