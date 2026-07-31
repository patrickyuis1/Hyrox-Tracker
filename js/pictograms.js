/**
 * PICTOGRAMS
 * Original animated movement icons — no external images, no hotlinked GIFs.
 * Each is a self-contained SVG with its own <style> block, built from a shared
 * "stick figure" skeleton (head / torso / arms / legs) so every exercise gets
 * a distinct, recognizable loop without depending on any external asset.
 *
 * Color is driven by `currentColor`, so the parent element's `color` sets the tint.
 */

const FIG_HEAD = `<circle class="p-head" cx="50" cy="14" r="8"/>`;

function svgWrap(name, inner, style) {
  return `<svg class="pictogram pictogram--${name}" viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg">
    <style>${style}</style>
    ${inner}
  </svg>`;
}

const BASE_CSS = `
  .pictogram{ width:100%; height:100%; overflow:visible; }
  .pictogram *{ fill:none; stroke:currentColor; stroke-width:6; stroke-linecap:round; stroke-linejoin:round; }
  .pictogram .p-head{ fill:currentColor; stroke:none; }
  .pictogram .p-fill{ fill:currentColor; stroke:none; }
`;

const PICTOGRAMS = {

  /* ---------- SQUAT (Back Squat / Pause Squat / Leg Extension) ---------- */
  squat: svgWrap('squat', `
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="16" r="8"/>
      <line class="p-bar" x1="30" y1="24" x2="70" y2="24"/>
      <line class="p-torso" x1="50" y1="24" x2="50" y2="56"/>
      <line class="p-arm-l" x1="50" y1="28" x2="30" y2="24"/>
      <line class="p-arm-r" x1="50" y1="28" x2="70" y2="24"/>
      <g class="p-leg-l"><line x1="50" y1="56" x2="36" y2="80"/><line class="p-shin-l" x1="36" y1="80" x2="34" y2="102"/></g>
      <g class="p-leg-r"><line x1="50" y1="56" x2="64" y2="80"/><line class="p-shin-r" x1="64" y1="80" x2="66" y2="102"/></g>
    </g>`,
    `${BASE_CSS}
     .pictogram--squat .p-rig{ animation: sq-dip 1.8s ease-in-out infinite; transform-origin: 50px 60px; }
     @keyframes sq-dip{ 0%,100%{ transform:translateY(0); } 45%,55%{ transform:translateY(14px); } }
    `),

  /* ---------- LUNGE (Bulgarian Split Squat / Sandbag Lunge) ---------- */
  lunge: svgWrap('lunge', `
    <circle class="p-head" cx="46" cy="16" r="8"/>
    <line class="p-torso" x1="46" y1="24" x2="50" y2="54"/>
    <line class="p-arm-l" x1="47" y1="30" x2="32" y2="42"/>
    <line class="p-arm-r" x1="49" y1="30" x2="64" y2="42"/>
    <g class="p-leg-front"><line x1="50" y1="54" x2="40" y2="76"/><line x1="40" y1="76" x2="42" y2="102"/></g>
    <g class="p-leg-back"><line x1="50" y1="54" x2="66" y2="70"/><line x1="66" y1="70" x2="60" y2="102"/></g>
    `,
    `${BASE_CSS}
     .pictogram--lunge .p-leg-front{ animation: lg-front 1.8s ease-in-out infinite; transform-origin: 50px 54px; }
     .pictogram--lunge .p-leg-back{ animation: lg-back 1.8s ease-in-out infinite; transform-origin: 50px 54px; }
     .pictogram--lunge .p-torso, .pictogram--lunge .p-arm-l, .pictogram--lunge .p-arm-r{ animation: lg-body 1.8s ease-in-out infinite; transform-origin: 50px 54px; }
     @keyframes lg-front{ 0%,100%{ transform:rotate(0deg) translateY(0); } 50%{ transform:rotate(-6deg) translateY(6px); } }
     @keyframes lg-back{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(10deg); } }
     @keyframes lg-body{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(8px); } }
    `),

  /* ---------- HINGE (Romanian Deadlift) ---------- */
  hinge: svgWrap('hinge', `
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="16" r="8"/>
      <line class="p-torso" x1="50" y1="24" x2="50" y2="52"/>
      <line class="p-arm-l" x1="50" y1="30" x2="46" y2="60"/>
      <line class="p-arm-r" x1="50" y1="30" x2="54" y2="60"/>
      <line x1="50" y1="52" x2="46" y2="78"/><line x1="46" y1="78" x2="44" y2="102"/>
      <line x1="50" y1="52" x2="54" y2="78"/><line x1="54" y1="78" x2="56" y2="102"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--hinge .p-rig{ animation: hg 1.9s ease-in-out infinite; transform-origin: 50px 65px; }
     @keyframes hg{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(35deg); } }
    `),

  /* ---------- CALF RAISE ---------- */
  calf: svgWrap('calf', `
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="14" r="8"/>
      <line x1="50" y1="22" x2="50" y2="56"/>
      <line x1="50" y1="28" x2="38" y2="40"/><line x1="50" y1="28" x2="62" y2="40"/>
      <line x1="50" y1="56" x2="42" y2="80"/><line x1="50" y1="56" x2="58" y2="80"/>
      <g class="p-heel-l"><line x1="42" y1="80" x2="42" y2="98"/><line x1="42" y1="98" x2="52" y2="98"/></g>
      <g class="p-heel-r"><line x1="58" y1="80" x2="58" y2="98"/><line x1="58" y1="98" x2="48" y2="98"/></g>
    </g>`,
    `${BASE_CSS}
     .pictogram--calf .p-rig{ animation: cf 1.3s ease-in-out infinite; transform-origin: 50px 98px; }
     @keyframes cf{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-10px); } }
    `),

  /* ---------- PRESS (Bench / Spoto / Incline DB) ---------- */
  press: svgWrap('press', `
    <g transform="translate(0,10) rotate(90 50 50)">
      <circle class="p-head" cx="50" cy="16" r="8"/>
      <line x1="50" y1="24" x2="50" y2="56"/>
      <line x1="50" y1="56" x2="40" y2="80"/><line x1="50" y1="56" x2="60" y2="80"/>
      <g class="p-arms"><line class="p-arm-l" x1="50" y1="30" x2="30" y2="24"/><line class="p-arm-r" x1="50" y1="30" x2="70" y2="24"/></g>
      <line class="p-bar" x1="18" y1="24" x2="82" y2="24"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--press .p-arms, .pictogram--press .p-bar{ animation: pr 1.6s ease-in-out infinite; transform-origin: 50px 30px; }
     @keyframes pr{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(20px); } }
    `),

  /* ---------- PULL-UP ---------- */
  pullup: svgWrap('pullup', `
    <line class="p-bar" x1="20" y1="10" x2="80" y2="10"/>
    <g class="p-rig">
      <line class="p-arm-l" x1="50" y1="16" x2="38" y2="10"/>
      <line class="p-arm-r" x1="50" y1="16" x2="62" y2="10"/>
      <circle class="p-head" cx="50" cy="24" r="8"/>
      <line x1="50" y1="32" x2="50" y2="64"/>
      <line x1="50" y1="64" x2="42" y2="90"/><line x1="50" y1="64" x2="58" y2="90"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--pullup .p-rig{ animation: pu 1.6s ease-in-out infinite; transform-origin: 50px 10px; }
     @keyframes pu{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-18px); } }
    `),

  /* ---------- SEATED CABLE ROW ---------- */
  cablerow: svgWrap('cablerow', `
    <line class="p-cable" x1="88" y1="30" x2="88" y2="70"/>
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="30" r="8"/>
      <line class="p-torso" x1="50" y1="38" x2="52" y2="66"/>
      <line class="p-arm" x1="50" y1="46" x2="86" y2="46"/>
      <line x1="52" y1="66" x2="40" y2="70"/><line x1="40" y1="70" x2="36" y2="98"/>
      <line x1="52" y1="66" x2="64" y2="70"/><line x1="64" y1="70" x2="66" y2="98"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--cablerow .p-torso{ animation: cr-torso 1.6s ease-in-out infinite; transform-origin: 52px 66px; }
     .pictogram--cablerow .p-arm{ animation: cr-arm 1.6s ease-in-out infinite; transform-origin: 50px 46px; }
     @keyframes cr-torso{ 0%,100%{ transform:rotate(8deg); } 50%{ transform:rotate(-6deg); } }
     @keyframes cr-arm{ 0%,100%{ transform:translateX(0); } 50%{ transform:translateX(-30px); } }
    `),

  /* ---------- RAISE (Lateral Raise / Face Pull) ---------- */
  raise: svgWrap('raise', `
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="16" r="8"/>
      <line x1="50" y1="24" x2="50" y2="58"/>
      <line x1="50" y1="58" x2="43" y2="102"/><line x1="50" y1="58" x2="57" y2="102"/>
      <line class="p-arm-l" x1="50" y1="30" x2="30" y2="46"/>
      <line class="p-arm-r" x1="50" y1="30" x2="70" y2="46"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--raise .p-arm-l{ animation: rs-l 1.7s ease-in-out infinite; transform-origin: 50px 30px; }
     .pictogram--raise .p-arm-r{ animation: rs-r 1.7s ease-in-out infinite; transform-origin: 50px 30px; }
     @keyframes rs-l{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-45deg); } }
     @keyframes rs-r{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(45deg); } }
    `),

  /* ---------- FARMERS CARRY ---------- */
  carry: svgWrap('carry', `
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="16" r="8"/>
      <line x1="50" y1="24" x2="50" y2="58"/>
      <line class="p-arm-l" x1="46" y1="30" x2="34" y2="70"/>
      <line class="p-arm-r" x1="54" y1="30" x2="66" y2="70"/>
      <rect class="p-fill" x="28" y="68" width="10" height="16" rx="2"/>
      <rect class="p-fill" x="62" y="68" width="10" height="16" rx="2"/>
      <g class="p-leg-l"><line x1="50" y1="58" x2="40" y2="80"/><line x1="40" y1="80" x2="42" y2="102"/></g>
      <g class="p-leg-r"><line x1="50" y1="58" x2="60" y2="80"/><line x1="60" y1="80" x2="58" y2="102"/></g>
    </g>`,
    `${BASE_CSS}
     .pictogram--carry .p-rig{ animation: cy-bob 0.7s ease-in-out infinite; }
     .pictogram--carry .p-leg-l{ animation: cy-l 0.7s ease-in-out infinite; transform-origin: 50px 58px; }
     .pictogram--carry .p-leg-r{ animation: cy-r 0.7s ease-in-out infinite; transform-origin: 50px 58px; }
     @keyframes cy-bob{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-3px); } }
     @keyframes cy-l{ 0%,100%{ transform:rotate(8deg); } 50%{ transform:rotate(-8deg); } }
     @keyframes cy-r{ 0%,100%{ transform:rotate(-8deg); } 50%{ transform:rotate(8deg); } }
    `),

  /* ---------- SLED PUSH ---------- */
  sledpush: svgWrap('sledpush', `
    <rect class="p-fill p-sled" x="72" y="70" width="20" height="14" rx="2"/>
    <line class="p-post" x1="90" y1="50" x2="90" y2="70"/>
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="34" r="8"/>
      <line class="p-torso" x1="50" y1="42" x2="66" y2="66"/>
      <line class="p-arm" x1="54" y1="46" x2="86" y2="56"/>
      <line x1="66" y1="66" x2="52" y2="80"/><line x1="52" y1="80" x2="60" y2="102"/>
      <line x1="66" y1="66" x2="72" y2="86"/><line x1="72" y1="86" x2="66" y2="102"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--sledpush .p-rig, .pictogram--sledpush .p-sled, .pictogram--sledpush .p-post{ animation: sp 1.1s ease-in-out infinite; }
     @keyframes sp{ 0%,100%{ transform:translateX(0); } 50%{ transform:translateX(-8px); } }
    `),

  /* ---------- SLED PULL ---------- */
  sledpull: svgWrap('sledpull', `
    <rect class="p-fill p-sled" x="8" y="70" width="20" height="14" rx="2"/>
    <line class="p-rope" x1="28" y1="76" x2="60" y2="56"/>
    <g class="p-rig">
      <circle class="p-head" cx="66" cy="34" r="8"/>
      <line class="p-torso" x1="66" y1="42" x2="58" y2="66"/>
      <line class="p-arm" x1="62" y1="48" x2="34" y2="60"/>
      <line x1="58" y1="66" x2="66" y2="80"/><line x1="66" y1="80" x2="60" y2="102"/>
      <line x1="58" y1="66" x2="48" y2="84"/><line x1="48" y1="84" x2="52" y2="102"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--sledpull .p-rig, .pictogram--sledpull .p-sled{ animation: sl 1.1s ease-in-out infinite; }
     @keyframes sl{ 0%,100%{ transform:translateX(0); } 50%{ transform:translateX(8px); } }
    `),

  /* ---------- WALL BALLS ---------- */
  wallball: svgWrap('wallball', `
    <line class="p-target" x1="10" y1="8" x2="10" y2="60"/>
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="20" r="8"/>
      <line class="p-torso" x1="50" y1="28" x2="50" y2="58"/>
      <line class="p-arm-l" x1="50" y1="34" x2="34" y2="14"/>
      <line class="p-arm-r" x1="50" y1="34" x2="66" y2="14"/>
      <circle class="p-ball" cx="50" cy="8" r="7"/>
      <g class="p-leg-l"><line x1="50" y1="58" x2="38" y2="80"/><line x1="38" y1="80" x2="40" y2="102"/></g>
      <g class="p-leg-r"><line x1="50" y1="58" x2="62" y2="80"/><line x1="62" y1="80" x2="60" y2="102"/></g>
    </g>`,
    `${BASE_CSS}
     .pictogram--wallball .p-rig{ animation: wb-rig 1.5s ease-in-out infinite; }
     .pictogram--wallball .p-ball{ animation: wb-ball 1.5s ease-in-out infinite; fill:currentColor; }
     @keyframes wb-rig{ 0%,20%{ transform:translateY(16px); } 55%,70%{ transform:translateY(-6px); } 100%{ transform:translateY(16px); } }
     @keyframes wb-ball{ 0%,20%{ transform:translateY(16px); } 55%{ transform:translateY(-26px); } 100%{ transform:translateY(16px); } }
    `),

  /* ---------- ROW ERG ---------- */
  rowerg: svgWrap('rowerg', `
    <line class="p-rail" x1="10" y1="98" x2="90" y2="98"/>
    <line class="p-chain" x1="90" y1="86" x2="94" y2="86"/>
    <g class="p-rig">
      <circle class="p-head" cx="60" cy="46" r="8"/>
      <line class="p-torso" x1="60" y1="54" x2="44" y2="80"/>
      <line class="p-arm" x1="58" y1="58" x2="88" y2="86"/>
      <line x1="44" y1="80" x2="30" y2="80"/>
      <line x1="44" y1="80" x2="60" y2="70"/><line x1="60" y1="70" x2="70" y2="90"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--rowerg .p-rig{ animation: rw 1.4s ease-in-out infinite; transform-origin: 50px 90px; }
     .pictogram--rowerg .p-arm{ animation: rw-arm 1.4s ease-in-out infinite; transform-origin: 88px 86px; }
     @keyframes rw{ 0%,100%{ transform:translateX(14px); } 50%{ transform:translateX(-10px); } }
     @keyframes rw-arm{ 0%,100%{ transform:scaleX(1); } 50%{ transform:scaleX(0.55); } }
    `),

  /* ---------- SKIERG ---------- */
  skierg: svgWrap('skierg', `
    <line class="p-tower" x1="50" y1="4" x2="50" y2="20"/>
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="26" r="8"/>
      <line class="p-torso" x1="50" y1="34" x2="52" y2="62"/>
      <line class="p-arm-l" x1="49" y1="38" x2="30" y2="16"/>
      <line class="p-arm-r" x1="51" y1="38" x2="70" y2="16"/>
      <line x1="52" y1="62" x2="44" y2="84"/><line x1="44" y1="84" x2="46" y2="102"/>
      <line x1="52" y1="62" x2="60" y2="84"/><line x1="60" y1="84" x2="58" y2="102"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--skierg .p-torso, .pictogram--skierg .p-head{ animation: sk-body 1.3s ease-in-out infinite; transform-origin: 50px 62px; }
     .pictogram--skierg .p-arm-l{ animation: sk-arm-l 1.3s ease-in-out infinite; transform-origin: 49px 38px; }
     .pictogram--skierg .p-arm-r{ animation: sk-arm-r 1.3s ease-in-out infinite; transform-origin: 51px 38px; }
     @keyframes sk-body{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(24deg); } }
     @keyframes sk-arm-l{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(70deg); } }
     @keyframes sk-arm-r{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-70deg); } }
    `),

  /* ---------- RUN ---------- */
  run: svgWrap('run', `
    <g class="p-rig">
      <circle class="p-head" cx="52" cy="16" r="8"/>
      <line class="p-torso" x1="52" y1="24" x2="46" y2="54"/>
      <g class="p-arm-f"><line x1="48" y1="30" x2="64" y2="38"/></g>
      <g class="p-arm-b"><line x1="48" y1="30" x2="34" y2="22"/></g>
      <g class="p-leg-f"><line x1="46" y1="54" x2="64" y2="66"/><line x1="64" y1="66" x2="58" y2="92"/></g>
      <g class="p-leg-b"><line x1="46" y1="54" x2="28" y2="60"/><line x1="28" y1="60" x2="34" y2="86"/></g>
    </g>`,
    `${BASE_CSS}
     .pictogram--run .p-rig{ animation: rn-bob 0.6s ease-in-out infinite; }
     .pictogram--run .p-leg-f{ animation: rn-lf 0.6s ease-in-out infinite; transform-origin: 46px 54px; }
     .pictogram--run .p-leg-b{ animation: rn-lb 0.6s ease-in-out infinite; transform-origin: 46px 54px; }
     .pictogram--run .p-arm-f{ animation: rn-lb 0.6s ease-in-out infinite; transform-origin: 48px 30px; }
     .pictogram--run .p-arm-b{ animation: rn-lf 0.6s ease-in-out infinite; transform-origin: 48px 30px; }
     @keyframes rn-bob{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-5px); } }
     @keyframes rn-lf{ 0%,100%{ transform:rotate(18deg); } 50%{ transform:rotate(-26deg); } }
     @keyframes rn-lb{ 0%,100%{ transform:rotate(-26deg); } 50%{ transform:rotate(18deg); } }
    `),

  /* ---------- CORE (Plank / Russian Twist) ---------- */
  core: svgWrap('core', `
    <g class="p-rig" transform="rotate(90 50 56)">
      <circle class="p-head" cx="50" cy="20" r="8"/>
      <line class="p-torso" x1="50" y1="28" x2="50" y2="56"/>
      <line x1="50" y1="32" x2="34" y2="56"/>
      <line x1="50" y1="56" x2="50" y2="84"/>
    </g>
    <line class="p-floor" x1="10" y1="86" x2="90" y2="86"/>
    `,
    `${BASE_CSS}
     .pictogram--core .p-torso{ animation: co 2.4s ease-in-out infinite; transform-origin: 50px 56px; }
     @keyframes co{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(8deg); } }
    `),

  /* ---------- BURPEE BROAD JUMP ---------- */
  burpee: svgWrap('burpee', `
    <g class="p-rig">
      <circle class="p-head" cx="50" cy="20" r="8"/>
      <line class="p-torso" x1="50" y1="28" x2="50" y2="56"/>
      <line x1="50" y1="34" x2="30" y2="48"/><line x1="50" y1="34" x2="70" y2="48"/>
      <line x1="50" y1="56" x2="36" y2="80"/><line x1="36" y1="80" x2="38" y2="102"/>
      <line x1="50" y1="56" x2="64" y2="80"/><line x1="64" y1="80" x2="62" y2="102"/>
    </g>`,
    `${BASE_CSS}
     .pictogram--burpee .p-rig{ animation: bp 1.4s cubic-bezier(.45,0,.55,1) infinite; }
     @keyframes bp{
       0%{ transform:translate(-16px,26px) scaleY(0.55); }
       35%{ transform:translate(-16px,26px) scaleY(0.55); }
       55%{ transform:translate(0,0) scaleY(1); }
       75%{ transform:translate(10px,-16px) scaleY(1); }
       100%{ transform:translate(-16px,26px) scaleY(0.55); }
     }
    `),

  /* ---------- REST ---------- */
  rest: svgWrap('rest', `
    <path class="p-moon" d="M62 14 A26 26 0 1 0 62 98 A32 32 0 0 1 62 14 Z" />
    `,
    `${BASE_CSS}
     .pictogram--rest .p-moon{ fill:currentColor; stroke:none; opacity:0.9; }
    `),

};

if (typeof module !== 'undefined') { module.exports = { PICTOGRAMS }; }
