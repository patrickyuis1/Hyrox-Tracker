# HYROX Daily — Training Tracker

A single-page, no-build web app for the 2026-27 season: Birmingham (done,
1:13:43), London (Fri 4 Dec), Manchester (Sun 24 Jan) and Glasgow (Sun 14
Mar). Open it, see today's session, tap through the exercises, tick them
off. It opens on the right day every time.

Three tabs along the bottom:

- **Plan** — the day's session, week strip, streaks, day swaps, holiday mode,
  exercise logging. During race week a fuel card for that day sits above
  the session.
- **Fuel** — the race-week food plan (D-6 to the day after), scaled to your
  body weight, with a race-day timeline that fits your start time.
- **Mobility** — warm-up, run warm-up, race-day warm-up, cool-down and
  off-day routines, every move with a looping demo. The same routines open
  from the Warm-Up / Cool-Down blocks, run days and rest days.

**Season structure:** 231 days, Mon 3 Aug 2026 to Sun 21 Mar 2027. The
London block was rebuilt after Birmingham (sleds were the weakest stations
vs the field in both races, so race-load sled work is now twice a week).
Manchester and Glasgow each get a seven-week block: recover, build, peak
(full simulation 16 days out), sharpen (half simulation 9 days out), taper.

## What's in this folder

```
index.html                  the app shell
css/style.css               all styling
js/pictograms.js            animated exercise icons (SVG + CSS, no external images)
js/pictograms-mobility.js   animated stretch / warm-up icons
js/program-data.js          the 33-week program - plain, editable data
js/routines-data.js         warm-up, cool-down and off-day routines
js/fuel-data.js             race-week fuel plan: targets, meals, race-day timeline, supplements
js/fuel.js                  the Fuel tab
js/mobility.js              the Mobility tab and routine sheet
js/app.js                   Plan tab, profiles, dates, ticks, logging, tabs, backup, install
sw.js                       service worker - keeps a copy on the phone so it works offline
manifest.webmanifest        name, colours and icons for "install to home screen"
icons/                      app icons
fonts/                      self-hosted fonts (SIL Open Font License, see fonts/LICENSE.txt)
generate_program.py         the script that generated program-data.js (see "Updating the plan")
```

No npm, no build step, no framework. It's plain HTML/CSS/JS, so any static
host works.

## Fuel tab

Set your body weight and the start time for each race once your wave is
announced (London's window is 14:30-15:10, Manchester 08:00-12:10, Glasgow
08:00-12:00). Both are saved to your profile. The race-day timeline changes
with the start time:

- **Before 10:00** — get up 3 h out, smaller breakfast 2.5 h before, and the
  day before has a bigger dinner plus a bedtime carb snack.
- **10:00-12:59** — one pre-race meal 3-4 h before.
- **13:00 or later** — normal breakfast, then a pre-race lunch 3-4 h before.

D-6 to D-3 follow whatever session that day holds (rest day or training),
so swapping days doesn't break the plan.

## Running it locally

Just open `index.html` in a browser — double-click it, or drag it into a tab.
If your browser blocks local scripts from loading (rare, but Chrome
occasionally does under `file://`), run a tiny local server instead from
this folder:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Exercise history (what to progress from next time)

Any exercise where "last time" matters gets logging fields matched to what
actually varies for that movement:

- **Weight only** — Back Squat, Pause Squat, RDL, Bulgarian Split Squat, Leg
  Extension, Calf Raise, Bench/Spoto/Incline Press, standalone Weighted
  Pull-up, Cable Row, Lateral Raise, Face Pull
- **Weight + Time** — Sled Push, Sled Pull, Farmers Carry, and the "Weighted
  Pull-up or Row Machine" day-1 combo (log weight if you did the pull-up,
  time if you rowed instead)
- **Power Setting + Time** — SkiErg
- **Total Time + Rest Interval + Per (reps/metres)** — Wall Balls and Burpee
  Broad Jumps, so you can see not just the final time but how you paced it
  (e.g. "6:45 total, resting 15s every 20 reps")
- **Distance + Avg HR** — Easy, Tempo, Progression, and Long runs

Fill in whichever fields apply, leave the rest blank — nothing's required.
Next time that exercise comes up you'll see something like "Last: 80kg /
0:14 (3 Aug)" right above the inputs. History follows the exercise name, so
Back Squat and Pause Squat (which alternate week to week) are tracked
separately, as are the standalone "Weighted Pull-up" and the day-1 combo
version.

Like everything else, this is stored per-profile and per-browser.

## Holiday mode

Every non-race day has a **"🏖 Mark as Holiday Mode"** toggle. Turn it on for
a day you'll genuinely miss (travel, no gym access, illness) and optionally
note why. That day won't break your streak and won't count against your
block-adherence percentage — it's excluded from both instead of counted as a
miss. It shows as a small palm-tree marker in the week strip so you can tell
it apart from a day you actually skipped. It's not available on race days
themselves, since those are fixed to the real date regardless.

## Multiple profiles

On load you'll see a "Who's training?" screen. Add your name once and
everything after that — checkboxes, day-swaps, race times — is scoped to
that profile. Add a second name (a training partner, say) and their data is
completely separate from yours; switching between profiles never mixes the
two.

**Important scope of this:** profiles live in **this browser, on this
device** — same as everything else in this app. If a training partner opens
the same URL on *their own* phone, they won't see your name already in the
list; they'll add their own name there and it'll live on their phone only.
This is deliberately the simple, no-backend version — it's genuinely
separate data per person, it just doesn't sync between different people's
devices. If you actually need everyone to see the same shared profile list
from any device (or want your own data to follow you between your phone and
laptop), that needs a real backend/database behind it, which is a bigger
job — let me know if that's what you're after.

## Swapping days

If you won't have gym access on a scheduled gym day (travel, holiday, hotel
gym is a joke, whatever), open that day and tap **"⇄ Swap with another day
this week"**. Pick any other day in the same week and the two sessions trade
places — the run moves to where the gym day was and vice versa. Any progress
you'd already ticked off moves with its session, not the calendar date.

A couple of things worth knowing:
- Swaps are **within the same week only** (Monday-Sunday) — it won't reshuffle
  across week boundaries, since that starts running into the taper/race-week
  timing the whole plan is built around.
- **Race weeks are locked** — those days are fixed around the actual race
  date, so swapping isn't offered there.
- A day that's been moved shows a small **"⇄ moved"** badge so you can tell
  at a glance it's not the original schedule for that date.
- This is stored the same way as your checkboxes — in this browser only.

## How your progress is stored

Checkbox state lives in your browser's `localStorage` — nothing is sent
anywhere, there's no login and no backend. That also means:

- Progress is **per browser, per device**. Checking things off on your
  phone won't show up on your laptop unless you use the same browser
  profile with sync enabled (e.g. Chrome signed into the same Google
  account on both).
- Clearing your browser's site data for this page will reset it - so back
  it up first (below).

## Backing up and moving to a new phone

Tap **Switch** (top right) to reach the profile screen. Under "Your data on
this device":

- **Back up to a file** saves `hyrox-daily-backup-<date>.json` to your
  downloads. It holds every profile on the device: ticks, logged weights
  and times, day swaps, holiday days, race times and fuel settings.
- **Restore from a file** loads a backup and replaces what's on the device
  (it asks first). Use it on a new phone, or after clearing browser data.

A backup now and then (say, after each race) is cheap insurance.

## Install it and use it offline

Once it's hosted (GitHub Pages is https, which this needs), open the link
on your phone:

- **Android / Chrome:** a banner offers **Install**; or ⋮ menu → Install app.
- **iPhone / Safari:** Share → Add to Home Screen.

It then opens full-screen from its own icon, and keeps working with no
signal - handy in a basement gym. When you're online it always loads the
latest version you've uploaded; offline it uses the copy on the phone. If
you ever re-upload changed files, also upload the new `sw.js` so phones
drop the old copy.

## Deploying to GitHub Pages

**No terminal needed (simplest path):**
1. Unzip this folder on your computer.
2. On github.com: **+ → New repository** → give it a name → **Public** → Create (leave "add a README" unchecked).
3. On the new repo's page, click **"uploading an existing file"**, then drag in everything inside the `hyrox-tracker` folder - `index.html`, `sw.js`, `manifest.webmanifest`, and the `css`, `js`, `fonts` and `icons` folders - all at once (GitHub accepts folders dropped into that box). Commit.
4. **Settings → Pages** → under "Build and deployment", **Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
5. You'll get a live URL like `https://<you>.github.io/<repo>/` within a minute or two — works from any browser, any device, not just this computer. Bookmark it or add it to your phone's home screen (Safari: Share → Add to Home Screen; Chrome Android: ⋮ → Add to Home screen).

**With the terminal**, if you'd rather:
   ```
   git init
   git add .
   git commit -m "HYROX daily tracker"
   git branch -M main
   git remote add origin https://github.com/<you>/hyrox-daily.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages** → under "Build and deployment", set
   **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
   Save.
3. GitHub gives you a URL like `https://<you>.github.io/hyrox-daily/`
   within a minute or two. Bookmark it / add it to your phone's home
   screen (Safari: Share → Add to Home Screen; Chrome Android: ⋮ → Add to
   Home screen) so it opens like an app.

## Deploying to Google Cloud

Two reasonable options — Firebase Hosting is the faster path:

**Firebase Hosting** (free tier covers this easily):
```
npm install -g firebase-tools
firebase login
firebase init hosting     # choose "Use an existing project" or create one;
                           # public directory: type "." (this folder);
                           # configure as single-page app: No
firebase deploy
```
You'll get a `https://<project-id>.web.app` URL.

**Cloud Storage static website** (alternative, no Firebase):
```
gsutil mb gs://<your-bucket-name>
gsutil web set -m index.html gs://<your-bucket-name>
gsutil rsync -R . gs://<your-bucket-name>
gsutil iam ch allUsers:objectViewer gs://<your-bucket-name>
```
Served at `https://storage.googleapis.com/<your-bucket-name>/index.html`
(or map a custom domain via Cloud CDN/Load Balancer if you want a clean URL).

## Updating the plan as training data comes in

`js/program-data.js` is plain data — a `PROGRAM` object with `weeks[].days[].blocks[]`.
Each block is `{name, pattern, prescription, detail, cue, videoQuery}`. To
hand-edit any single day, just open the file, find the date, change the
text, save, redeploy (or just refresh if running locally).

For bigger structural changes, `generate_program.py` is the script that
built the whole file from the periodization logic — it's commented with the
phase-by-phase reasoning (sled progression, simulation build-up, taper). Re-run
it with `python3 generate_program.py` after editing to regenerate
`program-data.js` from scratch. Either approach is fine; the file is just
JSON-shaped data either way.

The natural workflow going forward: send me updated Samsung Health /
Mywellness exports periodically, and I'll hand you back an updated
`program-data.js` (or specific day edits) reflecting how you're actually
responding — same as the coaching plan itself.

## Exercise visuals

Every exercise has an original animated icon (built from scratch — no
hotlinked GIFs, so nothing ever breaks or 404s once deployed) plus a "Watch
a demo ↗" link that opens a YouTube search for that movement, for when you
want to see the real thing.
