/* =====================================================================
   HYROX DAILY — app logic
   No build step, no backend. Progress (and day-swap arrangements) are
   stored in the browser via localStorage — private to this device/browser.
   The program itself lives in program-data.js as plain, editable data.
   ===================================================================== */

(function(){
  "use strict";

  const STORAGE_KEY = 'hyroxProgress_v1';
  const RACE_TIME_KEY = 'hyroxRaceTimes_v1';
  const DAYORDER_KEY = 'hyroxDayOrder_v1';
  const EXLOG_KEY = 'hyroxExerciseLog_v1';
  const HOLIDAY_KEY = 'hyroxHoliday_v1';
  const PROFILES_KEY = 'hyroxProfiles_v1';
  const ACTIVE_PROFILE_KEY = 'hyroxActiveProfile_v1';
  const LOCKED_WEEKS = [13, 18]; // race weeks - fixed real-world date, not swappable

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ---------------- profiles (device-local — each browser has its own list) ---------------- */
  function loadProfiles(){
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || []; }
    catch(e){ return []; }
  }
  function saveProfiles(list){
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); } catch(e){}
  }
  function getActiveProfileId(){
    try { return localStorage.getItem(ACTIVE_PROFILE_KEY); } catch(e){ return null; }
  }
  function setActiveProfileId(id){
    try { localStorage.setItem(ACTIVE_PROFILE_KEY, id); } catch(e){}
  }
  function createProfile(name){
    const id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7);
    const list = loadProfiles();
    list.push({ id, name, createdAt: new Date().toISOString() });
    saveProfiles(list);
    return id;
  }
  function deleteProfile(id){
    saveProfiles(loadProfiles().filter(p => p.id !== id));
    [STORAGE_KEY, RACE_TIME_KEY, DAYORDER_KEY, EXLOG_KEY, HOLIDAY_KEY].forEach(base => {
      try { localStorage.removeItem(nsKey(base, id)); } catch(e){}
    });
    if (getActiveProfileId() === id) setActiveProfileId(null);
  }
  function avatarColor(name){
    const palette = ['#2DD4BF', '#FF6B35', '#8B93FF', '#F472B6', '#4ADE80', '#FBBF24'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  }
  // Namespaces a storage base-key to the active (or given) profile, so every
  // profile's progress/swaps/race-times live in completely separate keys.
  function nsKey(base, profileId){
    const pid = profileId || getActiveProfileId();
    return pid ? `${base}::${pid}` : base;
  }

  /* ---------------- date helpers (local time, no UTC drift) ---------------- */
  function pad(n){ return String(n).padStart(2,'0'); }
  function toISO(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function fromISO(s){ const [y,m,dd] = s.split('-').map(Number); return new Date(y, m-1, dd); }
  function todayISO(){ return toISO(new Date()); }
  function addDays(iso, n){ const d = fromISO(iso); d.setDate(d.getDate()+n); return toISO(d); }
  function fmtLong(iso){ return fromISO(iso).toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long'}); }
  function fmtShort(iso){ return fromISO(iso).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'}); }

  /* ---------------- flatten PROGRAM for lookups ---------------- */
  const DAY_INDEX = {};      // date -> { week, day }  ("day" = the fixed calendar slot: dayName etc.)
  const FLAT_DATES = [];     // ordered list of all 126 dates
  PROGRAM.weeks.forEach(w => {
    w.days.forEach(d => {
      DAY_INDEX[d.date] = { week: w, day: d };
      FLAT_DATES.push(d.date);
    });
  });
  const PROGRAM_START = PROGRAM.startDate;
  const PROGRAM_END = FLAT_DATES[FLAT_DATES.length - 1];

  function clampISO(iso){
    if (iso < PROGRAM_START) return PROGRAM_START;
    if (iso > PROGRAM_END) return PROGRAM_END;
    return iso;
  }
  function weekOf(dateStr){ return DAY_INDEX[dateStr].week; }
  function posInWeek(dateStr){
    const week = weekOf(dateStr);
    return week.days.findIndex(d => d.date === dateStr);
  }
  function weekAllowsSwap(week){ return !LOCKED_WEEKS.includes(week.weekNum); }

  /* ---------------- persistence: progress ---------------- */
  function loadProgress(){
    try { return JSON.parse(localStorage.getItem(nsKey(STORAGE_KEY))) || {}; }
    catch(e){ return {}; }
  }
  function saveProgress(p){
    try { localStorage.setItem(nsKey(STORAGE_KEY), JSON.stringify(p)); } catch(e){ /* storage unavailable */ }
  }
  function isChecked(date, idx){
    const p = loadProgress();
    return !!(p[date] && p[date][idx]);
  }
  function toggleChecked(date, idx){
    const p = loadProgress();
    if (!p[date]) p[date] = {};
    p[date][idx] = !p[date][idx];
    saveProgress(p);
  }
  function loadRaceTimes(){
    try { return JSON.parse(localStorage.getItem(nsKey(RACE_TIME_KEY))) || {}; }
    catch(e){ return {}; }
  }
  function saveRaceTime(date, val){
    const t = loadRaceTimes();
    t[date] = val;
    try { localStorage.setItem(nsKey(RACE_TIME_KEY), JSON.stringify(t)); } catch(e){}
  }

  /* ---------------- persistence: day-swap arrangement ---------------- */
  // Per week (keyed by that week's Monday date): a permutation of [0..6].
  // perm[i] = which ORIGINAL day-index's content is shown on calendar position i.
  function loadDayOrder(){
    try { return JSON.parse(localStorage.getItem(nsKey(DAYORDER_KEY))) || {}; }
    catch(e){ return {}; }
  }
  function saveDayOrder(o){
    try { localStorage.setItem(nsKey(DAYORDER_KEY), JSON.stringify(o)); } catch(e){}
  }
  function getWeekOrder(weekStartDate){
    const o = loadDayOrder();
    return o[weekStartDate] || [0,1,2,3,4,5,6];
  }
  function setWeekOrder(weekStartDate, perm){
    const o = loadDayOrder();
    o[weekStartDate] = perm;
    saveDayOrder(o);
  }

  // The content actually shown for a given calendar date (after any swap).
  function getContentFor(dateStr){
    const week = weekOf(dateStr);
    const perm = getWeekOrder(week.days[0].date);
    const pos = posInWeek(dateStr);
    return week.days[perm[pos]];
  }
  function isSwapped(dateStr){
    const week = weekOf(dateStr);
    const perm = getWeekOrder(week.days[0].date);
    const pos = posInWeek(dateStr);
    return perm[pos] !== pos;
  }
  function performSwap(dateA, dateB){
    const week = weekOf(dateA);
    const weekStart = week.days[0].date;
    const posA = posInWeek(dateA);
    const posB = posInWeek(dateB);
    const perm = getWeekOrder(weekStart).slice();
    const tmp = perm[posA]; perm[posA] = perm[posB]; perm[posB] = tmp;
    setWeekOrder(weekStart, perm);

    // completion state follows the content it belongs to
    const prog = loadProgress();
    const a = prog[dateA], b = prog[dateB];
    if (b === undefined) delete prog[dateA]; else prog[dateA] = b;
    if (a === undefined) delete prog[dateB]; else prog[dateB] = a;
    saveProgress(prog);
  }

  /* ---------------- persistence: exercise history log ---------------- */
  // Keyed by exercise NAME (stable across the weeks it recurs), each an array
  // of {date, ...fields} entries, so "what did I do last time" is a simple
  // lookup regardless of which week/date that last occurrence was.
  function loadExerciseLog(){
    try { return JSON.parse(localStorage.getItem(nsKey(EXLOG_KEY))) || {}; }
    catch(e){ return {}; }
  }
  function saveExerciseLog(log){
    try { localStorage.setItem(nsKey(EXLOG_KEY), JSON.stringify(log)); } catch(e){}
  }
  function getExerciseHistory(name){
    const log = loadExerciseLog();
    return (log[name] || []).slice().sort((a, b) => a.date < b.date ? -1 : (a.date > b.date ? 1 : 0));
  }
  function getEntryOn(name, dateStr){
    return getExerciseHistory(name).find(e => e.date === dateStr) || null;
  }
  function getMostRecentEntry(name, beforeDate){
    const hist = getExerciseHistory(name).filter(e => e.date < beforeDate);
    return hist.length ? hist[hist.length - 1] : null;
  }
  function saveExerciseEntry(name, dateStr, values){
    const log = loadExerciseLog();
    if (!log[name]) log[name] = [];
    log[name] = log[name].filter(e => e.date !== dateStr);
    log[name].push({ date: dateStr, ...values });
    saveExerciseLog(log);
  }
  function formatEntryValue(field, entry){
    const v = entry ? entry[field.key] : null;
    if (!v) return null;
    return `${v}${field.unit || ''}`;
  }

  /* ---------------- persistence: holiday mode ---------------- */
  // A day marked as holiday is excused: it's skipped in streak-breaking logic
  // and removed from the adherence denominator, instead of counting against you.
  function loadHolidays(){
    try { return JSON.parse(localStorage.getItem(nsKey(HOLIDAY_KEY))) || {}; }
    catch(e){ return {}; }
  }
  function saveHolidays(h){
    try { localStorage.setItem(nsKey(HOLIDAY_KEY), JSON.stringify(h)); } catch(e){}
  }
  function isHoliday(dateStr){
    return !!loadHolidays()[dateStr];
  }
  function getHolidayReason(dateStr){
    const h = loadHolidays()[dateStr];
    return h ? (h.reason || '') : '';
  }
  function setHoliday(dateStr, on, reason){
    const h = loadHolidays();
    if (on) h[dateStr] = { reason: reason || (h[dateStr] ? h[dateStr].reason : '') || '' };
    else delete h[dateStr];
    saveHolidays(h);
  }


  /* ---------------- block helpers ---------------- */
  function isNote(b){ return b.pattern === 'rest' && b.prescription === ''; }
  function checkableIndices(content){
    return content.blocks.map((b,i)=>i).filter(i => !isNote(content.blocks[i]));
  }
  function isDayComplete(dateStr){
    const content = getContentFor(dateStr);
    if (!content) return false;
    const idxs = checkableIndices(content);
    if (idxs.length === 0) return false;
    return idxs.every(i => isChecked(dateStr, i));
  }
  function dayCompletionPct(dateStr){
    const content = getContentFor(dateStr);
    if (!content) return 0;
    const idxs = checkableIndices(content);
    if (idxs.length === 0) return 0;
    const done = idxs.filter(i => isChecked(dateStr, i)).length;
    return Math.round((done/idxs.length)*100);
  }
  function accentVar(sessionType){
    return { gym:'var(--gym)', run:'var(--run)', rest:'var(--rest)', race:'var(--race)' }[sessionType] || 'var(--gym)';
  }

  /* ---------------- state ---------------- */
  let viewDate = clampISO(todayISO());
  let swapPanelOpen = false;

  /* ---------------- profile screen + boot flow ---------------- */
  function renderProfileList(){
    const list = document.getElementById('profileList');
    const profiles = loadProfiles();
    if (profiles.length === 0){
      list.innerHTML = `<p class="profile-empty">No profiles yet on this device — add your name below.</p>`;
    } else {
      list.innerHTML = profiles.map(p => `
        <div class="profile-card">
          <button class="profile-select" data-profile="${p.id}">
            <span class="profile-avatar" style="background:${avatarColor(p.name)}">${escapeHtml(p.name.slice(0,1).toUpperCase())}</span>
            <span class="profile-name">${escapeHtml(p.name)}</span>
          </button>
          <button class="profile-delete" data-delete="${p.id}" aria-label="Delete ${escapeHtml(p.name)}'s profile">×</button>
        </div>
      `).join('');
    }
    list.querySelectorAll('[data-profile]').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveProfileId(btn.getAttribute('data-profile'));
        enterApp();
      });
    });
    list.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete');
        const p = profiles.find(x => x.id === id);
        if (window.confirm(`Delete ${p ? p.name : 'this'}'s profile and all their progress on this device? This can't be undone.`)){
          deleteProfile(id);
          renderProfileList();
        }
      });
    });
  }

  function showProfileScreen(){
    document.getElementById('mainApp').hidden = true;
    document.getElementById('profileScreen').hidden = false;
    renderProfileList();
    document.getElementById('newProfileName').value = '';
  }

  function enterApp(){
    document.getElementById('profileScreen').hidden = true;
    document.getElementById('mainApp').hidden = false;
    const profiles = loadProfiles();
    const active = profiles.find(p => p.id === getActiveProfileId());
    document.getElementById('activeProfileName').textContent = active ? active.name : '';
    viewDate = clampISO(todayISO());
    swapPanelOpen = false;
    renderAll();
  }

  function addProfileFromInput(){
    const input = document.getElementById('newProfileName');
    const name = input.value.trim();
    if (!name) return;
    const id = createProfile(name);
    setActiveProfileId(id);
    enterApp();
  }

  function boot(){
    const profiles = loadProfiles();
    const activeId = getActiveProfileId();
    if (activeId && profiles.some(p => p.id === activeId)){
      enterApp();
    } else if (profiles.length === 1){
      setActiveProfileId(profiles[0].id);
      enterApp();
    } else {
      showProfileScreen();
    }
  }

  /* ---------------- rendering ---------------- */

  function renderBanner(){
    const el = document.getElementById('startBanner');
    const real = todayISO();
    if (real < PROGRAM_START){
      const days = Math.round((fromISO(PROGRAM_START) - fromISO(real)) / 86400000);
      el.innerHTML = `<div class="banner">Program starts <b>${fmtLong(PROGRAM_START)}</b> — <b>${days} day${days===1?'':'s'}</b> to go. Previewing Week 1, Day 1.</div>`;
    } else if (real > PROGRAM_END){
      el.innerHTML = `<div class="banner">Block complete — both races done. This is the final logged day.</div>`;
    } else {
      el.innerHTML = '';
    }
  }

  function renderPhaseCard(){
    const week = weekOf(viewDate);
    const phaseObj = PROGRAM.phases.find(p => p.weeks.includes(week.weekNum));
    const weekPosInPhase = phaseObj.weeks.indexOf(week.weekNum) + 1;

    document.getElementById('phaseName').textContent = phaseObj.name;
    document.getElementById('phaseWeek').textContent = `Week ${week.weekNum} / 18 · Phase wk ${weekPosInPhase}/${phaseObj.weeks.length}`;

    const flatIdx = FLAT_DATES.indexOf(viewDate);
    const pct = ((flatIdx+1) / FLAT_DATES.length) * 100;
    document.getElementById('phaseBarFill').style.width = pct.toFixed(1) + '%';

    const real = todayISO();
    let countdown;
    if (real <= PROGRAM.race1){
      const d = Math.round((fromISO(PROGRAM.race1) - fromISO(real)) / 86400000);
      countdown = d === 0 ? 'RACE 1 IS TODAY' : `${d} day${d===1?'':'s'} to Race 1`;
    } else if (real <= PROGRAM.race2){
      const d = Math.round((fromISO(PROGRAM.race2) - fromISO(real)) / 86400000);
      countdown = d === 0 ? 'RACE 2 IS TODAY' : `${d} day${d===1?'':'s'} to Race 2`;
    } else {
      countdown = 'Season complete';
    }
    document.getElementById('raceCountdown').textContent = countdown;

    const throughDate = real < PROGRAM_START ? null : (real > PROGRAM_END ? PROGRAM_END : real);
    if (throughDate){
      const elapsed = FLAT_DATES.filter(d => d <= throughDate && !isHoliday(d));
      const done = elapsed.filter(d => isDayComplete(d)).length;
      const adhPct = elapsed.length ? Math.round((done/elapsed.length)*100) : 0;
      document.getElementById('adherenceStat').textContent = `${adhPct}% adherence`;
    } else {
      document.getElementById('adherenceStat').textContent = '—';
    }
  }

  function renderWeekRail(){
    const week = weekOf(viewDate);
    const rail = document.getElementById('weekRail');
    rail.innerHTML = '';
    const real = todayISO();
    week.days.forEach(slot => {
      const realDate = slot.date;                 // calendar date never moves
      const content = getContentFor(realDate);     // may be swapped-in content
      const pct = dayCompletionPct(realDate);
      const done = pct === 100;
      const partial = pct > 0 && pct < 100;
      const onHoliday = isHoliday(realDate);
      const btn = document.createElement('button');
      btn.className = `week-dot type-${content.sessionType} ${done?'done':''} ${partial?'partial':''} ${onHoliday?'holiday':''} ${realDate===real?'is-today':''} ${realDate===viewDate?'is-viewing':''}`;
      if (partial) btn.style.setProperty('--pct', pct + '%');
      btn.innerHTML = `<span class="wd-letter">${slot.dayName.slice(0,1)}</span><span class="wd-ring">${onHoliday ? '⛱' : fromISO(realDate).getDate()}</span>`;
      btn.setAttribute('aria-label', `${slot.dayName} ${fmtShort(realDate)}${onHoliday?' - holiday mode':(done?' - complete':'')}`);
      btn.addEventListener('click', () => { viewDate = realDate; swapPanelOpen = false; renderAll(); });
      rail.appendChild(btn);
    });
  }

  function logInputHTML(block, dateStr){
    if (!block.log || !block.log.fields || !block.log.fields.length) return '';
    const fields = block.log.fields;
    const prev = getMostRecentEntry(block.name, dateStr);
    const current = getEntryOn(block.name, dateStr) || {};

    const prevParts = fields.map(f => formatEntryValue(f, prev)).filter(Boolean);
    const prevText = prevParts.length
      ? `Last: <b>${escapeHtml(prevParts.join(' / '))}</b> (${fmtShort(prev.date)})`
      : 'No previous log yet';

    const inputs = fields.map(f => `
      <span class="log-field">
        <input class="log-input" data-logfield="${f.key}" type="text" inputmode="${f.inputmode || 'text'}"
               placeholder="${escapeHtml(f.placeholder || '')}" value="${escapeHtml(current[f.key] || '')}">
        <span class="log-field-label">${escapeHtml(f.label)}</span>
      </span>`).join('');

    return `<div class="log-row" data-logname="${escapeHtml(block.name)}">
      <span class="log-prev">${prevText}</span>
      <span class="log-inputs">${inputs}</span>
    </div>`;
  }

  function stationHTML(content, dateStr, idx){
    const b = content.blocks[idx];
    const checked = isChecked(dateStr, idx);

    if (isNote(b)){
      return `
      <div class="station note">
        <div class="station-line"></div>
        <div class="station-node">${PICTOGRAMS['rest']}</div>
        <div class="station-body">
          <div class="station-name">${b.name}</div>
          <div class="station-detail">${b.detail || ''}</div>
        </div>
      </div>`;
    }

    const videoLink = b.videoQuery
      ? `<a class="station-video" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(b.videoQuery)}">Watch a demo ↗</a>`
      : '';

    return `
      <div class="station ${checked?'checked':''}" data-idx="${idx}">
        <div class="station-line"></div>
        <button class="station-node" aria-label="Mark ${b.name} done" data-toggle="${idx}">
          ${PICTOGRAMS[b.pattern] || PICTOGRAMS['core']}
          <span class="p-check">✓</span>
        </button>
        <div class="station-body">
          <div class="station-name">${b.name}</div>
          ${b.prescription ? `<div class="station-prescription">${b.prescription}</div>` : ''}
          ${b.detail ? `<div class="station-detail">${b.detail}</div>` : ''}
          ${b.cue ? `<div class="station-cue">${b.cue}</div>` : ''}
          ${videoLink}
          ${logInputHTML(b, dateStr)}
        </div>
      </div>`;
  }

  function restBlockHTML(content, dateStr){
    const idx = 0;
    const b = content.blocks[0];
    const checked = isChecked(dateStr, idx);
    return `
      <div class="rest-block ${checked?'checked':''}">
        <button class="station-node" aria-label="Mark rest day taken" data-toggle="${idx}">
          ${PICTOGRAMS['rest']}
          <span class="p-check">✓</span>
        </button>
        <div class="station-body">
          <div class="station-name">${b.name}</div>
          <div class="station-detail">${b.detail || ''}</div>
        </div>
      </div>`;
  }

  function raceBlockHTML(content, dateStr){
    const idx = 0;
    const b = content.blocks[0];
    const checked = isChecked(dateStr, idx);
    const times = loadRaceTimes();
    const savedTime = times[dateStr] || '';
    return `
      <div class="race-block">
        <div class="race-lead">${b.detail || ''}</div>
        <div class="time-input-row">
          <label for="raceTimeInput">Finish time</label>
          <input class="time-input" id="raceTimeInput" placeholder="h:mm:ss" value="${savedTime}">
        </div>
        <div class="race-cue">${b.cue || ''}</div>
        <button class="race-complete-btn ${checked?'done':''}" id="raceCompleteBtn" data-toggle="${idx}">
          ${checked ? '✓ Race Logged' : 'Mark Race Complete'}
        </button>
      </div>`;
  }

  function renderSwapUI(){
    const week = weekOf(viewDate);
    const btn = document.getElementById('swapToggleBtn');
    const panel = document.getElementById('swapPanel');
    const lockedNote = document.getElementById('swapLockedNote');

    if (!weekAllowsSwap(week)){
      btn.hidden = true;
      panel.hidden = true;
      lockedNote.hidden = false;
      return;
    }
    lockedNote.hidden = true;
    btn.hidden = false;
    btn.textContent = swapPanelOpen ? 'Cancel' : '⇄ Swap with another day this week';
    panel.hidden = !swapPanelOpen;

    if (swapPanelOpen){
      const others = week.days.filter(s => s.date !== viewDate);
      panel.innerHTML = others.map(s => {
        const content = getContentFor(s.date);
        const tag = { gym:'Gym', run:'Run', rest:'Rest' }[content.sessionType] || content.sessionType;
        return `<button class="swap-option" data-swapdate="${s.date}">
          <span class="swap-option-day">${s.dayName}<span class="swap-option-date">${fmtShort(s.date)}</span></span>
          <span class="swap-option-tag type-${content.sessionType}">${tag}</span>
          <span class="swap-option-title">${content.title}</span>
        </button>`;
      }).join('');
      panel.querySelectorAll('[data-swapdate]').forEach(elm => {
        elm.addEventListener('click', () => {
          performSwap(viewDate, elm.getAttribute('data-swapdate'));
          swapPanelOpen = false;
          renderAll();
        });
      });
    }
  }

  function renderHolidayUI(){
    const content = getContentFor(viewDate);
    const row = document.getElementById('holidayRow');
    const btn = document.getElementById('holidayToggleBtn');
    const panel = document.getElementById('holidayPanel');
    const reasonInput = document.getElementById('holidayReasonInput');

    if (content.sessionType === 'race'){
      row.hidden = true;
      panel.hidden = true;
      return;
    }
    row.hidden = false;
    const onHoliday = isHoliday(viewDate);
    btn.textContent = onHoliday ? '✕ Undo Holiday Mode' : '🏖 Mark as Holiday Mode';
    btn.classList.toggle('active', onHoliday);
    panel.hidden = !onHoliday;
    reasonInput.value = onHoliday ? getHolidayReason(viewDate) : '';
  }

  function renderDay(){
    const slot = DAY_INDEX[viewDate].day;       // fixed calendar info (weekday name)
    const content = getContentFor(viewDate);    // swap-aware content

    document.getElementById('dhName').textContent = slot.dayName;
    document.getElementById('dhDate').textContent = fmtShort(viewDate);

    document.getElementById('prevDayBtn').disabled = viewDate <= PROGRAM_START;
    document.getElementById('nextDayBtn').disabled = viewDate >= PROGRAM_END;

    const card = document.getElementById('sessionCard');
    card.className = `session-card type-${content.sessionType}`;
    card.style.setProperty('--session-accent', accentVar(content.sessionType));

    document.getElementById('sessionTag').className = `session-tag type-${content.sessionType}`;
    document.getElementById('sessionTag').textContent =
      { gym:'Gym', run:'Run', rest:'Rest', race:'Race Day' }[content.sessionType];
    document.getElementById('swappedBadge').hidden = !isSwapped(viewDate);
    document.getElementById('sessionTitle').textContent = content.title;
    document.getElementById('sessionSubtitle').textContent = content.subtitle || '';

    const rail = document.getElementById('stationRail');
    if (content.sessionType === 'rest'){
      rail.innerHTML = restBlockHTML(content, viewDate);
    } else if (content.sessionType === 'race'){
      rail.innerHTML = raceBlockHTML(content, viewDate);
    } else {
      rail.innerHTML = content.blocks.map((b,i) => stationHTML(content, viewDate, i)).join('');
    }

    rail.querySelectorAll('[data-toggle]').forEach(elm => {
      elm.addEventListener('click', () => {
        const idx = Number(elm.getAttribute('data-toggle'));
        toggleChecked(viewDate, idx);
        renderAll();
      });
    });
    rail.querySelectorAll('.log-row').forEach(row => {
      const name = row.getAttribute('data-logname');
      const inputs = row.querySelectorAll('.log-input');
      inputs.forEach(inp => {
        inp.addEventListener('change', () => {
          const values = {};
          inputs.forEach(i2 => { values[i2.getAttribute('data-logfield')] = i2.value.trim(); });
          if (Object.values(values).some(v => v)){
            saveExerciseEntry(name, viewDate, values);
          }
        });
      });
    });
    const timeInput = document.getElementById('raceTimeInput');
    if (timeInput){
      timeInput.addEventListener('change', () => saveRaceTime(viewDate, timeInput.value));
    }

    renderSwapUI();
    renderHolidayUI();
  }

  function renderFooter(){
    const real = todayISO();
    let cursor = real > PROGRAM_END ? PROGRAM_END : (real < PROGRAM_START ? null : real);
    let streak = 0;
    if (cursor){
      if (!isDayComplete(cursor) && !isHoliday(cursor)) cursor = addDays(cursor, -1);
      while (cursor >= PROGRAM_START && (isDayComplete(cursor) || isHoliday(cursor))){
        if (!isHoliday(cursor)) streak++;
        cursor = addDays(cursor, -1);
      }
    }
    document.getElementById('streakNum').textContent = streak;

    const totalDone = FLAT_DATES.filter(d => d <= (real > PROGRAM_END ? PROGRAM_END : real) && isDayComplete(d)).length;
    document.getElementById('doneCount').textContent = totalDone;

    const throughDate = real < PROGRAM_START ? null : (real > PROGRAM_END ? PROGRAM_END : real);
    if (throughDate){
      const elapsed = FLAT_DATES.filter(d => d <= throughDate && !isHoliday(d));
      const done = elapsed.filter(d => isDayComplete(d)).length;
      const pct = elapsed.length ? Math.round((done/elapsed.length)*100) : 0;
      document.getElementById('pctNum').textContent = pct + '%';
    } else {
      document.getElementById('pctNum').textContent = '—';
    }
  }

  function renderAll(){
    renderBanner();
    renderPhaseCard();
    renderWeekRail();
    renderDay();
    renderFooter();
  }

  /* ---------------- events ---------------- */
  document.getElementById('prevDayBtn').addEventListener('click', () => {
    viewDate = clampISO(addDays(viewDate, -1));
    swapPanelOpen = false;
    renderAll();
  });
  document.getElementById('nextDayBtn').addEventListener('click', () => {
    viewDate = clampISO(addDays(viewDate, 1));
    swapPanelOpen = false;
    renderAll();
  });
  document.getElementById('todayBtn').addEventListener('click', () => {
    viewDate = clampISO(todayISO());
    swapPanelOpen = false;
    renderAll();
  });
  document.getElementById('swapToggleBtn').addEventListener('click', () => {
    swapPanelOpen = !swapPanelOpen;
    renderSwapUI();
  });
  document.getElementById('switchProfileBtn').addEventListener('click', () => {
    showProfileScreen();
  });
  document.getElementById('holidayToggleBtn').addEventListener('click', () => {
    setHoliday(viewDate, !isHoliday(viewDate), getHolidayReason(viewDate));
    renderAll();
  });
  document.getElementById('holidayReasonInput').addEventListener('change', (e) => {
    if (isHoliday(viewDate)) setHoliday(viewDate, true, e.target.value.trim());
  });
  document.getElementById('addProfileBtn').addEventListener('click', addProfileFromInput);
  document.getElementById('newProfileName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addProfileFromInput();
  });

  boot();
})();
