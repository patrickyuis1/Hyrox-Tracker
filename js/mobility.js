/* =====================================================================
   MOBILITY — warm-up, cool-down and off-day routines (routines-data.js),
   shown as a tab and as a sheet opened from a session.
   ===================================================================== */
const MobilityUI = (function(){
  "use strict";
  let ctx = null;
  let current = null;

  function init(c){ ctx = c; }

  // Which routine a session block links to.
  function routineForBlock(name){
    if (name === 'Warm-Up') return 'gymWarmup';
    if (name === 'Cool-Down' || name === 'Cool-Down + Mobility') return 'cooldown';
    return null;
  }
  // A sensible default for the day being viewed.
  function routineForSession(type){
    return { gym: 'gymWarmup', run: 'runWarmup', race: 'raceWarmup', rest: 'offday' }[type] || 'gymWarmup';
  }

  function stepsHTML(key){
    const r = ROUTINES[key];
    return `<ol class="moves">${r.steps.map((s, i) => `
      <li class="move">
        <div class="move-ic" aria-hidden="true">${PICTOGRAMS[s.pattern] || PICTOGRAMS.core}</div>
        <div class="move-body">
          <div class="move-top"><span class="move-n">${i + 1}</span><span class="move-name">${ctx.escapeHtml(s.name)}</span></div>
          <div class="move-dose">${ctx.escapeHtml(s.dose)}</div>
          ${s.cue ? `<div class="move-cue">${ctx.escapeHtml(s.cue)}</div>` : ''}
        </div>
      </li>`).join('')}</ol>`;
  }

  function headHTML(key){
    const r = ROUTINES[key];
    return `<div class="routine-head">
      <h2 class="routine-name">${ctx.escapeHtml(r.name)}</h2>
      <span class="routine-dur">${ctx.escapeHtml(r.duration)}</span>
    </div>
    <p class="routine-when">${ctx.escapeHtml(r.when)}</p>`;
  }

  function renderTab(el, preferred){
    if (preferred && ROUTINES[preferred]) current = preferred;
    if (!current) current = 'gymWarmup';
    el.innerHTML = `
      <div class="view-head">
        <div class="eyebrow">Mobility</div>
        <h1 class="view-title">Warm-ups, cool-downs, off days</h1>
        <p class="view-sub">Every move has a looping demo. Tap a routine.</p>
      </div>
      <div class="routine-chips" role="tablist" aria-label="Routine">
        ${ROUTINE_ORDER.map(k => `<button class="routine-chip ${k === current ? 'is-on' : ''}" role="tab" aria-selected="${k === current}" data-rt="${k}">${ctx.escapeHtml(ROUTINES[k].tab)}</button>`).join('')}
      </div>
      <section class="routine-card">${headHTML(current)}${stepsHTML(current)}</section>`;
    el.querySelectorAll('[data-rt]').forEach(b => b.addEventListener('click', () => {
      current = b.getAttribute('data-rt');
      renderTab(el);
    }));
  }

  return { init, renderTab, stepsHTML, routineForBlock, routineForSession };
})();
