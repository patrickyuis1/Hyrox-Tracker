/**
 * MOBILITY PICTOGRAMS
 * Warm-up, cool-down and off-day movements, drawn in the same stick-figure
 * style as pictograms.js (same viewBox, stroke and currentColor tint).
 * Moves that change shape (cat-cow, inchworm, dead bug...) are drawn as 2-4
 * key poses that cross-fade; simple ones use a transform loop. With reduced
 * motion turned on, every icon rests on its first pose.
 * Requires pictograms.js (svgWrap, BASE_CSS, PICTOGRAMS) to load first.
 */
(function(){
  const L = (x1,y1,x2,y2,c='') => `<line${c?` class="${c}"`:''} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const P = (pts,c='') => `<polyline${c?` class="${c}"`:''} points="${pts}"/>`;
  const H = (cx,cy) => `<circle class="p-head" cx="${cx}" cy="${cy}" r="8"/>`;
  const FLOOR = `<line class="p-floor" x1="2" y1="106" x2="98" y2="106"/>`;
  const EXTRA = `
    .pictogram .p-floor, .pictogram .p-prop{ stroke-width:3; opacity:.35; }
    .pictogram .p-far{ opacity:.4; }
    .pictogram .p-thin{ stroke-width:3; }
    .pictogram .p-soft{ fill:currentColor; stroke:none; opacity:.35; }
  `;

  function simple(name, inner, css){
    return svgWrap(name, inner, BASE_CSS + EXTRA + css);
  }

  // Cross-fade between key poses. Each frame holds for most of its slot,
  // then fades into the next over ~5% of the cycle.
  function framed(name, frames, dur, css=''){
    const n = frames.length, fade = 5;
    let kfs = '', inner = '';
    frames.forEach((f, i) => {
      const a = i / n * 100, b = (i + 1) / n * 100;
      const k = `${name}-f${i}`;
      const pct = v => `${Math.max(0, Math.min(100, v)).toFixed(1)}%`;
      let body;
      if (i === 0) body = `0%{opacity:1} ${pct(b - fade)}{opacity:1} ${pct(b)}{opacity:0} ${pct(100 - fade)}{opacity:0} 100%{opacity:1}`;
      else body = `0%{opacity:0} ${pct(a - fade)}{opacity:0} ${pct(a)}{opacity:1} ${pct(b - fade)}{opacity:1} ${pct(b)}{opacity:0} 100%{opacity:0}`;
      kfs += `@keyframes ${k}{${body}}
        .pictogram--${name} .f${i}{ animation:${k} ${dur}s linear infinite; ${i === 0 ? '' : 'opacity:0;'} }`;
      inner += `<g class="f${i}">${f}</g>`;
    });
    return svgWrap(name, inner, BASE_CSS + EXTRA + kfs + css);
  }

  Object.assign(PICTOGRAMS, {

    /* Walk — easy walk / jog */
    walk: simple('walk', `
      <g class="p-rig">
        ${H(52,14)}
        ${L(52,22,50,56)}
        <g class="p-arm-f">${P('51,29 58,42 62,54')}</g>
        <g class="p-arm-b">${P('51,29 44,42 40,52')}</g>
        <g class="p-leg-f">${P('50,56 58,79 60,102')}</g>
        <g class="p-leg-b">${P('50,56 44,79 40,102')}</g>
      </g>`, `
      .pictogram--walk .p-leg-f{ animation: wk-a 1.2s ease-in-out infinite; transform-origin:50px 56px; }
      .pictogram--walk .p-leg-b{ animation: wk-b 1.2s ease-in-out infinite; transform-origin:50px 56px; }
      .pictogram--walk .p-arm-f{ animation: wk-b 1.2s ease-in-out infinite; transform-origin:51px 29px; }
      .pictogram--walk .p-arm-b{ animation: wk-a 1.2s ease-in-out infinite; transform-origin:51px 29px; }
      @keyframes wk-a{ 0%,100%{ transform:rotate(-14deg); } 50%{ transform:rotate(12deg); } }
      @keyframes wk-b{ 0%,100%{ transform:rotate(12deg); } 50%{ transform:rotate(-14deg); } }
    `),

    /* Leg swings — holding a wall, swinging the free leg */
    legswing: simple('legswing', `
      <line class="p-prop" x1="18" y1="18" x2="18" y2="106"/>
      ${H(54,14)}
      ${L(54,22,54,56)}
      ${P('54,30 38,40 22,40')}
      ${P('54,56 52,80 54,102')}
      <g class="p-swing">${P('54,56 56,80 56,102')}</g>`, `
      .pictogram--legswing .p-swing{ animation: ls-sw 1.4s ease-in-out infinite; transform-origin:54px 56px; }
      @keyframes ls-sw{ 0%,100%{ transform:rotate(-40deg); } 50%{ transform:rotate(32deg); } }
    `),

    /* World's greatest stretch — deep lunge, elbow to instep, rotate to the ceiling */
    wgs: framed('wgs', [
      `${H(78,52)} ${L(52,78,70,60)} ${P('52,78 34,90 14,100')} ${P('52,78 74,80 78,102')}
       ${L(70,62,72,100)} ${P('70,62 66,82 62,96')}`,
      `${H(78,52)} ${L(52,78,70,60)} ${P('52,78 34,90 14,100')} ${P('52,78 74,80 78,102')}
       ${L(70,62,72,100)} ${L(70,62,70,30)}`,
    ], 3.2),

    /* Ankle rocks — half-kneeling, front knee drives toward the wall */
    anklerock: framed('anklerock', [
      `<line class="p-prop" x1="92" y1="40" x2="92" y2="106"/> ${FLOOR}
       ${H(46,30)} ${L(44,38,42,70)} ${P('42,70 30,102 12,102')} ${P('42,70 64,72 70,102')} ${L(44,46,62,68)}`,
      `<line class="p-prop" x1="92" y1="40" x2="92" y2="106"/> ${FLOOR}
       ${H(54,30)} ${L(52,38,48,70)} ${P('48,70 30,102 12,102')} ${P('48,70 76,74 70,102')} ${L(52,46,72,70)}`,
    ], 1.8),

    /* Glute bridge — on the back, hips up and down */
    bridge: framed('bridge', [
      `${FLOOR} ${H(14,96)} ${L(24,100,56,100)} ${P('56,100 72,80 80,102')} ${L(26,101,46,103)}`,
      `${FLOOR} ${H(14,96)} ${L(24,100,52,82)} ${P('52,82 74,80 80,102')} ${L(26,101,46,103)}`,
    ], 2.2),

    /* Inchworm — fold, walk the hands out to a plank */
    inchworm: framed('inchworm', [
      `${FLOOR} ${H(58,90)} ${L(42,102,44,58)} ${L(44,58,54,84)} ${L(52,82,56,102)}`,
      `${FLOOR} ${H(76,82)} ${L(32,102,48,62)} ${L(48,62,68,82)} ${L(68,82,72,102)}`,
      `${FLOOR} ${H(86,74)} ${L(16,102,48,90)} ${L(48,90,76,80)} ${L(76,80,76,102)}`,
    ], 3.6),

    /* Band pull-aparts — front view, arms from narrow to wide */
    pullapart: simple('pullapart', `
      ${H(50,14)}
      ${L(50,22,50,60)}
      ${L(50,60,42,102)} ${L(50,60,58,102)}
      <g class="p-arms">${L(50,30,20,36)} ${L(50,30,80,36)} <line class="p-thin" x1="20" y1="36" x2="80" y2="36"/></g>`, `
      .pictogram--pullapart .p-arms{ animation: pa 1.6s ease-in-out infinite; transform-origin:50px 33px; }
      @keyframes pa{ 0%,100%{ transform:scaleX(.3); } 50%{ transform:scaleX(1); } }
    `),

    /* A-skips — alternating high knees with a skip */
    askip: framed('askip', [
      `${H(52,12)} ${L(52,20,50,54)} ${P('51,27 62,38 70,30')} <g class="p-far">${P('51,27 40,40 36,50')}</g>
       ${P('50,54 70,54 66,76')} <g class="p-far">${P('50,54 48,78 48,100')}</g>`,
      `${H(52,12)} ${L(52,20,50,54)} <g class="p-far">${P('51,27 62,38 70,30')}</g> ${P('51,27 40,40 36,50')}
       <g class="p-far">${P('50,54 70,54 66,76')}</g> ${P('50,54 48,78 48,100')}`,
    ], 0.9, `
      .pictogram--askip .f0, .pictogram--askip .f1{ transform-box:view-box; }
    `),

    /* Pogo hops — small stiff-ankle bounces */
    pogo: simple('pogo', `
      <line class="p-floor" x1="30" y1="106" x2="70" y2="106"/>
      <g class="p-rig">
        ${H(50,14)} ${L(50,22,50,58)}
        ${P('50,30 40,44 40,56')} ${P('50,30 60,44 60,56')}
        ${P('50,58 46,80 46,100')} ${P('50,58 54,80 54,100')}
      </g>`, `
      .pictogram--pogo .p-rig{ animation: pg .5s cubic-bezier(.3,0,.7,1) infinite; }
      @keyframes pg{ 0%,100%{ transform:translateY(4px); } 50%{ transform:translateY(-8px); } }
    `),

    /* Couch stretch — back shin up the wall, hips forward */
    couch: simple('couch', `
      <line class="p-prop" x1="12" y1="56" x2="12" y2="106"/> ${FLOOR}
      ${P('22,102 16,72')}
      <g class="p-up">${H(44,32)} ${L(42,40,40,74)} ${L(42,46,60,70)}</g>
      ${L(22,102,40,74)}
      ${P('40,74 64,76 66,102')}`, `
      .pictogram--couch .p-up{ animation: cs 3s ease-in-out infinite; transform-origin:40px 74px; }
      @keyframes cs{ 0%,100%{ transform:translateX(0) rotate(0deg); } 50%{ transform:translateX(3px) rotate(-4deg); } }
    `),

    /* Supine hamstring stretch — leg up with a band */
    hamstring: simple('hamstring', `
      ${FLOOR} ${H(14,96)} ${L(24,100,56,100)} ${L(56,100,94,102)}
      <g class="p-leg">${L(56,100,64,48)} <line class="p-thin" x1="64" y1="48" x2="40" y2="80"/></g>
      ${P('26,100 34,86 42,80')}`, `
      .pictogram--hamstring .p-leg{ animation: hs 3.2s ease-in-out infinite; transform-origin:56px 100px; }
      @keyframes hs{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-10deg); } }
    `),

    /* Calf stretch — hands on the wall, back heel down */
    calfstretch: simple('calfstretch', `
      <line class="p-prop" x1="90" y1="16" x2="90" y2="106"/>
      <g class="p-up">${H(70,26)} ${L(64,34,48,62)} ${L(62,38,88,40)}</g>
      ${L(48,62,20,102)} ${L(14,102,20,102)}
      ${P('48,62 66,80 62,102')}`, `
      .pictogram--calfstretch .p-up{ animation: cf2 3s ease-in-out infinite; transform-origin:48px 62px; }
      @keyframes cf2{ 0%,100%{ transform:translateX(0); } 50%{ transform:translateX(3px); } }
    `),

    /* Pigeon — front shin folded, back leg long, ease forward */
    pigeon: simple('pigeon', `
      ${FLOOR}
      ${L(46,94,6,102)}
      ${P('46,94 76,100 54,103')}
      <g class="p-up">${H(56,56)} ${L(52,64,46,94)} ${L(52,70,66,100)}</g>`, `
      .pictogram--pigeon .p-up{ animation: pgn 4s ease-in-out infinite; transform-origin:46px 94px; }
      @keyframes pgn{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(26deg); } }
    `),

    /* Child's pose — hips to heels, arms long */
    childpose: simple('childpose', `
      ${FLOOR}
      ${P('12,102 46,102 20,84')}
      <g class="p-up">${L(20,84,58,90)} ${H(66,96)} ${L(58,92,94,101)}</g>`, `
      .pictogram--childpose .p-up{ animation: chp 4s ease-in-out infinite; transform-origin:20px 84px; }
      @keyframes chp{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-3px); } }
    `),

    /* Doorway chest stretch — forearm on the frame, lean through */
    chest: simple('chest', `
      <line class="p-prop" x1="36" y1="6" x2="36" y2="106"/>
      <g class="p-up">${H(56,16)} ${L(54,24,54,58)} ${P('54,32 38,32 38,12')} ${L(54,34,66,48)}</g>
      ${P('54,58 64,80 70,102')} ${P('54,58 46,80 42,102')}`, `
      .pictogram--chest .p-up{ animation: chs 3s ease-in-out infinite; transform-origin:54px 58px; }
      @keyframes chs{ 0%,100%{ transform:translateX(0); } 50%{ transform:translateX(4px); } }
    `),

    /* Belly breathing — on the back, slow 4 in / 4 out */
    breathe: simple('breathe', `
      ${FLOOR} ${H(14,96)} ${L(24,100,56,100)} ${P('56,100 70,80 80,102')} ${L(26,101,44,103)}
      <circle class="p-soft p-belly" cx="40" cy="88" r="8"/>`, `
      .pictogram--breathe .p-belly{ animation: br 8s ease-in-out infinite; transform-origin:40px 96px; transform-box:view-box; }
      @keyframes br{ 0%,100%{ transform:scale(.5); } 50%{ transform:scale(1.25); } }
    `),

    /* Cat-cow — on all fours, round then arch */
    catcow: framed('catcow', [
      `${FLOOR} <path d="M30 66 Q50 44 70 64"/> ${H(80,82)} ${L(70,64,70,102)} ${P('30,66 30,102 10,102')}`,
      `${FLOOR} <path d="M30 64 Q50 84 70 64"/> ${H(80,54)} ${L(70,64,70,102)} ${P('30,64 30,102 10,102')}`,
    ], 4),

    /* Thoracic open book — side-lying from above, top arm opens across */
    openbook: simple('openbook', `
      ${H(14,66)} ${L(24,68,58,68)} ${P('58,68 58,44 80,44')} ${L(26,68,26,42)}
      <g class="p-arm">${L(26,68,26,40)}</g>`, `
      .pictogram--openbook .p-arm{ animation: ob 4s ease-in-out infinite; transform-origin:26px 68px; }
      @keyframes ob{ 0%,15%{ transform:rotate(0deg); } 50%,65%{ transform:rotate(-180deg); } 100%{ transform:rotate(0deg); } }
    `),

    /* Dead bug — opposite arm and leg reach long, back stays flat */
    deadbug: framed('deadbug', [
      `${FLOOR} ${H(14,96)} ${L(24,100,56,100)} ${L(28,100,28,66)} ${P('56,100 56,76 76,76')}`,
      `${FLOOR} ${H(14,96)} ${L(24,100,56,100)} ${L(28,100,4,92)} <g class="p-far">${L(28,100,28,66)} ${P('56,100 56,76 76,76')}</g> ${L(56,100,94,94)}`,
      `${FLOOR} ${H(14,96)} ${L(24,100,56,100)} ${L(28,100,28,66)} ${P('56,100 56,76 76,76')}`,
      `${FLOOR} ${H(14,96)} ${L(24,100,56,100)} <g class="p-far">${L(28,100,4,92)} ${L(56,100,94,94)}</g> ${L(28,100,28,66)} ${P('56,100 56,76 76,76')}`,
    ], 4.8),

    /* Deep squat hold — elbows push the knees out, gentle rock */
    deepsquat: simple('deepsquat', `
      ${FLOOR}
      <g class="p-rig">${H(54,46)} ${L(52,54,38,86)} ${P('52,60 64,74 60,62')} ${P('38,86 64,80 52,102')}</g>`, `
      .pictogram--deepsquat .p-rig{ animation: dsq 3s ease-in-out infinite; transform-origin:52px 102px; }
      @keyframes dsq{ 0%,100%{ transform:translateX(-2px); } 50%{ transform:translateX(3px); } }
    `),

    /* Foam roller — forearm plank over the roller, rolling up and down the quads */
    foamroll: simple('foamroll', `
      ${FLOOR}
      <circle class="p-thin" cx="46" cy="99" r="6"/>
      <g class="p-rig">${H(82,76)} ${L(14,100,72,86)} ${P('72,86 72,102 88,102')}</g>`, `
      .pictogram--foamroll .p-rig{ animation: fr 2.4s ease-in-out infinite; }
      @keyframes fr{ 0%,100%{ transform:translateX(-8px); } 50%{ transform:translateX(6px); } }
    `),
  });
})();
