#!/usr/bin/env python3
"""
Generates js/program-data.js — the full 18-week day-by-day program.

Design:
- The athlete's EXISTING heavy lift program (Back Squat, RDL, Bulgarian Split
  Squat, Leg Extension, Calf Raise / Bench, Spoto, Incline DB, Pull-up, Cable
  Row, Lateral Raise, Face Pull) is treated as already established and is NOT
  re-periodized here — prescription stays constant (the athlete keeps
  progressing load on their own scheme), only the exercise-of-the-day rotates
  for variety.
- What DOES progress week-to-week is exactly what the Cardiff Doubles result
  flagged: sled push/pull speed-under-fatigue, Roxzone transitions,
  compromised running, and simulation scope (stations 1-3 -> full 8-station).
- Week 1 is hand-authored to match exactly what was already given to the athlete.
- Weeks 4, 8, 11, 17 are benchmark/milestone weeks (hand-tuned).
- Race weeks (13, 18) are hand-authored in full.
"""

import json
from datetime import date, timedelta

PROGRAM_START = date(2026, 8, 3)  # Monday, Week 1 Day 1
RACE1 = date(2026, 11, 1)
RACE2 = date(2026, 12, 4)
RACES = [
    {"id": "race1", "label": "Race 1", "city": "Birmingham", "date": "2026-11-01", "result": "1:13:43"},
    {"id": "race2", "label": "Race 2", "city": "London", "date": "2026-12-04", "startWindow": ["14:30", "15:10"]},
    {"id": "race3", "label": "Race 3", "city": "Manchester", "date": "2027-01-24", "startWindow": ["08:00", "12:10"]},
    {"id": "race4", "label": "Race 4", "city": "Glasgow", "date": "2027-03-14", "startWindow": ["08:00", "12:00"]},
]

DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

# ---------------------------------------------------------------------------
# Reusable exercise-block builders
# ---------------------------------------------------------------------------

def blk(name, pattern, prescription, detail="", cue="", video=None):
    b = {"name": name, "pattern": pattern, "prescription": prescription, "detail": detail, "cue": cue}
    if video:
        b["videoQuery"] = video
    return b

# ---------------------------------------------------------------------------
# Warm-up / cool-down — added to every gym day so the session actually spans
# a realistic ~70-80min gym visit, not just the "new" work being tracked.
# Three tiers: thorough (benchmark/simulation days), light (taper/race/
# recovery weeks - shorter on purpose), standard (everything else).
# ---------------------------------------------------------------------------

def warmup_block(category="standard"):
    if category == "thorough":
        return blk("Warm-Up", "run", "12-15 min",
                    "Easy bike or row, then full dynamic mobility (leg swings, hip openers, ankle rocks, band work), finishing with 2-3 short build-up efforts.",
                    "This is a maximal-effort day - don't rush this.")
    if category == "light":
        return blk("Warm-Up", "run", "5-8 min",
                    "Easy movement - just enough to feel ready.",
                    "Keep it light - this session is intentionally shorter this week.")
    return blk("Warm-Up", "run", "8-10 min",
                "Easy bike or row, then dynamic mobility - leg swings, hip openers, ankle rocks.", "")

def cooldown_block(category="standard"):
    if category == "thorough":
        return blk("Cool-Down + Mobility", "core", "10-12 min",
                    "Easy walk or spin, then extended stretching - hips, hamstrings, shoulders, calves.",
                    "Prioritise recovery after a maximal effort.")
    if category == "light":
        return blk("Cool-Down", "core", "5 min", "Easy movement + a brief stretch.", "")
    return blk("Cool-Down + Mobility", "core", "8-10 min",
                "Easy walk or spin, then static stretching - hips, hamstrings, shoulders.", "")

def gym_intensity_category(week_num, day):
    title = day["title"].upper()
    if "SIMULATION" in title or "BENCHMARK" in title:
        return "thorough"
    if week_num in (12, 13, 14, 15, 18, 19, 25, 26, 32, 33):
        return "light"
    return "standard"

# ---------------------------------------------------------------------------
# Logging metadata — which blocks get a "log this for next time" input, and
# exactly which fields. Each exercise gets a FIELD LIST (not a fixed "type"),
# so combos like "weight AND time" or "total time + pacing" are just longer
# lists, rather than needing a new type name per combination.
# ---------------------------------------------------------------------------

def field(key, label, placeholder, inputmode="text", unit=""):
    return {"key": key, "label": label, "placeholder": placeholder, "inputmode": inputmode, "unit": unit}

LOG_WEIGHT      = [field("weight", "Weight", "kg", "decimal", "kg")]
LOG_TIME        = [field("time", "Time", "mm:ss", "numeric", "")]
LOG_WEIGHT_TIME = [field("weight", "Load", "kg", "decimal", "kg"), field("time", "Time", "mm:ss", "numeric", "")]
LOG_DISTANCE_HR = [field("distance", "Distance", "km", "decimal", "km"), field("hr", "Avg HR", "bpm", "numeric", "bpm")]
LOG_SKIERG      = [field("power", "Power Setting", "e.g. 8", "numeric", ""), field("time", "Time", "mm:ss", "numeric", "")]
LOG_PULLUP_OR_ROW = [field("weight", "Weight (pull-up)", "kg", "decimal", "kg"), field("time", "Time (row)", "mm:ss", "numeric", "")]
# Pacing schemas: total time, how long each rest break was, and how often
# (every N reps / every N metres) - lets you compare pacing strategy, not
# just the final time.
LOG_WALLBALL = [
    field("time", "Total Time", "mm:ss", "numeric", ""),
    field("restTime", "Rest Interval", "sec", "numeric", "s"),
    field("restEvery", "Per (reps)", "e.g. 20", "numeric", " reps"),
]
LOG_ROUNDS = [field("rounds", "Rounds done", "e.g. 10", "numeric", "")]
LOG_BURPEE = [
    field("time", "Total Time", "mm:ss", "numeric", ""),
    field("restTime", "Rest Interval", "sec", "numeric", "s"),
    field("restEvery", "Per (metres)", "e.g. 20", "numeric", "m"),
]

NON_LOGGABLE_NAMES = {
    "Warm-Up", "Cool-Down + Mobility", "Cool-Down", "Rest / Active Recovery",
    "Note", "Log every split", "Log splits", "Log total time + every transition",
    "Total time vs Cardiff (1:22:32)", "Strides", "Roxzone Transition Drill",
    "Core", "Full-Body Mobility Flow", "Bodyweight Circuit",
}
WEIGHT_PATTERNS = {"squat", "hinge", "lunge", "press", "pullup", "cablerow", "raise", "calf"}
TIME_PATTERNS = {"rowerg"}  # patterns that stay simple time-only by default
PATTERN_LOG = {
    "sledpush": LOG_WEIGHT_TIME,
    "sledpull": LOG_WEIGHT_TIME,
    "carry": LOG_WEIGHT_TIME,       # Farmers Carry (Roxzone Transition Drill excluded above by name)
    "wallball": LOG_WALLBALL,
    "burpee": LOG_BURPEE,
    "skierg": LOG_SKIERG,
}
# Some exercises share a movement-pattern icon with something logged
# differently, or offer an either/or choice that needs a custom combo -
# name overrides win over pattern.
NAME_OVERRIDES = {
    "Sandbag Lunges": LOG_TIME,                          # shares "lunge" pattern with the weight-based Bulgarian Split Squat
    "Weighted Pull-up or Row Machine": LOG_PULLUP_OR_ROW, # either/or day 1 special case
    # Race 2 block (weeks 16-18)
    "Wall Ball EMOM": LOG_ROUNDS,
    "Sandbag Lunges - 50m repeats": LOG_TIME,
    "Sandbag Lunges + Wall Balls + 400m": LOG_TIME,
    "Row Intervals - race pace": LOG_TIME,
    "Race-Pace Station Circuit": LOG_TIME,
}

def infer_log_fields(block):
    name = block["name"]
    pattern = block["pattern"]
    prescription = block["prescription"]

    if name in NON_LOGGABLE_NAMES or "HYROX Race" in name:
        return None
    if name in NAME_OVERRIDES:
        return NAME_OVERRIDES[name]
    if pattern == "rest":
        return None
    if pattern in PATTERN_LOG:
        return PATTERN_LOG[pattern]
    if pattern in WEIGHT_PATTERNS:
        return LOG_WEIGHT
    if pattern in TIME_PATTERNS:
        return LOG_TIME
    if pattern == "run":
        return LOG_DISTANCE_HR if "min" in prescription else LOG_TIME
    return None

def attach_logging(days):
    for day in days:
        for b in day["blocks"]:
            fields = infer_log_fields(b)
            if fields:
                b["log"] = {"fields": fields}
    return days

LOWER_MAIN = ["Back Squat", "Pause Squat"]
UPPER_MAIN = ["Barbell Bench Press", "Spoto Press", "Incline DB Press"]

def lower_day(week_idx, sled_push_sets, sled_pull_sets, sled_note, extra_note=""):
    main = LOWER_MAIN[week_idx % 2]
    main_pattern = "squat"
    blocks = [
        blk(main, main_pattern, "4 x 6", "RPE 7-8 - continue your established working weight progression.",
            "Technique first. This lift is unchanged from your existing program.",
            f"{main.lower()} technique"),
        blk("Romanian Deadlift", "hinge", "3 x 8", "RPE 7 - continue existing progression.",
            "Hinge from the hips, soft knees, bar close to the legs.", "romanian deadlift technique"),
        blk("Bulgarian Split Squat", "lunge", "3 x 10 /leg", "RPE 7 - continue existing progression.",
            "", "bulgarian split squat technique"),
        blk("Leg Extension", "squat", "3 x 12", "RPE 7 - accessory, controlled tempo.", "", "leg extension technique"),
        blk("Standing Calf Raise", "calf", "3 x 15", "RPE 7 - full stretch and full contraction.", "", None),
        blk("Sled Push - speed", "sledpush", f"{sled_push_sets} x 20m",
            sled_note, "Light-moderate load, MOVE FAST - this is not a strength set.", "sled push technique"),
        blk("Sled Pull - speed", "sledpull", f"{sled_pull_sets} x 20m",
            sled_note, "Same intent as the push: fast, repeatable, not maximal.", "sled pull technique"),
    ]
    if extra_note:
        blocks.append(blk("Note", "rest", "", extra_note))
    return blocks

def upper_day(week_idx, roxzone_detail, erg_block=None):
    main = UPPER_MAIN[week_idx % 3]
    blocks = [
        blk(main, "press", "4 x 6-8", "RPE 7-8 - continue your established working weight progression.",
            "Unchanged from your existing program.", f"{main.lower()} technique"),
        blk("Weighted Pull-up", "pullup", "4 x 8", "RPE 7 - add weight only if all reps are clean.", "", "weighted pull up technique"),
        blk("Seated Cable Row", "cablerow", "3 x 10", "RPE 7.", "", "seated cable row technique"),
        blk("Lateral Raise", "raise", "3 x 15", "RPE 7 - control the eccentric.", "", None),
        blk("Face Pull", "raise", "3 x 15", "RPE 7 - external rotation at the end range.", "", "face pull technique"),
    ]
    if erg_block:
        blocks.append(erg_block)
    blocks.append(blk("Roxzone Transition Drill", "carry", roxzone_detail.get("prescription","8 reps"),
                       roxzone_detail.get("detail",""), roxzone_detail.get("cue","")))
    return blocks

def easy_run(duration, hr="HR 130-150, ~5:30-6:30/km", strides=None):
    blocks = [blk("Easy Aerobic Run", "run", duration, hr, "Conversational effort - this run should feel easy.")]
    if strides:
        blocks.append(blk("Strides", "run", strides, "Fast-start pace practice (~5:15-5:30/km), full recovery between.",
                           "Rehearsing a confident opening kilometre - not a Cardiff-style conservative start."))
    return blocks

def long_run(duration, note="Easy-to-steady, HR 130-155. Time-on-feet over pace."):
    return [blk("Long Aerobic Run", "run", duration, note)]

def rest_day(note="Full rest, or 20-30min easy walk + mobility. Protect sleep tonight."):
    return [blk("Rest / Active Recovery", "rest", "Full rest day", note)]

# ---------------------------------------------------------------------------
# Week builders
# ---------------------------------------------------------------------------

def make_day(d, session_type, title, subtitle, blocks):
    return {
        "date": d.isoformat(),
        "dayName": DAY_NAMES[d.weekday()],
        "sessionType": session_type,
        "title": title,
        "subtitle": subtitle,
        "blocks": blocks,
    }

def week_dates(week_num):
    start = PROGRAM_START + timedelta(weeks=week_num - 1)
    return [start + timedelta(days=i) for i in range(7)]

# Per-station cue for simulation loops - corrected for the Cardiff sled-catch
# issue, and flags the stations that actually felt hard (Sandbag Lunges,
# Burpee Broad Jump, Wall Balls) rather than treating every station the same.
CARDIFF_SPLITS = {"SkiErg":"4:13","Sled Push":"2:53","Sled Pull":"4:10","Burpee Broad Jump":"3:53",
                   "Row":"4:55","Farmers Carry":"2:24","Sandbag Lunges":"4:10","Wall Balls":"4:50"}
HARD_STATIONS = {"Sandbag Lunges", "Burpee Broad Jump", "Wall Balls"}

def sim_station_cue(name):
    if name == "Sled Push":
        return "Cardiff recorded 2:53, but the sled caught that day - hold ~1:55, the realistic number, not the old one."
    if name == "Sled Pull":
        return "Cardiff recorded 4:10, also affected by the catch - hold ~3:30, the realistic number."
    if name in HARD_STATIONS:
        return f"Cardiff split: {CARDIFF_SPLITS.get(name,'')}. This is one that actually felt hard - a genuine target."
    split = CARDIFF_SPLITS.get(name)
    return f"Cardiff split: {split}. Race-equivalent effort." if split else "Race-equivalent effort."

# ---- Week 1 (hand-authored, exact) ----
def build_week1():
    d = week_dates(1)
    days = []
    days.append(make_day(d[0], "gym", "Heavy Lower Body + Sled Load-Finding", "Existing lift program + first sled benchmark", [
        blk("Back Squat or Trap Bar Deadlift", "squat", "4 x 6", "RPE 7 - technique priority, not a number chase.", "", "back squat technique"),
        blk("Sled Push + Pull - LOAD-FINDING TEST", "sledpush", "4 x (20m push + 20m pull)",
            "Start light, add load over 4-5 attempts until 20m feels hard-but-controlled. Log the load and time per rep - this is your sled baseline.",
            "Walk-back recovery between reps.", "sled push pull technique"),
        blk("Single-Leg RDL or Reverse Lunge", "lunge", "3 x 12 /leg", "", ""),
        blk("Finisher: 3 rounds", "rowerg", "200m row (hard) + 15 KB swings", "2min rest between rounds.", ""),
    ]))
    days.append(make_day(d[1], "run", "Aerobic Base", "Easy running + fast-start practice", [
        blk("Easy Aerobic Run", "run", "30-35 min", "Zone 2, target HR 130-148, ~5:50-6:30/km.", "Conversational effort."),
        blk("Strides", "run", "4 x 20 sec", "Relaxed, full recovery between.", "First 400m of Tuesday's run at ~5:15-5:30/km opening pace."),
    ]))
    days.append(make_day(d[2], "gym", "Upper Body Strength + Erg Intervals", "Existing lift program + engine work", [
        blk("Bench Press or DB Shoulder Press", "press", "4 x 6-8", "RPE 7.", "", "bench press technique"),
        blk("Weighted Pull-up or Row Machine", "pullup", "4 x 8-10", "RPE 7.", ""),
        blk("Face Pull", "raise", "3 x 15", "RPE 7 - external rotation at the end range.", "", "face pull technique"),
        blk("SkiErg or Row Intervals", "skierg", "6 x 250m hard", "90 sec rest between. Roughly your current 1000m race-effort pace or slightly faster.", ""),
        blk("Core", "core", "3 x 45 sec", "Plank variations.", ""),
    ]))
    days.append(make_day(d[3], "run", "Progression Run", "Building into tempo effort", [
        blk("Progression Run", "run", "25-30 min", "First 15min easy (HR ~135-148), build the last 10-15min to steady/tempo (HR ~155-168, ~5:00-5:20/km).", "Controlled effort, not all-out."),
    ]))
    days.append(make_day(d[4], "gym", "HYROX Station Benchmark", "Baseline test - our biggest data gaps", [
        blk("Wall Balls", "wallball", "100 reps for time", "6kg ball, 3m target (standard HYROX men's spec). Log total time + rest breaks.", ""),
        blk("Farmers Carry", "carry", "200m for time", "Pick a challenging-but-completable load. Log time + load.", "Rest 5min before/after."),
        blk("Burpee Broad Jumps", "burpee", "80m for time", "Rest 5min before/after.", ""),
        blk("SkiErg", "skierg", "1000m for time", "Rest 5min before/after. This gives us a clean baseline on the engine-based station too.", ""),
        blk("Compromised 1km", "run", "1km straight off the last station", "Your first logged compromised-run split.", "Only if legs allow - don't force it."),
    ]))
    days.append(make_day(d[5], "run", "Long Aerobic Run", "Time-on-feet", long_run("45-55 min", "Easy-to-steady, HR 130-155. Building on your recent 8-10km long-run pattern.")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

# ---- Phase I weeks 2-4 ----
def build_phase1_week(week_num):
    d = week_dates(week_num)
    idx = week_num - 1
    days = []

    if week_num == 2:
        days.append(make_day(d[0], "gym", "Heavy Lower Body + Sled Speed", "Phase I - building sled speed capacity",
            lower_day(idx, 6, 6, "Speed tempo, 15 sec recovery between reps.")))
        days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("30-35 min", strides="5 x 20 sec")))
        days.append(make_day(d[2], "gym", "Upper Body Strength + Roxzone", "Phase I",
            upper_day(idx, {"prescription":"8 reps","detail":"Sprint 10m in - implement (sandbag/farmer handles) - sprint 10m out. Target every handoff under 10 sec.","cue":"Add a second implement type this week for variety."})))
        days.append(make_day(d[3], "run", "Compromised Running", "5-6 rounds - introducing Sandbag Lunges early", [
            blk("Burpee Broad Jump + Sandbag Lunges + 400m", "burpee", "5-6 rounds", "10 Burpee Broad Jumps + 20m Sandbag Lunges into 400m hard, 90 sec jog recovery. Sandbag Lunges and Wall Balls are the real targets flagged from Cardiff - getting them in early."),
        ]))
        days.append(make_day(d[4], "gym", "Simulation: Stations 1-4", "Adding Burpee Broad Jump to the sequence", [
            blk("1km Run", "run", "1km", "Race pace."),
            blk("SkiErg", "skierg", "1000m", "Hold your Cardiff pace (4:13) or better."),
            blk("1km Run", "run", "1km", ""),
            blk("Sled Push", "sledpush", "50m", "Cardiff recorded 2:53, but the sled caught that day - realistic time was ~1:55. Hold that, it's solid."),
            blk("1km Run", "run", "1km", ""),
            blk("Sled Pull", "sledpull", "50m", "Cardiff recorded 4:10, also affected by the catch - realistic time was ~3:30. Hold that."),
            blk("1km Run", "run", "1km", ""),
            blk("Burpee Broad Jumps", "burpee", "80m", "Beat 3:53 - this one's a genuine target."),
            blk("Log every split", "rest", "", "Compare directly to your Cardiff splits."),
        ]))
        days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run("50-60 min")))
        days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))

    elif week_num == 3:
        days.append(make_day(d[0], "gym", "Heavy Lower Body + Sled Speed", "Phase I",
            lower_day(idx, 8, 6, "Speed tempo, 15 sec recovery.")))
        days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("35 min", strides="5 x 20 sec")))
        days.append(make_day(d[2], "gym", "Upper Body Strength + Roxzone Medley", "Phase I",
            upper_day(idx, {"prescription":"4 transitions, timed","detail":"Sandbag pickup, farmer handles, wall ball, sled hookup - back to back, minimal rest.","cue":"This is a timed medley, not isolated reps."})))
        days.append(make_day(d[3], "run", "Compromised Running", "Higher intensity, shorter recovery - now rotating all 3 flagged stations", [
            blk("Wall Balls + Burpee Broad Jump + 400m", "wallball", "6 rounds", "15 Wall Balls + 10 Burpee Broad Jumps into 400m hard, recovery trimmed to 75 sec."),
        ]))
        days.append(make_day(d[4], "gym", "Simulation: Stations 1-5", "Adding Row to the sequence", [
            blk("1km Run", "run", "1km", ""),
            blk("SkiErg", "skierg", "1000m", ""),
            blk("1km Run", "run", "1km", ""),
            blk("Sled Push", "sledpush", "50m", ""),
            blk("1km Run", "run", "1km", ""),
            blk("Sled Pull", "sledpull", "50m", ""),
            blk("1km Run", "run", "1km", ""),
            blk("Burpee Broad Jumps", "burpee", "80m", ""),
            blk("1km Run", "run", "1km", ""),
            blk("Row", "rowerg", "1000m", "Beat 4:55."),
            blk("Log every split", "rest", "", "Full effort - this sets up next week's benchmark."),
        ]))
        days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run("55-65 min")))
        days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))

    elif week_num == 4:
        days.append(make_day(d[0], "gym", "Heavy Lower Body (lighter touch)", "Easing volume ahead of Friday's benchmark",
            lower_day(idx, 4, 4, "Speed tempo, short - keep legs fresh for Friday.")))
        days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("30 min", strides="6 x 20 sec")))
        days.append(make_day(d[2], "gym", "Upper Body Strength (lighter touch)", "Easing volume ahead of Friday's benchmark",
            upper_day(idx, {"prescription":"6 reps, easy","detail":"Light touch only - save intensity for Friday.","cue":""})))
        days.append(make_day(d[3], "run", "Weak-Station Test", "Dedicated test on the stations that actually felt hardest", [
            blk("50 Wall Balls + 50m Sandbag Lunges + 1km", "wallball", "For time", "Single effort, all-out, straight through, then the compromised km. These two - plus Burpee Broad Jumps - are the real targets, not the sled."),
        ]))
        days.append(make_day(d[4], "gym", "BENCHMARK: Stations 1-3 vs Cardiff", "Phase I milestone test", [
            blk("1km Run", "run", "1km", "Target: beat your Cardiff Run 1 (6:28) - practice the fast, confident opening you've been drilling."),
            blk("SkiErg", "skierg", "1000m", "Cardiff benchmark: 4:13 (top 89.5%)."),
            blk("1km Run", "run", "1km", ""),
            blk("Sled Push", "sledpush", "50m", "Cardiff recorded 2:53, but the sled caught that day - your realistic time was closer to 1:55, roughly 34% quicker. That's a genuinely solid number - hold it, don't chase the old 2:53."),
            blk("1km Run", "run", "1km", ""),
            blk("Sled Pull", "sledpull", "50m", "Cardiff recorded 4:10, also affected by the catch - realistic time was closer to 3:30. Hold that instead of the recorded number."),
            blk("Log total time + every transition", "rest", "", "This is the clean, direct comparison point for the whole block so far. Note: total time still benchmarks against the official 1:22:32 - the sled correction only applies to reading the individual splits, the mechanical issue was still part of that day's race."),
        ]))
        days.append(make_day(d[5], "run", "Recovery Run", "Short and easy after yesterday's benchmark", long_run("30-35 min easy", "Very easy - yesterday was the hard effort.")))
        days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))

    return days

# ---- Phase II weeks 5-8 ----
def build_phase2_week(week_num):
    d = week_dates(week_num)
    idx = week_num - 1
    days = []
    wk_in_phase = week_num - 4  # 1..4

    sled_scheme = {
        5: (8, 8, "Heavier load than Phase I. 15 sec recovery."),
        6: (10, 8, "Heavier load again. 15 sec recovery."),
        7: (10, 10, "Heavier load, recovery trimmed to 10 sec."),
        8: (10, 10, "Race-pace medley - alternate push/pull continuously, minimal rest."),
    }[week_num]

    days.append(make_day(d[0], "gym", "Heavy Lower Body + Sled Load", "Phase II - progressive sled loading",
        lower_day(idx, sled_scheme[0], sled_scheme[1], sled_scheme[2])))

    tempo_or_easy = "Tempo Run" if week_num % 2 == 0 else "Easy Aerobic Run"
    if tempo_or_easy == "Easy Aerobic Run":
        days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("35-40 min", strides="6 x 20 sec")))
    else:
        days.append(make_day(d[1], "run", "Tempo Run", "Continuous tempo effort", [
            blk("Tempo Run", "run", "20 min", "~4:45-5:15/km, HR 155-175. Warm up 10min easy first, cool down 10min easy after."),
        ]))

    days.append(make_day(d[2], "gym", "Upper Body Strength + Erg Intervals", "Phase II",
        upper_day(idx,
                  {"prescription":"8 reps, post-erg","detail":"Transitions now performed immediately after the erg interval below - fatigued, not fresh.","cue":""},
                  erg_block=blk("SkiErg or Row Intervals", "skierg", "6 x 300m hard", "75 sec rest. Faster than Phase I pace."))))

    rotation = {5: "Burpee Broad Jump", 6: "Wall Balls", 7: "Sandbag Lunges", 8: "Burpee Broad Jump"}[week_num]
    rotation_pattern = {"Burpee Broad Jump":"burpee", "Wall Balls":"wallball", "Sandbag Lunges":"lunge"}[rotation]
    days.append(make_day(d[3], "run", "Compromised / Tempo Running", "Rotating through the stations that actually felt hard", [
        blk(f"{rotation} + 400m", rotation_pattern, "6 rounds", "90 sec recovery, building intensity through the block."),
    ]))

    sim_stations = {5: 5, 6: 6, 7: 7, 8: 8}[week_num]
    sim_names = ["SkiErg", "Sled Push", "Sled Pull", "Burpee Broad Jump", "Row", "Farmers Carry", "Sandbag Lunges", "Wall Balls"]
    sim_rx =    ["1000m", "50m", "50m", "80m", "1000m", "200m", "100m", "100 reps"]
    sim_patterns = ["skierg", "sledpush", "sledpull", "burpee", "rowerg", "carry", "lunge", "wallball"]
    blocks = []
    for i in range(sim_stations):
        blocks.append(blk("1km Run", "run", "1km", ""))
        blocks.append(blk(sim_names[i], sim_patterns[i], sim_rx[i], sim_station_cue(sim_names[i])))
    label = "FULL SIMULATION - first dress rehearsal (all 8 stations)" if sim_stations == 8 else f"Simulation: Stations 1-{sim_stations}"
    blocks.append(blk("Log every split", "rest", "", "Compare station-by-station against Cardiff."))
    days.append(make_day(d[4], "gym", label, f"Phase II - building toward full race simulation", blocks))

    days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run(f"{55 + wk_in_phase*5}-{65 + wk_in_phase*5} min")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

# ---- Phase III weeks 9-11 ----
def build_phase3_week(week_num):
    d = week_dates(week_num)
    idx = week_num - 1
    days = []

    days.append(make_day(d[0], "gym", "Heavy Lower Body + Sled (Race-Pace)", "Phase III - peak load",
        lower_day(idx, 10, 10, "Full race-pace effort - minimal rest, exactly as you'll move on race day.")))
    days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("30-35 min", strides="6 x 20 sec")))
    days.append(make_day(d[2], "gym", "Upper Body Strength + Erg Intervals", "Phase III",
        upper_day(idx,
                  {"prescription":"embedded in simulation","detail":"Roxzone work now lives inside Friday's full simulation - no separate drill needed.","cue":""},
                  erg_block=blk("SkiErg or Row Intervals", "skierg", "5 x 400m hard", "60 sec rest - race-pace intensity."))))
    days.append(make_day(d[3], "run", "Race-Pace Compromised Kilometres", "Peak specificity", [
        blk("Station + 1km at goal race pace", "burpee", "5-6 rounds", "Rotate station each round (wall balls / burpees / KB swings / carry). This is the exact skill Cardiff exposed as missing."),
    ]))

    sim_names = ["SkiErg", "Sled Push", "Sled Pull", "Burpee Broad Jump", "Row", "Farmers Carry", "Sandbag Lunges", "Wall Balls"]
    sim_rx =    ["1000m", "50m", "50m", "80m", "1000m", "200m", "100m", "100 reps"]
    sim_patterns = ["skierg", "sledpush", "sledpull", "burpee", "rowerg", "carry", "lunge", "wallball"]

    if week_num == 11:
        blocks = []
        for i in range(8):
            blocks.append(blk("1km Run", "run", "1km", "Cardiff Run avg: 5:49/km - beat it."))
            blocks.append(blk(sim_names[i], sim_patterns[i], sim_rx[i], sim_station_cue(sim_names[i])))
        blocks.append(blk("Total time vs Cardiff (1:22:32)", "rest", "", "This is the final benchmark before taper - the clearest read yet on race-day shape. Note: the sled correction changes how to read the individual Push/Pull splits, but the overall clock target stays the official 1:22:32 - that day's result, mechanical hiccup included, is still the real bar."))
        days.append(make_day(d[4], "gym", "FINAL FULL SIMULATION - vs Cardiff 1:22:32", "Phase III milestone - last hard test before taper", blocks))
        days.append(make_day(d[5], "run", "Recovery Run", "Easy after yesterday's max effort", long_run("30-35 min easy", "Very easy - protect recovery into the taper.")))
    else:
        blocks = []
        for i in range(8):
            blocks.append(blk("1km Run", "run", "1km", "Race pace."))
            blocks.append(blk(sim_names[i], sim_patterns[i], sim_rx[i], sim_station_cue(sim_names[i])))
        blocks.append(blk("Log every split", "rest", "", "Compare against Cardiff and last week's simulation."))
        days.append(make_day(d[4], "gym", "FULL SIMULATION - Race Pace", "Phase III - peak training load", blocks))
        days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run("65-70 min")))

    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

# ---- Week 12: Taper ----
def build_week12():
    d = week_dates(12)
    days = []
    days.append(make_day(d[0], "gym", "Sharpen: Lower Body (reduced volume)", "Taper - intensity maintained, volume down ~35%", [
        blk("Back Squat", "squat", "3 x 4", "RPE 7 - light and sharp, not heavy.", ""),
        blk("Sled Push + Pull - short touch", "sledpush", "3 x 20m each", "Fast, fresh, brief. Just keep the pattern sharp.", ""),
    ]))
    days.append(make_day(d[1], "run", "Easy Run", "", easy_run("25 min", strides="4 x 20 sec")))
    days.append(make_day(d[2], "gym", "Sharpen: Upper Body (reduced volume)", "Taper", [
        blk("Bench Press", "press", "3 x 5", "RPE 7.", ""),
        blk("Weighted Pull-up", "pullup", "3 x 6", "RPE 7.", ""),
    ]))
    days.append(make_day(d[3], "run", "Short Compromised Touch", "", [
        blk("10 Burpee Broad Jumps + 400m", "burpee", "3 rounds", "Sharp, not exhausting."),
    ]))
    days.append(make_day(d[4], "gym", "Short Station Touches", "Taper - technical sharpness only", [
        blk("SkiErg", "skierg", "500m", "Fast and clean."),
        blk("Sled Push", "sledpush", "25m", "Race-equivalent effort, short."),
        blk("Sled Pull", "sledpull", "25m", "Race-equivalent effort, short."),
        blk("Wall Balls", "wallball", "30 reps", "Clean reps, good rhythm."),
    ]))
    days.append(make_day(d[5], "run", "Easy Shakeout", "", long_run("30-35 min easy", "Easy - volume is intentionally down this week.")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

# ---- Week 13: Race Week (Race 1) ----
def build_week13():
    d = week_dates(13)
    days = []
    days.append(make_day(d[0], "gym", "Opener: Lower Body", "Race week - light activation only", [
        blk("Back Squat", "squat", "2 x 3", "Light - just wake the pattern up, no fatigue.", ""),
        blk("Sled Push + Pull", "sledpush", "2 x 15m each", "Fast, light, brief.", ""),
    ]))
    days.append(make_day(d[1], "run", "Easy + Strides", "", easy_run("20 min", strides="3 x 20 sec"), ))
    days.append(make_day(d[2], "gym", "Opener: Upper Body", "Race week - light activation only", [
        blk("Bench Press", "press", "2 x 3", "Light.", ""),
        blk("Weighted Pull-up", "pullup", "2 x 5", "Bodyweight or light.", ""),
    ]))
    days.append(make_day(d[3], "rest", "Rest", "Full rest - let everything settle", rest_day("Full rest. Hydrate, eat well, sleep well.")))
    days.append(make_day(d[4], "rest", "Rest / Travel & Logistics", "Kit check, travel, race packet", rest_day("Lay out race kit, confirm travel/logistics. No training.")))
    days.append(make_day(d[5], "run", "Pre-Race Shakeout", "Short and easy", [
        blk("Easy Jog", "run", "10-15 min", "Very easy + 2-3 strides.", "Early night tonight."),
    ]))
    days.append(make_day(d[6], "race", "RACE DAY - HYROX Race 1", "Everything you've built points at today", [
        blk("HYROX Race 1", "run", "1:22:32 to beat", "Open controlled - Run 1 doesn't need to be conservative. Sled should take care of itself - the training focus shifted once we corrected the Cardiff sled-catch data, so push hardest on Sandbag Lunges, Burpee Broad Jumps, and Wall Balls specifically - that's where the last 13 weeks actually went.", "Trust the prep. Good luck."),
    ]))
    return days

# ---- Bridge weeks 14-18 ----
def build_week14():
    d = week_dates(14)
    days = []
    days.append(make_day(d[0], "gym", "Active Recovery - Mobility", "No heavy lifting this week", [
        blk("Full-Body Mobility Flow", "core", "20 min", "Hips, ankles, shoulders, thoracic spine.", ""),
    ]))
    days.append(make_day(d[1], "run", "Very Easy Movement", "", easy_run("20 min very easy", "HR under 140. No agenda.")))
    days.append(make_day(d[2], "gym", "Active Recovery - Light Bodyweight", "No heavy lifting this week", [
        blk("Bodyweight Circuit", "core", "3 rounds, easy", "Air squats, push-ups, plank - light, unhurried.", ""),
    ]))
    days.append(make_day(d[3], "rest", "Rest", "", rest_day("How does the body feel post-race? Note any niggles.")))
    days.append(make_day(d[4], "run", "Easy Movement", "", easy_run("20-25 min easy")))
    days.append(make_day(d[5], "run", "Easy Long-ish Walk/Jog", "", long_run("30-40 min, walk/jog as feels right", "No pace targets this week.")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

def build_week15():
    d = week_dates(15)
    days = []
    days.append(make_day(d[0], "gym", "Strength Resumes (moderate)", "Re-introduction - lighter than pre-Race 1", [
        blk("Back Squat", "squat", "3 x 6", "RPE 6-7 - moderate, rebuilding.", ""),
        blk("Romanian Deadlift", "hinge", "3 x 8", "RPE 6-7.", ""),
        blk("Sled Push + Pull - light", "sledpush", "4 x 20m each", "Light load, speed only - no heavy medley yet.", ""),
    ]))
    days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("30 min", strides="4 x 20 sec")))
    days.append(make_day(d[2], "gym", "Upper Body (moderate)", "Re-introduction", [
        blk("Bench Press", "press", "3 x 6-8", "RPE 6-7.", ""),
        blk("Weighted Pull-up", "pullup", "3 x 8", "RPE 6-7.", ""),
        blk("Seated Cable Row", "cablerow", "3 x 10", "", ""),
    ]))
    days.append(make_day(d[3], "run", "Light Compromised Touch", "", [
        blk("10 Burpee Broad Jumps + 400m", "burpee", "4 rounds", "Moderate, not maximal - easing back in."),
    ]))
    days.append(make_day(d[4], "gym", "Light Station Circuit", "Re-introduction - stations 1-4, sleds at race load for technique", [
        blk("SkiErg", "skierg", "500m easy", ""),
        blk("Sled Push", "sledpush", "3 x 12.5m at race load (152 kg)",
            "Technique only, full rest between lanes. Arms locked, hips low, short fast steps - keep the sled moving.",
            "Birmingham: sled push placed 1019th vs 639th overall. This is where Race 2 is won.", "hyrox sled push technique"),
        blk("Sled Pull", "sledpull", "3 x 12.5m at race load (103 kg)",
            "Feet planted, sit back into a quarter squat, long hand-over-hand pulls.",
            "Stay inside the box at the end of the lane - that's the 30 s Birmingham penalty.", "hyrox sled pull technique"),
        blk("Wall Balls", "wallball", "50 reps, moderate", "6 kg ball to the 3 m target."),
    ]))
    days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run("40-45 min")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

# ---------------------------------------------------------------------------
# Race 2 block (weeks 16-18), rebuilt after Birmingham (1:13:43).
# Birmingham field-relative ranks (station place / overall place 639):
#   SkiErg 0.64, Farmers 0.77, BBJ 0.97  -> strengths, maintain
#   Wall Balls 1.14, Row 1.15, Lunges 1.23 -> second priority
#   Sled Pull 1.56 (incl. 30 s penalty), Sled Push 1.59 -> first priority
# Running (rank 502) and pacing (8 laps within 33 s) are now a strength.
# Changes: race-load sled work twice a week (replaces light "speed" sleds),
# Front Squat in for Back Squat, Wall Ball EMOM + race-pace Row on upper days,
# the last full simulation moves to 2 weeks out (Fri 20 Nov) and week 17's
# Friday becomes a stations 1-4 race-pace half simulation.
# ---------------------------------------------------------------------------

BIRMINGHAM = {"SkiErg": "3:56", "Sled Push": "3:06", "Sled Pull": "4:35", "Burpee Broad Jump": "3:24",
              "Row": "4:36", "Farmers Carry": "1:34", "Sandbag Lunges": "4:05", "Wall Balls": "4:46"}
RACE2_CUES = {
    "SkiErg": "Birmingham 3:56 - your strongest station vs the field. Swap every 250 m; hold it, don't overspend.",
    "Sled Push": "Birmingham 3:06 - weakest vs the field. Swap every lane (12.5 m), keep it moving, aim ~20-30 s quicker.",
    "Sled Pull": "Birmingham 4:35 incl. a 30 s penalty. Stay inside the box, swap every lane, aim for sub-3:50.",
    "Burpee Broad Jump": "Birmingham 3:24 - the targeted work paid off. Swap every 20 m, keep the rhythm.",
    "Row": "Birmingham 4:36. Swap every 250 m, aim for ~4:20.",
    "Farmers Carry": "Birmingham 1:34 - a strength. Unbroken if you can.",
    "Sandbag Lunges": "Birmingham 4:05 - second-priority station. Swap every 25 m, aim for ~3:40.",
    "Wall Balls": "Birmingham 4:46. 6 kg to the 3 m target. Swap every 10 reps, aim for ~4:15-4:30.",
}
SIM_NAMES = ["SkiErg", "Sled Push", "Sled Pull", "Burpee Broad Jump", "Row", "Farmers Carry", "Sandbag Lunges", "Wall Balls"]
SIM_RX = ["1000m", "50m", "50m", "80m", "1000m", "200m", "100m", "100 reps"]
SIM_PATTERNS = ["skierg", "sledpush", "sledpull", "burpee", "rowerg", "carry", "lunge", "wallball"]
RUN_CUE = "Birmingham laps averaged 4:44. Hold 4:35-4:45; Run 1 no quicker than 4:50."

def sled_push_race(sets, note):
    return blk("Sled Push - race load", "sledpush", f"{sets} x 12.5m at 152 kg", note,
               "Arms locked, hips low, short fast steps. A stopped sled costs more than a slow one.", "hyrox sled push technique")

def sled_pull_race(sets, note):
    return blk("Sled Pull - race load", "sledpull", f"{sets} x 12.5m at 103 kg", note,
               "Sit back, long hand-over-hand pulls, feet inside the box - Birmingham's 30 s penalty came from here.", "hyrox sled pull technique")

def build_week16():
    d = week_dates(16)
    days = []
    days.append(make_day(d[0], "gym", "Lower Body + Race-Load Sleds", "Sharpening I - sleds are priority #1 for Race 2", [
        blk("Front Squat", "squat", "4 x 5", "RPE 7. In for Back Squat this block.",
            "Upright torso and quads carry straight over to wall balls and lunges.", "front squat technique"),
        blk("Romanian Deadlift", "hinge", "3 x 8", "RPE 7 - continue existing progression.", "", "romanian deadlift technique"),
        blk("Bulgarian Split Squat", "lunge", "3 x 8 /leg", "RPE 7.", "", "bulgarian split squat technique"),
        sled_push_race(6, "One lane each, alternating with Simon (solo: 45 s rest). Time each lane."),
        sled_pull_race(6, "Same format as the push. Time each lane."),
        blk("Sled Push - overload", "sledpush", "3 x 12.5m at 170-180 kg", "Full rest (2 min). Builds the strength reserve so 152 kg feels lighter on race day.", ""),
        blk("Standing Calf Raise", "calf", "3 x 12", "Heavy, 2 s pause at the top. Calves are the first thing to go on a heavy push.", ""),
    ]))
    days.append(make_day(d[1], "run", "Tempo Run", "Faster than the old tempo - you raced at 4:44/km", [
        blk("Tempo Run", "run", "20 min", "~4:30-4:50/km, HR 155-170. 10 min easy before and after.", "Controlled hard, not a race."),
    ]))
    days.append(make_day(d[2], "gym", "Upper Body + Wall Balls + Row", "Sharpening I - second-priority stations", [
        blk("Barbell Bench Press", "press", "4 x 6", "RPE 7 - continue your established progression.", "", "barbell bench press technique"),
        blk("Weighted Pull-up", "pullup", "4 x 6-8", "RPE 7.", "", "weighted pull up technique"),
        blk("Seated Cable Row", "cablerow", "3 x 10", "RPE 7.", "", "seated cable row technique"),
        blk("Face Pull", "raise", "3 x 15", "RPE 7 - shoulder health for the wall ball volume.", "", "face pull technique"),
        blk("Wall Ball EMOM", "wallball", "10 min: 15 reps every minute",
            "6 kg to the 3 m target, rest the remainder of each minute. If 15 takes longer than 40 s by minute 8, drop to 12.",
            "Log how many full rounds of 15 you completed.", "wall ball technique"),
        blk("Row Intervals - race pace", "rowerg", "4 x 500m, 60 s rest",
            "Aim ~1:55-2:00/500m. Row placed 1.15x your overall standing at Birmingham.", "Log your average split."),
    ]))
    days.append(make_day(d[3], "run", "Compromised Running - Lunges + Wall Balls", "Running off the two stations that didn't move", [
        blk("Sandbag Lunges + Wall Balls + 400m", "lunge", "5 rounds",
            "25 m sandbag lunges (20 kg) + 20 wall balls, straight into 400 m at race pace. 90 s rest between rounds.",
            "Log total time for all 5 rounds."),
    ]))
    blocks = []
    for i in range(8):
        blocks.append(blk("1km Run", "run", "1km", RUN_CUE))
        blocks.append(blk(SIM_NAMES[i], SIM_PATTERNS[i], SIM_RX[i], RACE2_CUES[SIM_NAMES[i]]))
    blocks.append(blk("Log every split", "rest", "", "Two weeks out - your last full-length test. Compare station by station with Birmingham and practise every partner switch."))
    days.append(make_day(d[4], "gym", "FULL SIMULATION - Race 2 dress rehearsal", "Sharpening I milestone - two weeks out", blocks))
    days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run("50-55 min")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

def build_week17():
    d = week_dates(17)
    days = []
    days.append(make_day(d[0], "gym", "Lower Body + Race-Load Sleds (sharp)", "Sharpening II - same load, quicker lanes", [
        blk("Front Squat", "squat", "3 x 4", "RPE 7-8.", "", "front squat technique"),
        blk("Romanian Deadlift", "hinge", "3 x 6", "RPE 7.", "", "romanian deadlift technique"),
        sled_push_race(6, "Beat last Monday's lane times at the same load."),
        sled_pull_race(6, "Beat last Monday's lane times at the same load."),
        blk("Sandbag Lunges - 50m repeats", "lunge", "2 x 50m (20 kg)", "Unbroken, short steps, back knee kisses the floor. 2 min rest.", "Log your faster 50 m."),
        blk("Standing Calf Raise", "calf", "3 x 12", "Heavy, 2 s pause at the top.", ""),
    ]))
    days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("30 min", strides="5 x 20 sec")))
    days.append(make_day(d[2], "gym", "Upper Body + Wall Balls + Row (sharp)", "Sharpening II", [
        blk("Barbell Bench Press", "press", "3 x 5", "RPE 7.", "", "barbell bench press technique"),
        blk("Weighted Pull-up", "pullup", "3 x 6", "RPE 7.", "", "weighted pull up technique"),
        blk("Face Pull", "raise", "3 x 15", "RPE 7.", "", "face pull technique"),
        blk("Wall Ball EMOM", "wallball", "8 min: 15 reps every minute", "6 kg to the 3 m target. Same rule: drop to 12 if 15 takes longer than 40 s.", "Log how many full rounds of 15 you completed.", "wall ball technique"),
        blk("Row Intervals - race pace", "rowerg", "3 x 500m, 60 s rest", "Same target split as last week, or quicker.", "Log your average split."),
    ]))
    days.append(make_day(d[3], "run", "Race-Pace Compromised Kilometres", "Station straight into a race-pace km", [
        blk("Station + 1km at goal race pace", "wallball", "4 rounds",
            "Round 1: 25 m sled push at 152 kg. Round 2: 25 wall balls. Round 3: 25 m sandbag lunges. Round 4: 20 m burpee broad jumps. Each straight into 1 km at 4:40. 2 min rest.", ""),
    ]))
    blocks = []
    for i in range(4):
        blocks.append(blk("1km Run", "run", "1km", RUN_CUE))
        blocks.append(blk(SIM_NAMES[i], SIM_PATTERNS[i], SIM_RX[i], RACE2_CUES[SIM_NAMES[i]]))
    blocks.append(blk("Log every split", "rest", "", "Seven days out: full race intensity, half the volume. Stop after the burpees - this is the last hard session before Race 2."))
    days.append(make_day(d[4], "gym", "HALF SIMULATION - Stations 1-4 at race pace", "Sharpening II milestone - one week out", blocks))
    days.append(make_day(d[5], "run", "Long Aerobic Run", "Shorter - taper starts here", long_run("40-45 min easy", "Easy, HR under 150. Race-week fuel plan starts today - see the Fuel tab.")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day("Full rest, or 20-30 min easy walk + the off-day mobility routine.")))
    return days

def build_week18():
    d = week_dates(18)
    days = []
    days.append(make_day(d[0], "gym", "Opener: Lower Body + Sleds", "Taper into Race 2 - crisp, not tiring", [
        blk("Front Squat", "squat", "2 x 3", "Light - just wake the pattern up.", ""),
        blk("Sled Push - race load", "sledpush", "2 x 12.5m at 152 kg", "Crisp lanes, full rest.", "Arms locked, hips low, short fast steps."),
        blk("Sled Pull - race load", "sledpull", "2 x 12.5m at 103 kg", "Crisp lanes, full rest.", "Feet inside the box."),
        blk("Wall Balls", "wallball", "2 x 10", "Smooth reps to the 3 m target.", ""),
    ]))
    days.append(make_day(d[1], "run", "Easy + Strides", "", easy_run("20 min", strides="3 x 20 sec")))
    days.append(make_day(d[2], "gym", "Opener: Upper Body", "Taper - light activation only", [
        blk("Bench Press", "press", "2 x 4", "Light.", ""),
        blk("Weighted Pull-up", "pullup", "2 x 5", "Bodyweight or light.", ""),
        blk("SkiErg", "skierg", "2 x 250m at race pace", "Full rest. Just a reminder of race rhythm.", ""),
    ]))
    days.append(make_day(d[3], "rest", "Rest", "Full rest - fuel-up day", rest_day("Full rest. Biggest carb meal at lunch - see the Fuel tab. Lay out kit, early night.")))
    days.append(make_day(d[4], "race", "RACE DAY - HYROX London", "Race 2 of 4 - afternoon wave (14:30-15:10)", [
        blk("HYROX Race 2 - London", "run", "Beat 1:13:43",
            "Runs: 4:35-4:45 laps like Birmingham, Run 1 no quicker than 4:50. Sleds: swap every lane and keep the sled moving; stay inside the box on the pull. Wall balls: swap every 10. Lunges: swap every 25 m.",
            "Birmingham proved the engine. London is won on the sleds."),
    ]))
    days.append(make_day(d[5], "rest", "Recovery", "", rest_day("Easy walk if you feel like moving. Otherwise, full rest. Log your London splits while you remember them.")))
    days.append(make_day(d[6], "rest", "Recovery", "Manchester block starts tomorrow", rest_day("Easy walk + the off-day mobility routine. Seven weeks to Manchester.")))
    return days


# ---------------------------------------------------------------------------
# Manchester (Sun 24 Jan 2027) and Glasgow (Sun 14 Mar 2027) blocks.
# Each is seven weeks: recover -> build (x3) -> peak (full sim 16 days out)
# -> sharpen (half sim 9 days out) -> taper + Sunday race. Same priorities as
# the London block (sleds first, lunges / wall balls / row second), with
# heavier Back Squat strength in the build weeks and Front Squat when sharpening.
# Both races may start as early as 08:00 - the Fuel tab adapts to the start time.
# ---------------------------------------------------------------------------

LATER_CUES = {
    "SkiErg": "Race best so far 3:56 (Birmingham). Swap every 250 m.",
    "Sled Push": "Race best so far 3:06 (Birmingham) - check your London split. Swap every lane, keep it moving.",
    "Sled Pull": "Race best so far 4:35 (Birmingham, incl. penalty). Feet inside the box, swap every lane.",
    "Burpee Broad Jump": "Race best so far 3:24 (Birmingham). Swap every 20 m.",
    "Row": "Race best so far 4:36 (Birmingham). Swap every 250 m.",
    "Farmers Carry": "Race best so far 1:34 (Birmingham). Unbroken.",
    "Sandbag Lunges": "Race best so far 4:05 (Birmingham). Swap every 25 m.",
    "Wall Balls": "Race best so far 4:46 (Birmingham). 6 kg to 3 m, swap every 10.",
}
LATER_RUN_CUE = "Hold 4:35-4:45 per lap; Run 1 no quicker than 4:50."

def lower_session(squat, squat_rx, squat_note, sled_sets, overload=False, lunges=False, rdl_rx="3 x 8", bss=True):
    blocks = [
        blk(squat, "squat", squat_rx, squat_note, "", f"{squat.lower()} technique"),
        blk("Romanian Deadlift", "hinge", rdl_rx, "RPE 7.", "", "romanian deadlift technique"),
    ]
    if bss:
        blocks.append(blk("Bulgarian Split Squat", "lunge", "3 x 8 /leg", "RPE 7.", "", "bulgarian split squat technique"))
    blocks.append(sled_push_race(sled_sets, "One lane each with Simon (solo: 45 s rest). Time each lane."))
    blocks.append(sled_pull_race(sled_sets, "Same format. Time each lane."))
    if overload:
        blocks.append(blk("Sled Push - overload", "sledpush", "3 x 12.5m at 170-180 kg", "Full rest (2 min). Strength reserve for race weight.", ""))
    if lunges:
        blocks.append(blk("Sandbag Lunges - 50m repeats", "lunge", "2 x 50m (20 kg)", "Unbroken, short steps. 2 min rest.", "Log your faster 50 m."))
    blocks.append(blk("Standing Calf Raise", "calf", "3 x 12", "Heavy, 2 s pause at the top.", ""))
    return blocks

def upper_session(press, press_rx, emom_min, row_reps, cable=True):
    blocks = [
        blk(press, "press", press_rx, "RPE 7 - continue your established progression.", "", f"{press.lower()} technique"),
        blk("Weighted Pull-up", "pullup", "4 x 6-8", "RPE 7.", "", "weighted pull up technique"),
    ]
    if cable:
        blocks.append(blk("Seated Cable Row", "cablerow", "3 x 10", "RPE 7.", "", "seated cable row technique"))
    blocks.append(blk("Face Pull", "raise", "3 x 15", "RPE 7.", "", "face pull technique"))
    blocks.append(blk("Wall Ball EMOM", "wallball", f"{emom_min} min: 15 reps every minute",
                      "6 kg to the 3 m target. Drop to 12 if 15 takes longer than 40 s.", "Log how many full rounds of 15 you completed.", "wall ball technique"))
    blocks.append(blk("Row Intervals - race pace", "rowerg", f"{row_reps} x 500m, 60 s rest", "Aim ~1:55-2:00/500m.", "Log your average split."))
    return blocks

def threshold_run(reps):
    return [blk("Threshold Intervals", "run", f"{reps} x 1km", "~4:25-4:35/km, HR 165-175, 90 s easy jog between. 10 min easy before and after.", "Log your average km.")]

def tempo_run(mins):
    return [blk("Tempo Run", "run", f"{mins} min", "~4:30-4:50/km, HR 155-170. 10 min easy before and after.", "Controlled hard, not a race.")]

def compromised(kind, rounds):
    if kind == "lunges_wb":
        return [blk("Sandbag Lunges + Wall Balls + 400m", "lunge", f"{rounds} rounds",
                    "25 m sandbag lunges (20 kg) + 20 wall balls, straight into 400 m at race pace. 90 s rest.", "Log total time for all rounds.")]
    if kind == "bbj":
        return [blk("Burpee Broad Jump + 400m", "burpee", f"{rounds} rounds", "20 m burpee broad jumps straight into 400 m at race pace. 90 s rest.")]
    return [blk("Station + 1km at goal race pace", "wallball", f"{rounds} rounds",
                "Rotate: 25 m sled push at 152 kg / 25 wall balls / 25 m sandbag lunges / 20 m burpee broad jumps, each straight into 1 km at 4:40. 2 min rest.", "")]

def station_circuit(rounds):
    blocks = [blk("Race-Pace Station Circuit", "sledpush", f"{rounds} rounds",
                  "Each round: 1 km run + 25 m sled push (152 kg) + 25 m sled pull (103 kg) + 25 m sandbag lunges + 25 wall balls. 2 min between rounds. Practise every partner switch.",
                  "Log total time.")]
    if rounds <= 3:
        blocks.append(blk("SkiErg", "skierg", "4 x 250m, 60 s rest", "Race pace - keep your strongest station sharp.", ""))
    blocks.append(blk("Farmers Carry", "carry", "4 x 50m at 2 x 24 kg", "Race weight, unbroken, 60 s rest. Last round heavier if it felt easy.", ""))
    blocks.append(blk("Dead Bug", "deadbug", "3 x 8 /side", "Lower back pressed into the floor.", ""))
    return blocks

def full_sim(cues, run_cue, note):
    blocks = []
    for i in range(8):
        blocks.append(blk("1km Run", "run", "1km", run_cue))
        blocks.append(blk(SIM_NAMES[i], SIM_PATTERNS[i], SIM_RX[i], cues[SIM_NAMES[i]]))
    blocks.append(blk("Log every split", "rest", "", note))
    return blocks

def part_sim(n, cues, run_cue, note):
    blocks = []
    for i in range(n):
        blocks.append(blk("1km Run", "run", "1km", run_cue))
        blocks.append(blk(SIM_NAMES[i], SIM_PATTERNS[i], SIM_RX[i], cues[SIM_NAMES[i]]))
    blocks.append(blk("Log every split", "rest", "", note))
    return blocks

def light_station_technique():
    return [
        blk("SkiErg", "skierg", "500m easy", ""),
        blk("Sled Push - race load", "sledpush", "3 x 12.5m at 152 kg", "Technique only, full rest.", "Arms locked, hips low, short fast steps."),
        blk("Sled Pull - race load", "sledpull", "3 x 12.5m at 103 kg", "Technique only, full rest.", "Feet inside the box."),
        blk("Wall Balls", "wallball", "3 x 15", "Smooth reps to the 3 m target.", ""),
    ]

def recovery_week(w, after, after_is_monday):
    """Week straight after a race. after_is_monday: race was Sunday, so Monday is D+1."""
    d = week_dates(w)
    days = []
    if after_is_monday:
        days.append(make_day(d[0], "rest", "Recovery", f"The day after {after}", rest_day("Easy walk, eat well, protein at every meal. Log your race splits.")))
    else:
        days.append(make_day(d[0], "gym", "Easy Flush", f"Recovery after {after}", [
            blk("Easy bike or row", "rowerg", "20 min", "Conversational, HR under 130.", ""),
        ]))
    days.append(make_day(d[1], "run", "Easy Run", "", easy_run("20-25 min", "Very easy, HR under 145.")))
    days.append(make_day(d[2], "gym", "Strength (moderate)", "Rebuilding - nothing heavy yet", [
        blk("Back Squat", "squat", "3 x 6", "RPE 6.", ""),
        blk("Romanian Deadlift", "hinge", "3 x 8", "RPE 6.", ""),
        blk("Bench Press", "press", "3 x 6", "RPE 6.", ""),
        blk("Weighted Pull-up", "pullup", "3 x 6", "RPE 6.", ""),
    ]))
    days.append(make_day(d[3], "run", "Aerobic Base", "", easy_run("30 min", strides="4 x 20 sec")))
    days.append(make_day(d[4], "gym", "Light Station Technique", "Sleds at race load, short and crisp", light_station_technique()))
    days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run("40-45 min", "Easy, HR under 150.")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

def build_week(w, level, subtitle):
    """level 1..3 - volume and intensity rise each week."""
    d = week_dates(w)
    days = []
    squat_rx = {1: "4 x 5", 2: "5 x 4", 3: "5 x 3"}[level]
    days.append(make_day(d[0], "gym", "Lower Body + Race-Load Sleds", subtitle, lower_session(
        "Back Squat", squat_rx, "RPE 7-8 - heavier strength block.", 6 if level < 3 else 8, overload=True)))
    days.append(make_day(d[1], "run", "Threshold Intervals" if level != 2 else "Tempo Run", "",
                         threshold_run(5 if level == 1 else 6) if level != 2 else tempo_run(25)))
    days.append(make_day(d[2], "gym", "Upper Body + Wall Balls + Row", subtitle, upper_session(
        ["Barbell Bench Press", "Spoto Press", "Incline DB Press"][level - 1], "4 x 6", 10 + 2 * (level - 1), 4 if level < 3 else 5)))
    days.append(make_day(d[3], "run", "Compromised Running", "Running off the stations that matter", compromised(
        ["lunges_wb", "bbj", "race_km"][level - 1], [5, 5, 5][level - 1])))
    if level == 3:
        days.append(make_day(d[4], "gym", "SIMULATION - Stations 1-6 at race pace", subtitle,
                             part_sim(6, LATER_CUES, LATER_RUN_CUE, "Race pace through station 6, then stop. Note every partner switch.")))
    else:
        days.append(make_day(d[4], "gym", "Race-Pace Station Circuit", subtitle, station_circuit(3 if level == 1 else 4)))
    days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run(["55-60 min", "60-65 min", "65-70 min"][level - 1])))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

def christmas_week(w):
    d = week_dates(w)
    days = []
    days.append(make_day(d[0], "gym", "Lower Body + Race-Load Sleds", "Christmas week - five sessions, lighter", lower_session(
        "Back Squat", "4 x 5", "RPE 7.", 6, lunges=True, bss=False)))
    days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("35 min", strides="5 x 20 sec")))
    days.append(make_day(d[2], "gym", "Upper Body + Wall Balls", "Christmas week", upper_session("Barbell Bench Press", "4 x 6", 8, 3, cable=False)))
    days.append(make_day(d[3], "run", "Compromised Running", "Christmas Eve - short and sharp", compromised("bbj", 4)))
    days.append(make_day(d[4], "rest", "Christmas Day", "", rest_day("Enjoy it. No training.")))
    days.append(make_day(d[5], "run", "Boxing Day Run", "", long_run("40-50 min easy", "Easy - or a long walk if the day gets away from you.")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

def new_year_week(w, subtitle):
    d = week_dates(w)
    days = []
    days.append(make_day(d[0], "gym", "Lower Body + Race-Load Sleds", subtitle, lower_session(
        "Front Squat", "4 x 5", "RPE 7-8.", 6, overload=True)))
    days.append(make_day(d[1], "run", "Tempo Run", "", tempo_run(25)))
    days.append(make_day(d[2], "gym", "Upper Body + Wall Balls + Row", subtitle, upper_session("Spoto Press", "4 x 6", 10, 5)))
    days.append(make_day(d[3], "run", "Race-Pace Compromised Kilometres", "New Year's Eve - done by lunchtime", compromised("race_km", 4)))
    days.append(make_day(d[4], "rest", "New Year's Day", "", rest_day("Rest. Hydrate.")))
    days.append(make_day(d[5], "gym", "Race-Pace Station Circuit", "Moved to Saturday for New Year", station_circuit(4)))
    days.append(make_day(d[6], "run", "Long Aerobic Run", "Moved to Sunday", long_run("60 min")))
    return days

def peak_week(w, race_city, subtitle):
    d = week_dates(w)
    days = []
    days.append(make_day(d[0], "gym", "Lower Body + Race-Load Sleds", subtitle, lower_session(
        "Front Squat", "4 x 5", "RPE 7-8.", 6, overload=True)))
    days.append(make_day(d[1], "run", "Threshold Intervals", "", threshold_run(6)))
    days.append(make_day(d[2], "gym", "Upper Body + Wall Balls + Row", subtitle, upper_session("Barbell Bench Press", "4 x 6", 10, 4)))
    days.append(make_day(d[3], "run", "Compromised Running - Lunges + Wall Balls", "", compromised("lunges_wb", 5)))
    days.append(make_day(d[4], "gym", f"FULL SIMULATION - {race_city} dress rehearsal", f"{subtitle} - 16 days out",
                         full_sim(LATER_CUES, LATER_RUN_CUE, f"Last full-length test before {race_city}. Compare every split with your best race and practise every partner switch.")))
    days.append(make_day(d[5], "run", "Long Aerobic Run", "", long_run("50 min easy")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day()))
    return days

def sharpen_week(w, race_city, subtitle):
    d = week_dates(w)
    days = []
    days.append(make_day(d[0], "gym", "Lower Body + Race-Load Sleds (sharp)", subtitle, lower_session(
        "Front Squat", "3 x 4", "RPE 7-8.", 6, lunges=True, rdl_rx="3 x 6", bss=False)))
    days.append(make_day(d[1], "run", "Aerobic Base", "", easy_run("30 min", strides="5 x 20 sec")))
    days.append(make_day(d[2], "gym", "Upper Body + Wall Balls + Row (sharp)", subtitle, upper_session("Barbell Bench Press", "3 x 5", 8, 3, cable=False)))
    days.append(make_day(d[3], "run", "Race-Pace Compromised Kilometres", "", compromised("race_km", 4)))
    days.append(make_day(d[4], "gym", "HALF SIMULATION - Stations 1-4 at race pace", f"{subtitle} - 9 days out",
                         part_sim(4, LATER_CUES, LATER_RUN_CUE, f"Full race intensity, half the volume. Last hard session before {race_city}.")))
    days.append(make_day(d[5], "run", "Long Aerobic Run", "Shorter - taper starts Monday", long_run("40-45 min easy", "Easy, HR under 150.")))
    days.append(make_day(d[6], "rest", "Rest / Active Recovery", "", rest_day("Full rest, or an easy walk + the off-day mobility routine.")))
    return days

def sunday_race_week(w, race_num, race_city, window):
    d = week_dates(w)
    days = []
    days.append(make_day(d[0], "gym", "Opener: Lower Body + Sleds", f"Taper into {race_city} - crisp, not tiring", [
        blk("Front Squat", "squat", "2 x 3", "Light - just wake the pattern up.", ""),
        blk("Sled Push - race load", "sledpush", "2 x 12.5m at 152 kg", "Crisp lanes, full rest.", "Arms locked, hips low, short fast steps."),
        blk("Sled Pull - race load", "sledpull", "2 x 12.5m at 103 kg", "Crisp lanes, full rest.", "Feet inside the box."),
        blk("Wall Balls", "wallball", "2 x 10", "Smooth reps to the 3 m target.", ""),
    ]))
    days.append(make_day(d[1], "run", "Easy + Strides", "", easy_run("25 min", strides="4 x 20 sec")))
    days.append(make_day(d[2], "gym", "Opener: Upper Body", "Taper - light activation only", [
        blk("Bench Press", "press", "2 x 4", "Light.", ""),
        blk("Weighted Pull-up", "pullup", "2 x 5", "Bodyweight or light.", ""),
        blk("SkiErg", "skierg", "2 x 250m at race pace", "Full rest. A reminder of race rhythm.", ""),
    ]))
    days.append(make_day(d[3], "run", "Easy + Strides", "", easy_run("20 min", strides="3 x 20 sec")))
    days.append(make_day(d[4], "rest", "Rest", "Fuel-up starts - see the Fuel tab", rest_day("Full rest. Carbs step up today.")))
    days.append(make_day(d[5], "run", "Pre-Race Shakeout", "Fuel-up day", [
        blk("Easy Jog", "run", "10-15 min", "Very easy + 2-3 strides. Biggest carb meal at lunch.", "Early wave? Set your start time on the Fuel tab and an alarm for breakfast."),
    ]))
    days.append(make_day(d[6], "race", f"RACE DAY - HYROX {race_city}", f"Race {race_num} of 4 - wave between {window}", [
        blk(f"HYROX Race {race_num} - {race_city}", "run", "Beat your best",
            "Runs: 4:35-4:45 laps, Run 1 no quicker than 4:50. Sleds: swap every lane and keep the sled moving; feet inside the box on the pull. Wall balls: swap every 10. Lunges: swap every 25 m.",
            "Same plan that worked in Birmingham - the sleds are where the next minute is."),
    ]))
    return days

def season_recovery_week(w):
    d = week_dates(w)
    days = []
    days.append(make_day(d[0], "rest", "Recovery", "The day after Glasgow", rest_day("Easy walk, eat well. Log your Glasgow splits.")))
    days.append(make_day(d[1], "rest", "Easy Walk", "", rest_day("20-30 min walk + the off-day mobility routine.")))
    days.append(make_day(d[2], "gym", "Easy Flush", "", [blk("Easy bike or row", "rowerg", "20 min", "Conversational.", "")]))
    days.append(make_day(d[3], "run", "Easy Run", "", easy_run("25 min", "Very easy.")))
    days.append(make_day(d[4], "gym", "Strength (light)", "", [
        blk("Back Squat", "squat", "3 x 5", "RPE 6.", ""),
        blk("Bench Press", "press", "3 x 5", "RPE 6.", ""),
        blk("Weighted Pull-up", "pullup", "3 x 5", "RPE 6.", ""),
    ]))
    days.append(make_day(d[5], "run", "Easy Run", "", easy_run("30-40 min", "Easy, no watch.")))
    days.append(make_day(d[6], "rest", "Season Debrief", "Four races done", rest_day("Compare Birmingham, London, Manchester and Glasgow side by side - what moved and what to build next.")))
    return days

def build_week19(): return recovery_week(19, "London", after_is_monday=False)
def build_week20(): return build_week(20, 1, "Manchester block - Build I")
def build_week21(): return christmas_week(21)
def build_week22(): return new_year_week(22, "Manchester block - Build II")
def build_week23(): return peak_week(23, "Manchester", "Manchester block - Peak")
def build_week24(): return sharpen_week(24, "Manchester", "Manchester block - Sharpen")
def build_week25(): return sunday_race_week(25, 3, "Manchester", "08:00 and 12:10")
def build_week26(): return recovery_week(26, "Manchester", after_is_monday=True)
def build_week27(): return build_week(27, 1, "Glasgow block - Build I")
def build_week28(): return build_week(28, 2, "Glasgow block - Build II")
def build_week29(): return build_week(29, 3, "Glasgow block - Build III")
def build_week30(): return peak_week(30, "Glasgow", "Glasgow block - Peak")
def build_week31(): return sharpen_week(31, "Glasgow", "Glasgow block - Sharpen")
def build_week32(): return sunday_race_week(32, 4, "Glasgow", "08:00 and 12:00")
def build_week33(): return season_recovery_week(33)

# ---------------------------------------------------------------------------
# Assemble
# ---------------------------------------------------------------------------

PHASES = [
    {"id": "p1", "name": "Foundation & Compromised Station Repatterning", "weeks": [1,2,3,4]},
    {"id": "p2", "name": "Threshold & Strength-Endurance Build", "weeks": [5,6,7,8]},
    {"id": "p3", "name": "Race-Pace Specificity & Peak Load", "weeks": [9,10,11]},
    {"id": "p4", "name": "Taper & Sharpen", "weeks": [12]},
    {"id": "race1", "name": "Race Week — Race 1 (Cardiff-style benchmark: 1:22:32)", "weeks": [13]},
    {"id": "p5", "name": "Active Recovery", "weeks": [14]},
    {"id": "p6", "name": "Re-Introduction", "weeks": [15]},
    {"id": "p7", "name": "Sharpening I", "weeks": [16]},
    {"id": "p8", "name": "Sharpening II / Mini-Peak", "weeks": [17]},
    {"id": "race2", "name": "Taper & Race 2 - London", "weeks": [18]},
    {"id": "m1", "name": "Manchester Block - Recovery", "weeks": [19]},
    {"id": "m2", "name": "Manchester Block - Build", "weeks": [20, 21, 22]},
    {"id": "m3", "name": "Manchester Block - Peak & Sharpen", "weeks": [23, 24]},
    {"id": "race3", "name": "Taper & Race 3 - Manchester", "weeks": [25]},
    {"id": "g1", "name": "Glasgow Block - Recovery", "weeks": [26]},
    {"id": "g2", "name": "Glasgow Block - Build", "weeks": [27, 28, 29]},
    {"id": "g3", "name": "Glasgow Block - Peak & Sharpen", "weeks": [30, 31]},
    {"id": "race4", "name": "Taper & Race 4 - Glasgow", "weeks": [32]},
    {"id": "off", "name": "Season Recovery", "weeks": [33]},
]

def phase_for_week(w):
    for p in PHASES:
        if w in p["weeks"]:
            return p["name"]
    return ""

weeks_out = []
builders = {1: build_week1, 12: build_week12, 13: build_week13, 14: build_week14,
            15: build_week15, 16: build_week16, 17: build_week17, 18: build_week18}
for _w in range(19, 34):
    builders[_w] = globals()[f"build_week{_w}"]

for w in range(1, 34):
    if w in builders:
        days = builders[w]()
    elif w in (2,3,4):
        days = build_phase1_week(w)
    elif w in (5,6,7,8):
        days = build_phase2_week(w)
    elif w in (9,10,11):
        days = build_phase3_week(w)
    else:
        raise RuntimeError(f"no builder for week {w}")

    for day in days:
        if day["sessionType"] == "gym":
            cat = gym_intensity_category(w, day)
            day["blocks"] = [warmup_block(cat)] + day["blocks"] + [cooldown_block(cat)]

    attach_logging(days)

    dates = week_dates(w)
    weeks_out.append({
        "weekNum": w,
        "phase": phase_for_week(w),
        "dateRange": f"{dates[0].strftime('%b %-d')} - {dates[6].strftime('%b %-d')}",
        "days": days,
    })

PROGRAM = {
    "startDate": PROGRAM_START.isoformat(),
    "race1": RACE1.isoformat(),
    "race2": RACE2.isoformat(),
    "races": RACES,
    "phases": PHASES,
    "weeks": weeks_out,
}

with open("js/program-data.js", "w") as f:
    f.write("// Auto-generated by generate_program.py — edit that file and regenerate,\n")
    f.write("// or hand-edit the day objects below directly; both are plain data.\n")
    f.write("const PROGRAM = ")
    f.write(json.dumps(PROGRAM, indent=2))
    f.write(";\n")

print(f"Generated {len(weeks_out)} weeks, {sum(len(w['days']) for w in weeks_out)} days.")
