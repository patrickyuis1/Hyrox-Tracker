/* =====================================================================
   FUEL — race-week nutrition view. Reads FUEL_PLAN (fuel-data.js), scales
   it to the open profile's body weight and fits the race-day timeline to
   the start time. Body weight and each race's start time are saved per
   profile.
   ===================================================================== */
const FuelUI = (function(){
  "use strict";
  const SETTINGS_KEY = 'hyroxFuelSettings_v1';
  const DEFAULT_WEIGHT = 71;
  const WINDOW = { from: -6, to: 1 };
  let ctx = null;
  let selected = null; // { raceId, offset }

  function init(c){ ctx = c; }

  /* ---------------- settings ---------------- */
  function settings(){
    let s = {};
    try { s = JSON.parse(localStorage.getItem(ctx.nsKey(SETTINGS_KEY))) || {}; } catch(e){}
    if (!s.starts || typeof s.starts !== 'object') s.starts = {};
    return s;
  }
  function saveSettings(s){
    try { localStorage.setItem(ctx.nsKey(SETTINGS_KEY), JSON.stringify(s)); } catch(e){}
  }
  function weight(){
    const w = parseFloat(settings().weight);
    return (w >= 35 && w <= 160) ? w : DEFAULT_WEIGHT;
  }
  function startFor(race){
    const saved = settings().starts[race.id];
    if (/^\d{1,2}:\d{2}$/.test(saved || '')) return saved;
    return (race.startWindow && race.startWindow[0]) || '12:00';
  }
  function minutesOf(hhmm){
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }
  function variantFor(hhmm){
    const m = minutesOf(hhmm);
    if (m === null) return 'mid';
    if (m < 600) return 'early';
    if (m >= 780) return 'late';
    return 'mid';
  }

  /* ---------------- races and dates ---------------- */
  function races(){
    return (PROGRAM.races || [
      { id: 'race1', label: 'Race 1', date: PROGRAM.race1 },
      { id: 'race2', label: 'Race 2', date: PROGRAM.race2 },
    ]);
  }
  function raceName(r){ return r.city ? `${r.label} · ${r.city}` : r.label; }
  // The race whose week you're heading into (or just finished).
  function upcomingRace(){
    const t = ctx.todayISO();
    const list = races();
    return list.find(r => ctx.addDays(r.date, WINDOW.to) >= t) || list[list.length - 1];
  }
  function offsetOf(dateISO, race){
    return Math.round((ctx.fromISO(dateISO) - ctx.fromISO(race.date)) / 86400000);
  }
  function raceWindowFor(dateISO){
    for (const r of races()){
      const o = offsetOf(dateISO, r);
      if (o >= WINDOW.from && o <= WINDOW.to) return { race: r, offset: o };
    }
    return null;
  }
  function round5(v){ return Math.round(v / 5) * 5; }
  function offLabel(o){ return o === 0 ? 'Race' : (o > 0 ? `+${o}` : `D${o}`); }
  function shortDate(iso){ return ctx.fromISO(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function sessionOn(dateISO){
    try { return ctx.getContentFor(dateISO); } catch(e){ return null; }
  }

  // A day's targets. D-6..D-3 follow the session on that date (rest vs training).
  function dayFor(race, offset){
    const base = FUEL_PLAN.days.find(d => d.offset === offset);
    if (!base) return null;
    const dateISO = ctx.addDays(race.date, offset);
    let d = Object.assign({}, base);
    if (base.dynamic){
      const s = sessionOn(dateISO);
      const kind = (s && s.sessionType === 'rest') ? 'rest' : 'training';
      d = Object.assign(d, FUEL_PLAN.dynamic[kind]);
    }
    if (offset === -1 && variantFor(startFor(race)) === 'early'){
      d.focus = `${d.focus} ${FUEL_PLAN.earlyStartNote}`;
    }
    return d;
  }

  function clockAt(start, minutes){
    const base = minutesOf(start);
    if (base === null) return null;
    let total = base + minutes;
    total = ((total % 1440) + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  function relLabel(minutes){
    if (minutes === 0) return 'Start';
    const a = Math.abs(minutes), h = Math.floor(a / 60), mm = a % 60;
    const s = h ? `${h}h${mm ? ' ' + mm + 'm' : ''}` : `${mm} min`;
    return minutes < 0 ? `${s} before` : `${s} after`;
  }

  /* ---------------- compact card on the Plan view ---------------- */
  function todayCardHTML(dateISO){
    const hit = raceWindowFor(dateISO);
    if (!hit) return '';
    const d = dayFor(hit.race, hit.offset);
    if (!d) return '';
    const w = weight();
    const city = hit.race.city || hit.race.label;
    const line = d.race
      ? `Race-day timeline for a ${ctx.escapeHtml(startFor(hit.race))} start: meals, drinks, caffeine and recovery.`
      : `<b>${round5(d.carbs * w)} g</b> carbs · <b>${round5(d.protein * w)} g</b> protein · <b>${ctx.escapeHtml(d.fluid)}</b> fluid${/^(none|optional)$/i.test(d.electrolytes) ? '' : ` · <b>${ctx.escapeHtml(d.electrolytes)}</b> electrolytes`}`;
    return `<button class="fuel-today" data-fuel-race="${hit.race.id}" data-fuel-offset="${hit.offset}">
      <span class="ft-off">${offLabel(hit.offset)}</span>
      <span class="ft-body">
        <span class="ft-title">${ctx.escapeHtml(city)} fuel · ${ctx.escapeHtml(d.title)}</span>
        <span class="ft-line">${line}</span>
      </span>
      <span class="ft-go" aria-hidden="true">›</span>
    </button>`;
  }

  /* ---------------- Fuel tab ---------------- */
  function select(raceId, offset){ selected = { raceId, offset }; }

  function optionsHTML(opts){
    return `<ul class="meal-opts">${opts.map(o => `<li><span class="mo-text">${ctx.escapeHtml(o.text)}</span><span class="mo-macros">C ${o.c} · P ${o.p}</span></li>`).join('')}</ul>`;
  }
  function mealsHTML(set){
    const meals = FUEL_PLAN.meals[set];
    if (!meals) return '';
    return Object.keys(meals).map(slot => `
      <div class="meal">
        <h3 class="meal-slot">${slot}</h3>
        ${optionsHTML(meals[slot])}
      </div>`).join('');
  }
  function timelineHTML(start){
    const v = variantFor(start);
    const items = FUEL_PLAN.raceTimeline
      .filter(t => !t.variants || t.variants.includes(v))
      .slice().sort((a, b) => a.at - b.at);
    return `<ol class="timeline">${items.map(t => `
      <li class="tl-item ${t.at === 0 ? 'is-start' : ''}">
        <div class="tl-time"><span class="tl-clock">${clockAt(start, t.at) || '—'}</span><span class="tl-rel">${relLabel(t.at)}</span></div>
        <div class="tl-body">
          <div class="tl-title">${ctx.escapeHtml(t.title)}</div>
          <div class="tl-detail">${ctx.escapeHtml(t.detail)}</div>
          ${t.options ? optionsHTML(t.options) : ''}
        </div>
      </li>`).join('')}</ol>`;
  }
  function tile(label, value, sub, cls){
    return `<div class="tile ${cls || ''}"><div class="tile-label">${label}</div><div class="tile-value">${value}</div>${sub ? `<div class="tile-sub">${sub}</div>` : ''}</div>`;
  }

  function renderTab(el){
    const s = settings();
    const w = weight();
    const today = ctx.todayISO();
    const list = races();
    const race = (selected && list.find(r => r.id === selected.raceId)) || upcomingRace();
    let offset = (selected && selected.raceId === race.id && selected.offset !== null && selected.offset !== undefined) ? selected.offset : null;
    if (offset === null){
      const o = offsetOf(today, race);
      offset = (o >= WINDOW.from && o <= WINDOW.to) ? o : WINDOW.from;
    }
    const start = startFor(race);
    const variant = variantFor(start);
    const planStart = ctx.addDays(race.date, WINDOW.from);
    const daysToPlan = Math.round((ctx.fromISO(planStart) - ctx.fromISO(today)) / 86400000);
    const sub = daysToPlan > 0
      ? `Fuel plan starts ${shortDate(planStart)} - ${daysToPlan} day${daysToPlan === 1 ? '' : 's'} away.`
      : (offsetOf(today, race) > WINDOW.to ? 'Race done - here for reference.' : 'You are in race week.');
    const windowNote = race.startWindow
      ? `Wave window ${race.startWindow[0]}-${race.startWindow[1]}. Set your exact time once it's announced.`
      : '';

    const d = dayFor(race, offset);
    const dateISO = ctx.addDays(race.date, offset);
    const session = sessionOn(dateISO);

    const raceChips = list.filter(r => ctx.addDays(r.date, WINDOW.to) >= today || r.id === race.id).map(r =>
      `<button class="race-chip ${r.id === race.id ? 'is-on' : ''}" data-race="${r.id}">${ctx.escapeHtml(r.city || r.label)}<span>${ctx.fromISO(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></button>`
    ).join('');

    const dayChips = FUEL_PLAN.days.map(x => {
      const iso = ctx.addDays(race.date, x.offset);
      return `<button class="day-chip ${x.offset === offset ? 'is-on' : ''} ${iso === today ? 'is-today' : ''} ${x.race ? 'is-race' : ''}" data-chip="${x.offset}" aria-pressed="${x.offset === offset}">
        <span class="dc-off">${offLabel(x.offset)}</span><span class="dc-date">${ctx.fromISO(iso).toLocaleDateString('en-GB', { weekday: 'short' })} ${ctx.fromISO(iso).getDate()}</span>
      </button>`;
    }).join('');

    let body;
    if (d.race){
      const early = variant === 'early';
      body = `
        <div class="tiles">
          ${tile(early ? 'Breakfast' : 'Pre-race meal', `${round5((early ? 1.25 : 2) * w)} g`, early ? 'carbs, 2.5 h before' : 'carbs, 3-4 h before', 'is-carb')}
          ${tile('Pre-race fluid', `${round5(6 * w)} ml`, 'with 1 electrolyte serving', 'is-fluid')}
          ${tile('Caffeine', `${round5(3 * w)} mg`, 'optional, 1 h before')}
          ${tile('Recovery', `${round5(1.1 * w)} g`, 'carbs + 30-40 g protein', 'is-carb')}
        </div>
        <h3 class="fuel-h3">Timeline for a ${ctx.escapeHtml(start)} start <span class="variant-tag">${{ early: 'early wave', mid: 'late-morning wave', late: 'afternoon wave' }[variant]}</span></h3>
        ${timelineHTML(start)}`;
    } else {
      body = `
        <div class="tiles">
          ${tile('Carbs', `${round5(d.carbs * w)} g`, `${d.carbs} g/kg`, 'is-carb')}
          ${tile('Protein', `${round5(d.protein * w)} g`, `${d.protein} g/kg`)}
          ${tile('Fluid', ctx.escapeHtml(d.fluid), ctx.escapeHtml(d.fluidNote || ''), 'is-fluid')}
          ${tile('Electrolytes', ctx.escapeHtml(d.electrolytes), ctx.escapeHtml(d.electrolytesNote || ''), 'is-fluid')}
        </div>
        <p class="fibre-line"><span>Fibre</span>${ctx.escapeHtml(d.fibre)}</p>
        <p class="meal-hint">Pick one option per meal. Numbers are for ~70 kg - scale portions to land near ${round5(d.carbs * w)} g carbs across 3 meals and 2-3 snacks.</p>
        ${mealsHTML(d.mealSet)}`;
    }

    el.innerHTML = `
      <div class="view-head">
        <div class="eyebrow">Race-week fuel</div>
        <h1 class="view-title">${ctx.escapeHtml(raceName(race))}</h1>
        <p class="view-sub">${shortDate(race.date)} · ${sub}</p>
      </div>

      <div class="race-chips" aria-label="Race">${raceChips}</div>

      <div class="fuel-settings">
        <label class="fs-field"><span>Body weight</span><span class="fs-input"><input id="fuelWeight" type="text" inputmode="decimal" value="${ctx.escapeHtml(String(s.weight || DEFAULT_WEIGHT))}" maxlength="5"><em>kg</em></span></label>
        <label class="fs-field"><span>${ctx.escapeHtml(race.city || race.label)} start</span><span class="fs-input"><input id="fuelStart" type="time" value="${ctx.escapeHtml(start)}"></span></label>
        ${windowNote ? `<p class="fs-note">${ctx.escapeHtml(windowNote)}</p>` : ''}
      </div>

      <div class="day-chips" aria-label="Race-week day">${dayChips}</div>

      <section class="fuel-day ${d.race ? 'is-race' : ''}">
        <div class="fd-head">
          <span class="fd-off">${offLabel(offset)}</span>
          <div>
            <h2 class="fd-title">${ctx.escapeHtml(d.title)}</h2>
            <p class="fd-meta">${shortDate(dateISO)}${session ? ' · Training: ' + ctx.escapeHtml(session.title) : ''}</p>
          </div>
        </div>
        <p class="fd-focus">${ctx.escapeHtml(d.focus)}</p>
        ${body}
      </section>

      <section class="fuel-card">
        <h2 class="fc-title">Supplements</h2>
        <dl class="supps">${FUEL_PLAN.supplements.map(x => `<dt>${ctx.escapeHtml(x.name)}</dt><dd>${ctx.escapeHtml(x.how)}</dd>`).join('')}</dl>
      </section>

      <section class="fuel-card">
        <h2 class="fc-title">Ground rules</h2>
        <ul class="rules">${FUEL_PLAN.rules.map(r => `<li>${ctx.escapeHtml(r)}</li>`).join('')}</ul>
      </section>`;

    el.querySelectorAll('[data-race]').forEach(b => b.addEventListener('click', () => {
      select(b.getAttribute('data-race'), null);
      renderTab(el);
    }));
    el.querySelectorAll('[data-chip]').forEach(b => b.addEventListener('click', () => {
      select(race.id, Number(b.getAttribute('data-chip')));
      renderTab(el);
    }));
    const wIn = el.querySelector('#fuelWeight');
    wIn.addEventListener('change', () => {
      const v = parseFloat(wIn.value);
      const cur = settings();
      if (v >= 35 && v <= 160){ cur.weight = Math.round(v * 10) / 10; saveSettings(cur); }
      select(race.id, offset);
      renderTab(el);
    });
    const sIn = el.querySelector('#fuelStart');
    sIn.addEventListener('change', () => {
      const cur = settings();
      if (/^\d{1,2}:\d{2}$/.test(sIn.value)){ cur.starts[race.id] = sIn.value; saveSettings(cur); }
      select(race.id, offset);
      renderTab(el);
    });
  }

  return { init, renderTab, todayCardHTML, select, raceWindowFor, clockAt, variantFor };
})();
