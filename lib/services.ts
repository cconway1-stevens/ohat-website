export type ServiceFaq = { question: string; answer: string };

export type ServiceResource = { label: string; href: string; note: string };

export type Service = {
  slug: string;
  name: string;
  short: string;
  intro: string;
  signs: string[];
  includes: string[];
  // Expanded, service-specific content recommended by the local-SEO audit:
  // each page should explain the diagnosis, the shop's qualifications, cost
  // factors, and answer real service-counter questions in natural prose.
  diagnosis: string;
  whyUs: string;
  cost: string;
  faqs: ServiceFaq[];
  related: string[];
  metaTitle?: string;
  metaDescription?: string;
  resources?: ServiceResource[];
};

export const services: Service[] = [
  {
    slug: "advanced-diagnostics",
    name: "Advanced Diagnostics",
    metaTitle: "Check Engine Light & Auto Diagnostics in Egg Harbor Township, NJ",
    metaDescription:
      "Evidence-based check-engine-light, electrical and drivability diagnostics in Egg Harbor Township for gas, diesel, hybrid and electric vehicles.",
    short: "Check-engine lights, electrical faults, and the hard-to-find issues.",
    intro:
      "Modern vehicles are rolling computer networks. Our diagnostic process combines professional scan tools, live data, electrical testing, and hands-on experience to find the cause—not just clear the code.",
    signs: ["Warning lights", "Intermittent stalling", "Electrical glitches", "A repair that did not solve the issue"],
    includes: ["Full-system scan", "Live-data testing", "Electrical circuit diagnosis", "Clear repair recommendations"],
    diagnosis:
      "We start with a full-system scan of every module in the vehicle, not just the engine computer, then compare live sensor data against known-good values. When a code points at a circuit rather than a part, we test that circuit—power, ground, and signal—before recommending anything. That is the difference between diagnosing a fault and replacing parts until the light goes out.",
    whyUs:
      "A parts-store code reader tells you what the computer noticed, not why it happened. Our technicians work from factory service information with dealer-level scan capability across gas, diesel, hybrid, and electric vehicles, and we regularly find root causes on vehicles other shops could not resolve.",
    cost: "Diagnostic time depends on how the fault behaves: a hard fault that is present in the bay is usually quicker to isolate than an intermittent problem that only appears on the highway or in the rain. We explain what testing is needed and get your approval before the work begins, and the diagnosis always ends with a written, prioritized repair recommendation.",
    faqs: [
      {
        question: "My check-engine light is on but the car drives fine. Do I need to come in?",
        answer:
          "A steady light with no symptoms is not an emergency, but it should not be ignored—many faults quietly reduce fuel economy or cause damage over time, and an active code can also mask new problems. A flashing check-engine light is different: that indicates an active misfire that can damage the catalytic converter, so reduce speed and have the vehicle checked promptly.",
      },
      {
        question: "Can you just clear the code?",
        answer:
          "We can, but the code comes back if the cause is still there, and clearing codes erases the freeze-frame data that helps us diagnose the fault. We would rather find the reason the light came on and let you decide what to do with real information.",
      },
      {
        question: "Another shop replaced parts and the problem is still there. Can you help?",
        answer:
          "This is one of the most common reasons drivers come to us. We start the diagnosis from scratch with system-level testing rather than assuming the previous parts were the answer, and we explain the evidence behind our conclusion.",
      },
    ],
    related: ["battery-electrical", "engine-cooling", "exhaust-emissions"],
  },
  {
    slug: "brake-repair",
    name: "Brake Repair",
    metaDescription:
      "Brake inspections and repair for pads, rotors, calipers, fluid, hoses and ABS from ASE-certified technicians in Egg Harbor Township.",
    short: "Confident stops, honest inspections, and complete brake service.",
    intro:
      "Ocean Heights Auto & Tire provides complete brake inspection and repair for cars, SUVs, light trucks, hybrids, EVs, diesels, and classic vehicles in Egg Harbor Township. Whether your brakes squeal, grind, pull, vibrate, or trigger a dashboard warning, our technicians inspect the complete braking system before recommending repairs.",
    signs: ["Squealing or grinding", "Soft brake pedal", "Vehicle pulls while braking", "Brake warning light"],
    includes: ["Pads and rotors", "Calipers and hoses", "Brake fluid service", "ABS diagnosis"],
    diagnosis:
      "A brake inspection here covers the whole system: pad and rotor measurements at every wheel, caliper and slide operation, hoses and lines, fluid condition, the parking brake, and any ABS or brake warning codes. We show you the measurements and explain what needs attention now, what can wait, and why—so you are never guessing whether a repair was necessary.",
    whyUs:
      "Brakes are where trust matters most, and it is the service our reviews mention again and again. Our ASE-certified technicians service conventional hydraulic brakes and the regenerative systems on hybrids and EVs, whose pads can wear differently and whose electronic controls need the right service procedures.",
    cost: "Brake repair cost depends on what the inspection finds: pad material, whether rotors can be resurfaced or need replacement, caliper condition, and fluid age all play a role. Vehicles that sit near the Shore's salt air often need hardware and lines addressed sooner than inland cars. We quote the complete job before any work starts.",
    faqs: [
      {
        question: "How do I know if I need pads, rotors, or both?",
        answer:
          "Measurement, not mileage. Pads wear at different rates depending on driving, and rotors have a minimum safe thickness stamped on them. We measure both at every wheel and only recommend replacing what is actually at or near its limit.",
      },
      {
        question: "Why do my brakes squeal even though they were recently serviced?",
        answer:
          "Light squeal can come from glazing, missing anti-rattle hardware, moisture, or pad material—not just wear. Grinding is different and usually means metal-on-metal contact. Either way, an inspection tells us quickly which one you have.",
      },
      {
        question: "Do hybrid and electric vehicles still need brake service?",
        answer:
          "Yes. Regenerative braking means the friction brakes work less, but that can let calipers and hardware seize from disuse, especially near salt air. Hybrid and EV brakes need periodic inspection and service using the correct electronic-brake procedures, which we perform here.",
      },
    ],
    related: ["tires", "wheel-alignment", "suspension-steering"],
  },
  {
    slug: "tires",
    name: "Tires & Tire Repair",
    metaTitle: "Tire Shop & Tire Repair in Egg Harbor Township, NJ",
    metaDescription:
      "Shop tires and schedule tire installation, flat repair, balancing, rotation and TPMS service at Ocean Heights Auto & Tire in Egg Harbor Township.",
    short: "Tire sales, flat repair, balancing, rotation, and TPMS service.",
    intro:
      "The right tires are the foundation of safety, ride quality, fuel economy, and braking distance. Ocean Heights sells and installs new tires, repairs flats, balances and rotates, and services tire-pressure monitoring systems for cars, trucks, hybrids, and EVs in Egg Harbor Township.",
    signs: ["Uneven or rapid tread wear", "Vibration at speed", "Low tire pressure light", "A puncture, bubble, or sidewall damage"],
    includes: ["New tire sales and installation", "Flat and puncture repair", "Balancing and rotation", "TPMS diagnosis and service"],
    diagnosis:
      "Before recommending tires, we look at how the old set wore: even wear says the tires simply aged out, while edge wear, center wear, cupping, or one-sided wear point at inflation, alignment, or suspension causes that would destroy a new set just as fast. Every installation includes balancing, new valve hardware where appropriate, and a TPMS relearn so the pressure warning system works the way it should.",
    whyUs:
      "Because we are a full repair shop and not just a tire store, we fix the reason tires wore out—alignment, suspension, or inflation—rather than only replacing them. We can match tires to how you actually drive, including the heavier weight and instant torque of hybrids and EVs that wear ordinary tires quickly.",
    cost: "Tire pricing depends on size, speed and load rating, brand, and category (all-season, touring, performance, truck, or EV-specific). Installation, balancing, and TPMS service are quoted with the tires so there are no surprise line items. Flat repairs are inexpensive when the puncture is in the repairable tread area—sidewall and shoulder damage cannot be safely repaired.",
    faqs: [
      {
        question: "Can my flat tire be repaired or does it need replacement?",
        answer:
          "A puncture up to about a quarter-inch in the central tread area can usually be repaired properly with a plug-patch from the inside. Sidewall damage, large cuts, run-flat damage from driving on an empty tire, or a previous bad repair usually mean replacement. We inspect the tire off the wheel before promising either.",
      },
      {
        question: "Do I really need to rotate my tires?",
        answer:
          "Yes—front and rear tires wear differently, and regular rotation (typically every 5,000–8,000 miles) evens that out so the set lasts longer and the car keeps predictable handling. It is also when we spot alignment or suspension wear early.",
      },
      {
        question: "Why is my tire-pressure light on when the tires look fine?",
        answer:
          "Tires can be 25% low before they look low. The light can also mean a slow leak, a temperature swing, a failing TPMS sensor, or a system that needs a relearn after a rotation. We check actual pressures and sensor data rather than guessing.",
      },
    ],
    related: ["wheel-alignment", "brake-repair", "suspension-steering"],
  },
  {
    slug: "wheel-alignment",
    name: "Wheel Alignment",
    metaDescription:
      "Computerized wheel alignment for pulling, uneven tire wear, crooked steering wheels and handling concerns in Egg Harbor Township.",
    short: "Computerized alignment for straight tracking and even tire wear.",
    intro:
      "If your vehicle pulls to one side, the steering wheel sits crooked, or your tires wear unevenly, the alignment is the first thing to check. Ocean Heights performs computerized four-wheel alignment for cars, SUVs, trucks, hybrids, EVs, and classics in Egg Harbor Township.",
    signs: ["Pulling or drifting to one side", "Steering wheel off-center", "Uneven or feathered tire wear", "Wandering after hitting a pothole or curb"],
    includes: ["Computerized four-wheel alignment", "Steering and suspension inspection", "Before-and-after alignment readings", "Custom alignment settings on request"],
    diagnosis:
      "An alignment is only as good as the parts being aligned, so we inspect tie rods, ball joints, bushings, and wheel bearings before putting the vehicle on the alignment system. You get printed before-and-after readings for camber, caster, and toe, and we explain any measurement that could not be brought into specification and why.",
    whyUs:
      "Alignment is precision work, and our reviews include drivers who brought us custom camber and toe requests that other shops would not touch. We align everything from daily commuters to lowered cars, work trucks, and EVs, and because we also sell tires we have every reason to make your current set last.",
    cost: "Most vehicles need a standard four-wheel alignment at a flat price. Cost increases only when worn parts must be replaced first—an alignment cannot compensate for a loose tie rod—or when a vehicle needs additional adjustment hardware. We tell you before the work starts, never after.",
    faqs: [
      {
        question: "How often should I get an alignment?",
        answer:
          "There is no fixed interval. Check it when you buy new tires, after hitting a serious pothole or curb, after suspension repairs, or whenever the vehicle pulls or the steering wheel sits off-center. An annual check is cheap insurance for tire life.",
      },
      {
        question: "Will an alignment fix my steering-wheel vibration?",
        answer:
          "Usually not—vibration at speed is more often balance, a bent wheel, or tire wear, while alignment problems show up as pulling and uneven wear. We diagnose which one you have before selling you either service.",
      },
      {
        question: "My car pulls to one side. Is that always alignment?",
        answer:
          "No. Tire conicity, mismatched pressures, a dragging brake caliper, and road crown can all cause pull. Part of our alignment process is separating those causes, which is why the inspection comes first.",
      },
    ],
    related: ["tires", "suspension-steering", "brake-repair"],
  },
  {
    slug: "oil-maintenance",
    name: "Oil & Scheduled Maintenance",
    metaTitle: "Oil Change & Scheduled Maintenance in Egg Harbor Township, NJ",
    metaDescription:
      "Oil changes, filters, fluids, belts, hoses and factory-scheduled maintenance tailored to your vehicle in Egg Harbor Township at Ocean Heights Auto & Tire.",
    short: "Factory-aware maintenance that protects reliability and value.",
    intro:
      "We tailor maintenance to your vehicle, mileage, driving habits, and manufacturer schedule instead of applying a one-size-fits-all checklist.",
    signs: ["Maintenance reminder", "Overdue service", "Fluid leaks", "Planning for a road trip"],
    includes: ["Oil and filter", "Fluids and filters", "Belts and hoses", "Mileage-based inspections"],
    diagnosis:
      "Every oil service includes more than draining and filling: we use the oil grade your manufacturer specifies, inspect belts, hoses, fluids, tires, and the underside while the vehicle is up, and check your mileage against the factory maintenance schedule. You leave knowing what is due now, what is coming, and what can genuinely wait.",
    whyUs:
      "Quick-lube chains sell the same service to every car. We maintain the vehicle you actually drive—following the factory schedule for your engine, transmission, and drivetrain, including the different needs of diesels, hybrids, EVs, and older carbureted vehicles that a lube rack will not touch.",
    cost: "Oil-change cost depends mostly on oil type and capacity: modern engines commonly require full-synthetic oil and hold more of it. Scheduled-maintenance pricing follows the factory list for your mileage, and we will always tell you which items are safety-related, which protect the warranty, and which are optional.",
    faqs: [
      {
        question: "How often do I really need an oil change?",
        answer:
          "Follow your manufacturer's interval—typically 5,000 to 10,000 miles for modern engines on synthetic oil, shorter for severe use like short trips, towing, or older engines. The 3,000-mile rule is outdated for most vehicles, but stretching a synthetic interval far past the schedule is how engines sludge up.",
      },
      {
        question: "Do I have to go to the dealer to keep my new-car warranty?",
        answer:
          "No. Under U.S. law a manufacturer cannot require dealer service to keep your warranty in force—you need the required maintenance performed on schedule with appropriate parts and fluids, and records of it. We follow the factory schedule and document everything on your invoice.",
      },
      {
        question: "What maintenance do hybrids and EVs still need?",
        answer:
          "Hybrids need normal engine maintenance plus attention to their cooling and 12-volt systems. EVs skip oil changes but still need tire rotations, brake inspections, cabin filters, coolant service for the battery and electronics, and suspension checks—their weight is hard on tires and chassis parts.",
      },
    ],
    related: ["tires", "engine-cooling", "battery-electrical"],
  },
  {
    slug: "hybrid-ev-service",
    name: "Hybrid & EV Service",
    metaDescription:
      "Hybrid and electric vehicle service in Egg Harbor Township for brakes, tires, cooling, 12-volt systems, maintenance and drivability concerns.",
    short: "Modern maintenance and diagnostics for electrified vehicles.",
    intro:
      "Hybrid and electric vehicles still need expert care for brakes, suspension, climate systems, tires, low-voltage electronics, cooling, and diagnostics.",
    signs: ["EV or hybrid warning", "Reduced range", "Charging concern", "Unusual brake feel"],
    includes: ["System diagnostics", "Cooling system service", "12-volt electrical", "Chassis, brakes, tires, and A/C"],
    diagnosis:
      "Electrified vehicles put their own demands on diagnosis: hybrid warning lights, range complaints, and charging concerns require reading the vehicle's high-voltage system data with capable scan tools, while everyday problems—brakes, suspension, tires, the 12-volt battery—still need traditional inspection. We do both, and we tell you plainly when a concern belongs at the manufacturer, such as a high-voltage battery still under its long federal warranty.",
    whyUs:
      "Many independent shops turn hybrids and EVs away. We service them daily alongside gas, diesel, and classic vehicles, which means you get one local shop for the whole driveway instead of a dealership line for the EV and a garage for everything else.",
    cost: "Routine hybrid and EV service—tires, brakes, suspension, cabin filters, coolant services—costs about the same as on a conventional car. EV tires can cost more because of load ratings and wear rates. Diagnostic work is quoted like any other vehicle: we explain the testing needed and get approval first.",
    faqs: [
      {
        question: "Can an independent shop work on my EV without voiding the warranty?",
        answer:
          "Yes, for the maintenance and repairs we perform—tires, brakes, suspension, cooling, and 12-volt systems. High-voltage battery and drive-unit warranty repairs belong at the manufacturer's dealer, and we will tell you when that is the right destination.",
      },
      {
        question: "Why do EVs wear out tires so fast?",
        answer:
          "Weight and instant torque. EVs are hundreds of pounds heavier than comparable gas cars and deliver full torque from a stop, which can cut tire life dramatically. Regular rotations and the right tire choice make a real difference, and we handle both.",
      },
      {
        question: "My hybrid's ride and brakes feel different lately. Is that normal?",
        answer:
          "A change in brake feel can be the transition between regenerative and friction braking wearing poorly, or friction brakes seizing from disuse. It is worth an inspection—hybrid brake hardware often needs service before the pads are actually worn out.",
      },
    ],
    related: ["battery-electrical", "tires", "brake-repair"],
  },
  {
    slug: "air-conditioning",
    name: "A/C & Climate Control",
    metaDescription:
      "Car A/C repair in Egg Harbor Township: performance testing, leak diagnosis, compressor evaluation, heat and defrost repair from Ocean Heights Auto & Tire.",
    short: "Cool air, reliable heat, and complete climate-system diagnosis.",
    intro:
      "We find leaks, test controls, evaluate compressor operation, and restore comfort without guessing at expensive parts.",
    signs: ["Warm air from vents", "Weak airflow", "Unusual compressor noise", "Windows will not defog"],
    includes: ["Performance testing", "Leak diagnosis", "Electrical controls", "Heating and cooling repair"],
    diagnosis:
      "We begin with a performance test—vent temperatures, system pressures, and compressor operation—then find where the refrigerant went before adding more. A system that is low has a leak; recharging without finding it just schedules the same failure for later in the summer. Electrical climate controls, blend doors, fans, and heater output get tested the same way: measure first, replace second.",
    whyUs:
      "A/C work rewards patience and the right equipment. We diagnose the whole climate system—refrigerant circuit, electrical controls, and airflow—rather than quoting a compressor for every warm-air complaint, and we service the electric compressors and dual-zone systems in modern hybrids and EVs as well.",
    cost: "Cost depends on where the problem is: a leaking service valve or worn O-ring is a far smaller job than a compressor, condenser, or evaporator. Refrigerant type also matters, as newer vehicles use refrigerants that cost more per ounce. The diagnosis tells you exactly which repair you actually need before you commit to it.",
    faqs: [
      {
        question: "Why is my A/C blowing warm air?",
        answer:
          "The most common cause is low refrigerant from a leak, but a failed compressor clutch, a blend-door fault, or an electrical control problem can produce the same symptom. A performance test separates them quickly, which is why we test before quoting parts.",
      },
      {
        question: "Can't I just use a recharge can from the parts store?",
        answer:
          "DIY cans can overcharge the system, mask the leak, and many contain sealers that damage professional recovery equipment and your own compressor. If the system needed a can, it has a leak worth finding.",
      },
      {
        question: "My defroster barely clears the windshield. Is that an A/C problem?",
        answer:
          "Often yes—defrost mode uses the A/C to dry the air, so a weak system fogs windows in winter too. Weak airflow can also be a cabin filter or blower problem. Either way it is a safety issue worth diagnosing before cold weather.",
      },
    ],
    related: ["battery-electrical", "engine-cooling", "advanced-diagnostics"],
  },
  {
    slug: "engine-cooling",
    name: "Engine & Cooling",
    metaDescription:
      "Overheating, coolant leaks, rough running and engine repair in Egg Harbor Township. Evidence-based testing from Ocean Heights Auto & Tire.",
    short: "Cooling, fuel, ignition, drivability, and engine repair.",
    intro:
      "Overheating, rough running, and power loss can have many causes. We test methodically and build a repair plan around evidence.",
    signs: ["Overheating", "Rough idle", "Loss of power", "Smoke or unusual odor"],
    includes: ["Cooling systems", "Fuel and ignition", "Belts and hoses", "Engine performance"],
    diagnosis:
      "Overheating gets a system test—pressure testing for leaks, thermostat and fan operation, radiator flow, and head-gasket checks when the evidence points that way. Drivability complaints like rough idle and power loss get the same treatment through fuel, ignition, and compression testing. The goal is always the same: identify the failed component with evidence before recommending the repair.",
    whyUs:
      "Engine work is where guesswork gets expensive. Our diagnostic-first approach means you are paying for the repair the engine actually needs—whether that is a thermostat, a water pump, ignition components, or a candid conversation about whether a major repair makes sense for the vehicle's value.",
    cost: "Cooling repairs range widely—a hose or thermostat is a modest job, while radiators, water pumps buried behind timing components, and head gaskets cost more because of labor time. We give you the complete picture, including whether related aging parts should be done at the same time to avoid paying overlapping labor twice.",
    faqs: [
      {
        question: "My temperature gauge is climbing. Can I keep driving?",
        answer:
          "No—pull over safely and shut the engine off. Modern aluminum engines tolerate very little overheating before head gaskets and cylinder heads are damaged, turning a cooling repair into an engine replacement. A tow is always cheaper than a warped head.",
      },
      {
        question: "Why does my coolant keep getting low with no visible leak?",
        answer:
          "Small leaks can evaporate off hot engine parts before they reach the ground, and internal leaks burn coolant invisibly through the exhaust. A pressure test and inspection finds external leaks; chemical and pressure testing identifies internal ones.",
      },
      {
        question: "Is a rough idle worth fixing if the car still drives?",
        answer:
          "Usually, yes—rough idle is an early symptom of ignition, fuel, or vacuum problems that get worse and can damage the catalytic converter if misfires continue. Early diagnosis is almost always the cheaper path.",
      },
    ],
    related: ["advanced-diagnostics", "exhaust-emissions", "oil-maintenance"],
  },
  {
    slug: "suspension-steering",
    name: "Suspension & Steering",
    metaDescription:
      "Shocks, struts, wheel bearings, ball joints and steering repair in Egg Harbor Township for clunks, wandering, uneven wear and rough rides.",
    short: "Restore ride control, tire contact, and predictable handling.",
    intro:
      "A stable vehicle is a safer vehicle. We inspect steering and suspension components as a connected system before recommending repairs.",
    signs: ["Clunks over bumps", "Loose steering", "Bouncy ride", "Uneven tire wear"],
    includes: ["Shocks and struts", "Ball joints and tie rods", "Wheel bearings", "Steering diagnosis"],
    diagnosis:
      "Suspension noises travel, so we never diagnose a clunk from the driver's seat. The vehicle goes up on the lift for a hands-on inspection of ball joints, tie rods, bushings, sway-bar links, mounts, and wheel bearings, checking each for the specific play or wear that produces your symptom. South Jersey's salt air is hard on this hardware, and catching a worn joint early is much cheaper than the tire wear and alignment problems it causes later.",
    whyUs:
      "Because we also do alignments and tires, we see what worn suspension does to a vehicle over time and we fix the cause rather than the symptom. We handle everything from family SUVs to lowered enthusiast cars, work trucks, heavy EVs, and classic suspensions with serviceable joints.",
    cost: "Cost depends on which components are worn and whether they are individually replaceable or part of an assembly. Struts are commonly replaced in pairs to keep handling balanced, and suspension replacement is usually followed by an alignment, which we quote up front as part of the same job.",
    faqs: [
      {
        question: "How do I know if my shocks or struts are worn?",
        answer:
          "Symptoms include a bouncy or floaty ride, nose-dive under braking, cupped tire wear, and clunks over bumps. Age matters too—struts wear gradually over tens of thousands of miles, so the decline is easy to miss until you drive a car with new ones.",
      },
      {
        question: "Is a clunk over bumps dangerous?",
        answer:
          "It can be. A worn sway-bar link is a nuisance; a failing ball joint can separate and drop the corner of the vehicle. Since the sounds are similar from the driver's seat, an inspection is the only way to know which one you have.",
      },
      {
        question: "Why does my steering feel loose on the highway?",
        answer:
          "Wandering or vague steering usually points at worn tie rods, ball joints, or bushings, though alignment and tire condition contribute. We inspect the linkage first because aligning a vehicle with loose parts wastes the alignment.",
      },
    ],
    related: ["wheel-alignment", "tires", "brake-repair"],
  },
  {
    slug: "transmission-driveline",
    name: "Transmission & Driveline",
    metaDescription:
      "Transmission service, CV axles, differentials and driveline diagnosis in Egg Harbor Township from Ocean Heights Auto & Tire.",
    short: "Fluid service and diagnosis for power delivery concerns.",
    intro:
      "Shifting concerns are not always a failed transmission. We evaluate controls, fluids, mounts, axles, and related systems before drawing conclusions.",
    signs: ["Harsh or delayed shifts", "Vibration on acceleration", "Fluid leak", "Clicking while turning"],
    includes: ["Transmission service", "CV axles", "Differentials", "Driveline diagnosis"],
    diagnosis:
      "Many 'transmission problems' turn out to be something else—a failing mount, a worn CV axle, low fluid from a leak, or an electronic control fault. Before anyone talks about a rebuild, we check fluid level and condition, scan the transmission control module, road-test to reproduce the symptom, and inspect the driveline. That order of operations regularly saves customers from repairs they did not need.",
    whyUs:
      "Transmission specialists have an incentive to find transmission problems. As a full-service family shop, our incentive is the correct answer—whether that is a fluid service, an axle, a mount, a software-related control issue, or an honest referral when a unit genuinely needs specialist rebuilding.",
    cost: "There is an enormous cost range between a fluid service, a CV axle, and transmission replacement, which is exactly why diagnosis comes first. Regular fluid service on the manufacturer's schedule is the cheapest item on this page and the one that best prevents the expensive ones.",
    faqs: [
      {
        question: "My car shifts hard sometimes. Does that mean the transmission is failing?",
        answer:
          "Not necessarily. Harsh or delayed shifts can come from low or degraded fluid, a control-module fault, or a failing sensor—all far cheaper than a transmission. A scan and fluid check is the right first step, not a rebuild quote.",
      },
      {
        question: "Is 'lifetime' transmission fluid really lifetime?",
        answer:
          "Manufacturers define 'lifetime' generously. Heat, towing, and stop-and-go driving degrade fluid, and periodic service is inexpensive insurance for a component that costs thousands to replace. We follow the severe-service schedule when your driving matches it.",
      },
      {
        question: "What is the clicking sound when I turn?",
        answer:
          "Rhythmic clicking during turns is the classic symptom of a worn CV joint. Caught early it is a straightforward axle replacement; ignored, the joint can fail and leave the vehicle immobile. It is worth an inspection promptly.",
      },
    ],
    related: ["advanced-diagnostics", "oil-maintenance", "suspension-steering"],
  },
  {
    slug: "battery-electrical",
    name: "Battery & Electrical",
    metaDescription:
      "Car battery replacement, alternator and starter repair, parasitic draw testing and electrical diagnosis in Egg Harbor Township from Ocean Heights Auto & Tire.",
    short: "Starting, charging, lighting, modules, and electrical repair.",
    intro:
      "Electrical faults require a measured approach. We test the battery, charging system, circuits, and modules to identify the real failure.",
    signs: ["Slow crank", "Battery light", "Flickering lights", "Repeated dead battery"],
    includes: ["Battery testing", "Alternator and starter", "Parasitic draw testing", "Wiring and circuit repair"],
    diagnosis:
      "A no-start or dead battery gets the full starting-and-charging test: battery condition under load, alternator output, starter draw, and connection voltage drops. A battery that keeps dying gets a parasitic-draw test to find which circuit is staying awake overnight. Electrical gremlins—flickering lights, intermittent accessories—are traced with wiring diagrams and circuit testing rather than replaced parts and hope.",
    whyUs:
      "Electrical diagnosis is where our dealer-level test equipment and factory wiring information earn their keep. Modern vehicles route everything through networked modules, and we diagnose those systems daily—including the 12-volt systems in hybrids and EVs, which fail just like any other car's and strand them just as thoroughly.",
    cost: "A battery replacement with testing and registration (many modern vehicles require the new battery to be coded to the car) is a modest, quick job. Alternators and starters vary with access and labor. Intermittent electrical tracing is billed by the diagnostic time it genuinely needs, which we discuss and cap with you in advance.",
    faqs: [
      {
        question: "Why does my new battery keep dying?",
        answer:
          "If a healthy battery goes flat overnight, something is drawing current after the car sleeps—a module that will not shut down, a stuck relay, an aftermarket accessory, or a glovebox light. A parasitic-draw test finds the circuit instead of replacing batteries repeatedly.",
      },
      {
        question: "How long should a car battery last near the Shore?",
        answer:
          "Typically three to five years. Heat degrades batteries internally, and coastal humidity accelerates terminal corrosion. If your battery is past three years old, testing it before winter is a five-minute job that prevents a no-start morning.",
      },
      {
        question: "The battery light came on but the car still runs. Can I keep driving?",
        answer:
          "Only briefly. The battery light usually means the alternator has stopped charging, so the car is running down the battery and will stall when it is spent—often within an hour of driving. Have it towed or driven straight in.",
      },
    ],
    related: ["advanced-diagnostics", "hybrid-ev-service", "oil-maintenance"],
  },
  {
    slug: "diesel-service",
    name: "Diesel Service",
    metaDescription:
      "Light-duty diesel maintenance, diagnostics and repair in Egg Harbor Township for diesel cars, pickups and work trucks from Ocean Heights Auto & Tire.",
    short: "Maintenance and engine service for diesel cars and light trucks.",
    intro:
      "Diesel systems demand the right testing and service practices. We handle common maintenance and drivability needs with care.",
    signs: ["Hard starting", "Loss of power", "Excessive smoke", "Diesel warning light"],
    includes: ["Filters and fluids", "Engine diagnostics", "Cooling and intake", "Light-duty diesel maintenance"],
    diagnosis:
      "Diesel diagnosis follows the fuel: filtration, fuel quality, injection system data, glow-plug operation for hard cold starts, and intake and emissions systems for power loss and smoke. Modern light-duty diesels also carry emissions equipment—EGR, DPF, and DEF systems—whose warning lights have specific causes we read and test rather than guess at.",
    whyUs:
      "Plenty of shops decline diesel work; we service diesel pickups, vans, and cars alongside everything else, with the fluid, filter, and testing practices diesels require. For local contractors, that means the work truck and the family car can go to the same trusted counter.",
    cost: "Diesel maintenance items—fuel filters, larger oil capacities, DEF—cost somewhat more than their gas equivalents, but skipping them costs far more: injection and emissions components are among the most expensive parts on the vehicle, and clean fuel and oil are what protect them.",
    faqs: [
      {
        question: "Why is my diesel hard to start on cold mornings?",
        answer:
          "The usual suspects are worn glow plugs, a weak battery (diesels demand a lot of cranking power), gelled or poor winter fuel, or low compression on a high-mileage engine. Testing narrows it down quickly, and glow plugs are a common, economical fix.",
      },
      {
        question: "What does the DEF or emissions warning on my diesel mean?",
        answer:
          "Modern diesels will reduce power or eventually refuse to start if DEF runs out or the emissions system faults, by design. Do not ignore the countdown—bring it in so we can read the system and fix the actual cause before the truck derates on a workday.",
      },
      {
        question: "How often does a diesel need fuel-filter service?",
        answer:
          "Follow the manufacturer's schedule—commonly every 15,000–30,000 miles for light-duty diesels. The fuel filter is the injection system's only protection, and injectors cost enormously more than filters.",
      },
    ],
    related: ["oil-maintenance", "engine-cooling", "advanced-diagnostics"],
  },
  {
    slug: "recall-work",
    name: "Vehicle Recall Checks",
    metaTitle: "Free Vehicle Recall Check in Egg Harbor Township, NJ",
    metaDescription:
      "Check for open vehicle safety recalls with the official NHTSA lookup, plus clear next-step guidance in Egg Harbor Township from Ocean Heights Auto & Tire.",
    short: "Check your vehicle for open safety recalls and get straight answers on next steps.",
    intro:
      "Use the official NHTSA tool to check your vehicle for open safety recalls—it is free and takes about a minute with your VIN or license plate. Recall repairs are generally completed free of charge by an authorized manufacturer dealership. Ocean Heights can help you understand the result and take care of any unrelated maintenance, diagnostic, tire, brake, or drivability concerns.",
    signs: [
      "A recall notice arrived in the mail",
      "You are not sure whether a recall applies to your vehicle",
      "You are buying a used vehicle with unknown history",
      "A warning light or symptom you suspect is recall-related",
    ],
    includes: [
      "Help running the official NHTSA recall lookup",
      "Plain-language explanation of what a recall notice covers",
      "Straight answers on what the dealer handles free of charge",
      "Diagnosis and repair of related, non-recall concerns",
    ],
    diagnosis:
      "Your VIN—found on the driver's-side dashboard corner or door jamb—is all the official lookup needs. We will help you run it, explain the difference between a safety recall and a technical service bulletin, and if a recall carries a 'do not drive' or 'park outside' warning, we will tell you to take it seriously. Open safety-recall repairs are performed free at the manufacturer's franchised dealership, and we will say so plainly rather than sell you work the dealer owes you.",
    whyUs:
      "We benefit when you trust us, not when you are confused. Many drivers come in with a recall notice and leave understanding exactly what the dealer will fix free, and what unrelated symptom—brakes, tires, a warning light—we can diagnose and repair here while the recall gets scheduled.",
    cost: "Checking for recalls costs nothing: the NHTSA lookup is free, and so is our help reading the result. Open safety-recall repairs are generally free at an authorized dealership. Anything we quote is for separate maintenance or repair work you ask us to look at.",
    faqs: [
      {
        question: "Do I have to pay for a recall repair?",
        answer:
          "Generally no. Safety-recall repairs are performed free of charge by the manufacturer's authorized dealerships, typically for vehicles up to 15 years old from the date of sale. If anyone charges you to fix an open safety recall, ask questions.",
      },
      {
        question: "Can Ocean Heights do my recall repair so I can skip the dealership?",
        answer:
          "Recall repairs are handled and reimbursed through the manufacturer's franchised dealers, so the dealership is usually the right place for the recall itself—and it costs you nothing there. What we can do is verify what the recall covers, handle any unrelated repairs, and make sure a symptom you noticed is not being wrongly attributed to the recall.",
      },
      {
        question: "I got a card in the mail that looks like a recall notice. Is it real?",
        answer:
          "Check before acting on it. Genuine recall notices come from the manufacturer or NHTSA and never ask you to pay. Marketing mailers dressed up as recall or warranty notices are common—running your VIN through the official NHTSA lookup tells you the truth in under a minute.",
      },
    ],
    related: ["advanced-diagnostics", "oil-maintenance", "brake-repair"],
    resources: [
      {
        label: "NHTSA official recall lookup",
        href: "https://www.nhtsa.gov/recalls",
        note: "Search by VIN, license plate, or year, make, and model — free, from the U.S. Department of Transportation.",
      },
    ],
  },
  {
    slug: "exhaust-emissions",
    name: "Exhaust & Emissions",
    metaDescription:
      "Muffler and exhaust repair, oxygen sensors, catalytic converter diagnosis and emissions diagnostics in Egg Harbor Township from Ocean Heights Auto & Tire.",
    short: "Quiet operation, clean performance, and exhaust-system repair.",
    intro:
      "We inspect exhaust leaks, mounts, sensors, catalytic performance, and related engine controls to make a complete recommendation.",
    signs: ["Loud exhaust", "Rattling underneath", "Exhaust odor", "Emissions-related warning light"],
    includes: ["Exhaust inspection", "Mufflers and pipes", "Oxygen sensors", "Emissions diagnostics"],
    diagnosis:
      "An exhaust complaint gets a lift inspection from the manifold back—leaks, rusted hangers and mounts, damaged pipes, and rattling heat shields—while an emissions warning light gets diagnostic testing of the sensors and engine controls upstream. That distinction matters: a catalytic-converter code is often caused by an oxygen sensor, an exhaust leak, or an engine misfire, and replacing the converter without fixing the cause just kills the new one.",
    whyUs:
      "Shore-area humidity and salt are brutal on exhaust systems, and we repair them daily. Because we diagnose engine controls as well as pipes and mufflers, you get one shop that can tell whether the problem is the exhaust itself or the engine behind it—before the expensive parts get ordered.",
    cost: "Exhaust repairs range from inexpensive hangers, clamps, and pipe sections to mufflers and, at the top end, catalytic converters. Converter cost is driven by the precious metals inside, which is exactly why we confirm the converter has actually failed—and why it failed—before recommending one.",
    faqs: [
      {
        question: "My car suddenly got loud. Is it safe to drive?",
        answer:
          "Briefly and locally, usually—but exhaust leaks ahead of the cabin can let fumes in, and a dragging pipe is a hazard. Have it inspected promptly; a leak caught at a joint or hanger is often a simple repair.",
      },
      {
        question: "Do I really need a new catalytic converter, or just a sensor?",
        answer:
          "A converter-efficiency code deserves testing, not automatic replacement. Failing oxygen sensors, exhaust leaks near the sensors, and engine misfires can all set the same code. We test converter performance directly and check the causes upstream before quoting anything.",
      },
      {
        question: "Will an exhaust or emissions fault fail my New Jersey inspection?",
        answer:
          "An illuminated check-engine light fails the NJ emissions inspection on most passenger vehicles, so emissions faults should be diagnosed and repaired—and the vehicle driven enough to reset its readiness monitors—before you go for inspection.",
      },
    ],
    related: ["advanced-diagnostics", "engine-cooling", "oil-maintenance"],
  },
];

export const serviceBySlug = (slug: string) =>
  services.find((service) => service.slug === slug);
