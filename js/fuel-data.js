// Race-week fuel plan. Targets are per kg of body weight so they scale to
// whoever's profile is open; meal options show approximate carbs (C) and
// protein (P) for a ~70 kg athlete - scale portions up or down to hit the day.
// Based on standard sports-nutrition guidance for a ~75 min high-intensity race:
// a 24-36 h carbohydrate fuel-up (7-8 g/kg the day before), 1-4 g/kg 1-4 h
// before the start, 5-7 ml/kg of fluid ~4 h out, sodium to help hold it.
const FUEL_PLAN = {
  days: [
    // "dynamic": carbs, fluid, electrolytes and meals follow that day's session (rest vs training)
    { offset: -6, dynamic: true, title: "Normal training week",
      focus: "Normal training fuel. Don't start cutting anything this week - the goal is to arrive full, not light." },
    { offset: -5, dynamic: true, title: "Normal training week",
      focus: "Protein at every meal, plenty of fruit and veg while fibre is still on the menu." },
    { offset: -4, dynamic: true, title: "Normal training week",
      focus: "Eat around the session: carbs before, carbs and protein within an hour after." },
    { offset: -3, dynamic: true, title: "Alcohol stops",
      focus: "No alcohol from today. If you're trying beetroot juice, today's the first shot." },
    { offset: -2, title: "Fuel-up starts", carbs: 6, protein: 1.7, fluid: "3.0-3.5 L", fluidNote: "spread through the day", electrolytes: "1 serving", electrolytesNote: "with lunch", fibre: "Start cutting back at dinner", mealSet: "load",
      focus: "Carbs step up. Swap wholegrain for white rice, pasta and bread from dinner onwards so your gut is quiet by race day." },
    { offset: -1, title: "Fuel-up day", carbs: 8, protein: 1.6, fluid: "3.0-3.5 L", fluidNote: "spread out - ease off 2 h before bed", electrolytes: "2 servings", electrolytesNote: "lunch + dinner", fibre: "Low - no beans, lentils, big salads", mealSet: "fuelup",
      focus: "The big day. Biggest carb meal at LUNCH, a normal-sized familiar dinner by ~7pm. Keep fat low so there's room for carbs. Expect the scale to be up 1-2 kg tomorrow - that's stored carbs and water, exactly the point. Coffee in the morning is fine; none after ~2pm." },
    { offset: 0, title: "Race day", race: true, carbs: 0, protein: 0, fluid: "~1 L before the start", fluidNote: "see the timeline", electrolytes: "2 servings", electrolytesNote: "pre-race drink + after", fibre: "Low", mealSet: "race",
      focus: "Nothing new today. Every food, drink, gel and caffeine dose should be something you've used before a hard session." },
    { offset: 1, title: "Recovery", carbs: 5, protein: 2.0, fluid: "3.0 L", fluidNote: "through the day", electrolytes: "1 serving", electrolytesNote: "in the morning", fibre: "Normal", mealSet: "recovery",
      focus: "Refill and repair: protein at every meal, carbs back to normal, an easy walk. A drink or two is fine now if you want one." },
  ],

  meals: {
    training: {
      Breakfast: [
        { text: "3 Weetabix, 300 ml milk, banana + 2 eggs on toast", c: 97, p: 34 },
        { text: "Porridge (60 g oats, 300 ml milk), banana, honey, scoop of whey stirred in", c: 93, p: 40 },
        { text: "2 slices toast, 3 scrambled eggs, 300 ml orange juice", c: 63, p: 26 },
      ],
      Lunch: [
        { text: "Chicken and rice bowl: 250 g cooked white rice, 150 g chicken, veg", c: 72, p: 50 },
        { text: "2 chicken or tuna wraps with salad + a Greek yoghurt", c: 74, p: 45 },
        { text: "Jacket potato, tin of tuna, sweetcorn, side salad", c: 73, p: 30 },
      ],
      Dinner: [
        { text: "Salmon, 300 g boiled potatoes, green veg", c: 55, p: 33 },
        { text: "Chilli con carne (5% mince) with 250 g cooked rice", c: 82, p: 33 },
        { text: "Chicken stir-fry with 300 g cooked noodles", c: 83, p: 45 },
      ],
      Snacks: [
        { text: "Greek yoghurt 200 g, honey, berries", c: 30, p: 20 },
        { text: "Banana + 2 rice cakes with peanut butter", c: 40, p: 6 },
        { text: "Malt loaf, 2 slices", c: 42, p: 5 },
        { text: "Protein shake + an apple", c: 18, p: 25 },
      ],
    },
    rest: {
      Breakfast: [
        { text: "3-egg omelette, 2 slices toast, tomatoes", c: 40, p: 27 },
        { text: "Greek yoghurt 250 g, 2 Weetabix, berries, honey", c: 55, p: 30 },
      ],
      Lunch: [
        { text: "Chicken salad wrap + a piece of fruit", c: 50, p: 40 },
        { text: "Leftover chilli with a small portion of rice", c: 55, p: 30 },
      ],
      Dinner: [
        { text: "Roast chicken, 250 g potatoes, two veg", c: 45, p: 45 },
        { text: "Salmon, 200 g cooked rice, broccoli", c: 58, p: 32 },
      ],
      Snacks: [
        { text: "Apple + a small piece of cheese", c: 15, p: 8 },
        { text: "Cottage cheese and crackers", c: 20, p: 15 },
        { text: "Protein shake", c: 3, p: 24 },
      ],
    },
    load: {
      Breakfast: [
        { text: "3 Weetabix, 300 ml milk, banana, honey + 300 ml orange juice", c: 122, p: 15 },
        { text: "Bagel with jam, 2 boiled eggs, banana, 300 ml orange juice", c: 107, p: 22 },
      ],
      Lunch: [
        { text: "300 g cooked white rice, 150 g chicken, sweet chilli sauce", c: 104, p: 51 },
        { text: "2 chicken wraps, Greek yoghurt, 50 g pretzels", c: 104, p: 46 },
      ],
      Dinner: [
        { text: "300 g cooked white pasta, tomato sauce, 120 g chicken", c: 100, p: 53 },
        { text: "300 g cooked white rice, salmon, small portion of veg", c: 90, p: 36 },
      ],
      Snacks: [
        { text: "Malt loaf, 2 slices", c: 42, p: 5 },
        { text: "2 crumpets with jam", c: 50, p: 4 },
        { text: "Rice pudding pot", c: 30, p: 5 },
        { text: "500 ml sports drink", c: 30, p: 0 },
      ],
    },
    fuelup: {
      Breakfast: [
        { text: "3 Weetabix, 300 ml milk, banana, 2 tbsp honey + 300 ml orange juice", c: 140, p: 15 },
        { text: "Bagel with jam, banana, low-fat yoghurt + 300 ml orange juice", c: 120, p: 17 },
      ],
      Lunch: [
        { text: "BIGGEST MEAL: 350 g cooked white rice, 150 g chicken, sweet chilli sauce + 500 ml sports drink or squash", c: 140, p: 52 },
        { text: "BIGGEST MEAL: 2 large white wraps with chicken, 50 g pretzels + 500 ml sports drink", c: 136, p: 40 },
      ],
      Dinner: [
        { text: "300 g cooked white pasta, tomato sauce, 100 g chicken - by ~7pm", c: 100, p: 47 },
        { text: "300 g cooked white rice, white fish or chicken, soy sauce - by ~7pm", c: 90, p: 35 },
      ],
      Snacks: [
        { text: "Malt loaf, 2 slices", c: 42, p: 5 },
        { text: "Jelly sweets, 50 g", c: 40, p: 3 },
        { text: "Rice pudding pot + tinned peaches", c: 45, p: 5 },
        { text: "2 rice cakes with jam", c: 24, p: 2 },
      ],
    },
    recovery: {
      Breakfast: [
        { text: "3 eggs, 2 slices toast, beans, orange juice", c: 75, p: 35 },
        { text: "Porridge with whey, banana, honey", c: 93, p: 40 },
      ],
      Lunch: [
        { text: "Chicken and rice bowl with plenty of veg", c: 72, p: 50 },
        { text: "Tuna jacket potato + side salad + yoghurt", c: 80, p: 40 },
      ],
      Dinner: [
        { text: "Whatever you've been craving - just get 30-40 g protein in it", c: 80, p: 40 },
      ],
      Snacks: [
        { text: "Greek yoghurt, honey, berries", c: 30, p: 20 },
        { text: "Protein shake + banana", c: 28, p: 25 },
      ],
    },
  },

  // Training-day vs rest-day values for the "dynamic" days above.
  dynamic: {
    training: { carbs: 5, protein: 1.8, fluid: "3.0 L", fluidNote: "+0.5 L per hour of training", electrolytes: "Optional", electrolytesNote: "1 serving after the session if you sweat heavily", fibre: "Normal", mealSet: "training" },
    rest: { carbs: 4, protein: 1.8, fluid: "2.5-3.0 L", fluidNote: "through the day", electrolytes: "None", electrolytesNote: "not needed on a rest day", fibre: "Normal - plenty of veg", mealSet: "rest" },
  },

  // Start-time variants: early = before 10:00, late = 13:00 or later, mid = in between.
  earlyStartNote: "Early start tomorrow: dinner is your last big meal - make it as big as lunch, finish by ~7pm, and have a small carb snack before bed (rice pudding, or toast and jam). Set an alarm for breakfast 2.5 h before your start.",

  // Race day timeline, minutes relative to the start (negative = before).
  // "variants" limits an item to early / mid / late starts; no variants = always shown.
  raceTimeline: [
    { at: -390, variants: ["late"], title: "Breakfast", detail: "A normal carb-rich breakfast and a big glass of water. You'll eat again 3-4 h before the start.",
      options: [
        { text: "3 Weetabix, 300 ml milk, banana, honey", c: 95, p: 15 },
        { text: "2 slices toast with jam, 2 eggs, 300 ml orange juice", c: 73, p: 21 },
      ] },
    { at: -210, variants: ["late"], title: "Pre-race lunch + first drink", detail: "~2 g/kg carbs, 20-25 g protein, low fat and fibre. With it: 5-7 ml/kg of fluid (≈400-500 ml) containing 1 electrolyte serving.",
      options: [
        { text: "300 g cooked white rice, 100 g chicken, banana, 300 ml orange juice", c: 136, p: 36 },
        { text: "300 g cooked white pasta, tomato sauce, 100 g chicken, 300 ml orange juice", c: 117, p: 47 },
        { text: "2 bagels with jam + a rice pudding pot", c: 130, p: 20 },
      ] },
    { at: -225, variants: ["mid"], title: "Pre-race meal + first drink", detail: "~2 g/kg carbs, 20-25 g protein, low fat and fibre. With it: 5-7 ml/kg of fluid (≈400-500 ml) containing 1 electrolyte serving.",
      options: [
        { text: "3 Weetabix, 250 ml milk, banana, honey + 2 slices toast with jam", c: 139, p: 23 },
        { text: "Bagel with jam, banana, 300 ml orange juice, rice pudding pot", c: 137, p: 14 },
      ] },
    { at: -180, variants: ["early"], title: "Get up", detail: "Up 3 h before the start. 300 ml water straight away to wake the gut up." },
    { at: -150, variants: ["early"], title: "Breakfast + first drink", detail: "Smaller than usual: ~1-1.5 g/kg carbs, a little protein, very low fat and fibre - last night's dinner did the heavy lifting. With it: 400-500 ml containing 1 electrolyte serving.",
      options: [
        { text: "2 slices white toast with jam, banana, 300 ml orange juice", c: 98, p: 8 },
        { text: "Bagel with honey + banana", c: 87, p: 10 },
        { text: "Porridge (50 g oats, milk), honey, banana - if your gut is used to it", c: 87, p: 14 },
      ] },
    { at: -150, title: "Beetroot shot (optional)", detail: "Only if you've used it in training." },
    { at: -120, title: "Check your urine", detail: "Still dark? Another 250 ml with a pinch of salt or half an electrolyte serving. Pale already? Just sip." },
    { at: -60, title: "Caffeine (optional)", detail: "~3 mg/kg - about 210 mg at 71 kg, roughly two strong coffees or one 200 mg tablet. Only if you normally have caffeine before hard sessions." },
    { at: -45, title: "Last proper drink", detail: "Stop big gulps now so you're not looking for a toilet in Run 1. Sips only from here." },
    { at: -35, title: "Start the race-day warm-up", detail: "15 min - on the Mobility tab." },
    { at: -20, title: "Quick carbs", detail: "20-30 g: a gel, a banana, or a handful of jelly sweets, with a few sips of water. Don't skip this on an early start." },
    { at: 0, title: "Start", detail: "During the race: a few sips of water at the water point is plenty. Optional gel (~25 g) before Run 5 - only if you've tested it in training." },
    { at: 105, title: "Recovery window", detail: "Within an hour of finishing: ~1-1.2 g/kg carbs (≈75-85 g) + 30-40 g protein + 500 ml with an electrolyte serving. Keep sipping to ~1.5 L over the next 2-3 h, then a normal meal." },
  ],

  supplements: [
    { name: "Creatine monohydrate", how: "3-5 g a day. Keep taking it through race week if you already do. Don't start it this week - it adds water weight and can upset your stomach." },
    { name: "Caffeine", how: "About 3 mg/kg, 45-60 min before the start, only if you use it before hard training. More isn't better." },
    { name: "Electrolytes", how: "Sachets or tabs with roughly 500-1,000 mg sodium per serving: lunch on D-2, lunch and dinner on D-1, with the pre-race drink, and after the race. Skip the extra sodium if a doctor has told you to limit salt." },
    { name: "Beetroot juice (optional)", how: "One concentrated shot a day from D-3, and one 2-3 h before the start - only if you've tried it in training. It can upset the stomach and turns urine pink." },
    { name: "Not this week", how: "Anything new: new gels, pre-workouts, sodium bicarbonate, high-dose vitamins. Race week is for things you already know work." },
  ],

  rules: [
    "Nothing new on race day.",
    "Pale-straw urine means you're hydrated. Clear all day means you're overdoing it and diluting your sodium.",
    "On D-1 the biggest carb meal is lunch, not dinner.",
    "Scale up 1-2 kg on race morning is stored carbs and water. That's the fuel-up working.",
    "The race-day timeline changes with your start time: early waves get a smaller breakfast 2.5 h out, afternoon waves get breakfast plus a pre-race lunch.",
    "General guidance scaled to your weight - if you have a medical condition or take medication, check with your GP or a dietitian.",
  ],
};
