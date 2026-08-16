/**
 * SurgEdge Platform - Clinical & Educational Dataset
 * Originated via Babson College Global Surgery Slingshot & Amodisc Ltd
 */

const SURGEDGE_DATA = {
    // Platform Metadata & Affiliations
    meta: {
        platformName: "SurgEdge",
        tagline: "Surgical Guidance Without Borders",
        version: "2.5.0-prod",
        initiative: "Global Surgery Slingshot Programme",
        institution: "The Kerry Murphy Healey Centre for Health Innovation and Entrepreneurship, Babson College",
        founder: "Hamdi Abdalkareem Abdalla",
        technicalPartner: "Amodisc Ltd",
        benchmarks: ["Proximie", "SurgHub / UNITAR", "ORamaVR", "XRHealth", "E-Surgery", "NRTC"],
        complianceStatus: {
            encryption: "AES-256-GCM / DTLS-SRTP [Active]",
            hipaaAwareness: "De-identification Pipeline Built-in [Audit In Progress]",
            gdprCompliance: "Consent & Anonymization Engine [Compliant]",
            medicalDisclaimer: "Advisory clinical decision support only; operating surgeon retains full operative autonomy."
        }
    },

    // Global Surgery Disparity & Impact Statistics (Lancet Commission on Global Surgery)
    statistics: {
        unmetSurgicalNeed: "5 Billion",
        unmetSurgicalNeedSubtitle: "People lack access to safe, affordable, and timely surgical and anesthesia care worldwide.",
        specialistDeficit: "93%",
        specialistDeficitSubtitle: "Of the population in sub-Saharan Africa and conflict zones cannot reach a specialist surgeon in under 2 hours.",
        avoidableDeaths: "17 Million",
        avoidableDeathsSubtitle: "Lives lost annually from surgically treatable conditions — more than HIV, TB, and Malaria combined.",
        economicROI: "10x",
        economicROISubtitle: "Economic return for every $1 invested in scaling surgical and tele-mentoring infrastructure."
    },

    // Pre-loaded Surgical Training Videos
    trainingVideos: [
        {
            id: "vid-ortho-knee-ar",
            title: "AR-Guided Knee Joint Realignment & Osteotomy",
            specialty: "Orthopedic Surgery",
            duration: "18:45",
            author: "Dr. Marcus Vance, MD & Dr. Elena Rostova",
            thumbnail: "assets/images/orthopedic_training_ar.jpg",
            description: "Augmented reality trajectory verification for coronal plane mechanical axis correction and distal femoral resection margins.",
            chapters: [
                { time: "00:00", title: "Mechanical Axis Coronal Alignment" },
                { time: "05:30", title: "Distal Femur Resection Plane Marking" },
                { time: "11:15", title: "Varus/Valgus Angle Calibration" },
                { time: "16:20", title: "Trial Component Stability Verification" }
            ]
        },
        {
            id: "vid-ortho-extfix",
            title: "Orthopedic External Fixation for Open Tibial Fractures",
            specialty: "Orthopedic & Trauma Surgery",
            duration: "14:20",
            author: "Dr. Marcus Vance, MD, FACS",
            thumbnail: "assets/images/orthopedic_surgery_hero.jpg",
            description: "Step-by-step modular guide on pin placement in safe bone corridors, reduction clamps, and bar-to-pin articulation under C-Arm fluoroscopy.",
            chapters: [
                { time: "00:00", title: "Safe Corridor Landmark Mapping (Anteromedial Tibia)" },
                { time: "03:45", title: "Schanz Screw Pre-Drilling & Bicortical Purchase" },
                { time: "08:15", title: "Manual Fracture Reduction & Longitudinal Traction" },
                { time: "12:00", title: "Connecting Carbon Fiber Rods & Final Stability Check" }
            ]
        },
        {
            id: "vid-zplasty",
            title: "Z-Plasty Geometric Flap Transposition in Burn Contracture",
            specialty: "Plastic & Reconstructive",
            duration: "12:10",
            author: "Dr. Elena Rostova / Amodisc Ltd",
            thumbnail: "assets/images/orthopedic_surgery_hero.jpg",
            description: "UNITAR / SurgHub standard procedural video demonstrating 60-degree incision angles and Gillies apex suturing.",
            chapters: [
                { time: "00:00", title: "60-Degree Angle Marking" },
                { time: "04:10", title: "Full Thickness Incision & Hemostasis" },
                { time: "07:30", title: "Flap Elevation & Undermining" },
                { time: "10:00", title: "Transposition & Insetting" }
            ]
        },
        {
            id: "vid-trauma-lap",
            title: "Damage Control Four-Quadrant Abdominal Packing",
            specialty: "Trauma & General Surgery",
            duration: "16:30",
            author: "Dr. Marcus Vance, MD, FACS",
            thumbnail: "assets/images/orthopedic_training_ar.jpg",
            description: "Austere field protocol for rapid hemostasis and visceral contamination control in blast trauma.",
            chapters: [
                { time: "00:00", title: "Rapid Midline Laparotomy" },
                { time: "04:20", title: "Perihepatic & Perisplenic Packing" },
                { time: "09:40", title: "Pringle Maneuver Clamping" },
                { time: "14:10", title: "Vacuum Pack Temporary Closure" }
            ]
        }
    ],

    // SurgHub / UNITAR-Style Course Catalog
    courses: [
        {
            id: "course-ortho-extfix",
            title: "Open Tibial Fracture Reduction & External Fixation in Austere Settings",
            subtitle: "Essential orthopedic surgical mastery for high-energy trauma and blast fractures.",
            specialty: "Orthopedic Surgery",
            resourceLevel: "Resource-Limited (District Hospital / Level 1)",
            duration: "55 mins",
            accreditation: "4.0 CME Credits",
            difficulty: "Intermediate to Advanced",
            icon: "bone",
            featured: true,
            thumbnail: "assets/images/orthopedic_surgery_hero.jpg",
            overview: "A comprehensive procedural curriculum on safe anatomical bone corridors for Schanz pin insertion, bi-cortical screw purchase, manual fracture alignment, and modular uniplannar frame assembly without requiring sophisticated fluoroscopy.",
            indications: [
                "Gustilo-Anderson Type II & III open tibial shaft fractures",
                "High-energy blast trauma with extensive soft-tissue loss and bone comminution",
                "Provisional skeletal stabilization in polytrauma prior to definitive intramedullary nailing"
            ],
            steps: [
                {
                    stepNumber: 1,
                    title: "Safe Bone Corridor Mapping & Stab Incisions",
                    duration: "10 mins",
                    description: "Palpate the subcutaneous anteromedial border of the tibia. Make longitudinal 1.5 cm skin incisions 2-3 cm away from the fracture zone directly down to the periosteum.",
                    criticalWarning: "Avoid pin insertion on the lateral subcutaneous surface to protect the anterior compartment neurovascular bundle and deep peroneal nerve.",
                    safetyChecklist: [
                        "Verify safe anteromedial subcutaneous tibial border",
                        "Ensure pins are placed at least 2 cm outside the zone of injury",
                        "Bluntly spread subcutaneous tissues to bone using a Kelly clamp"
                    ],
                    anatomicalFocus: "Anteromedial tibial face and deep peroneal nerve protection"
                },
                {
                    stepNumber: 2,
                    title: "Drill Sleeve Placement & Bi-cortical Schanz Pin Insertion",
                    duration: "15 mins",
                    description: "Insert a drill sleeve to protect soft tissue. Pre-drill with a sharp 3.5 mm drill bit perpendicular to the long axis of the tibia. Hand-drive 5.0 mm self-tapping Schanz pins through both cortices.",
                    criticalWarning: "Never power-drive Schanz pins without continuous saline cooling; thermal necrosis leads to early pin loosening and osteomyelitis.",
                    safetyChecklist: [
                        "Irrigate with cold saline during pre-drilling to prevent thermal osteonecrosis",
                        "Confirm solid two-cortex bite (near cortex and far cortex purchase)",
                        "Place two pins proximally and two pins distally to the fracture site"
                    ],
                    anatomicalFocus: "Near and far tibial cortices"
                },
                {
                    stepNumber: 3,
                    title: "Fracture Reduction & Realignment",
                    duration: "15 mins",
                    description: "Apply manual longitudinal traction to restore limb length. Correct angular (varus/valgus, recurvatum/procurvatum) and rotational deformities by matching anatomical tibial crest alignment.",
                    criticalWarning: "Assess distal pulses (dorsalis pedis and posterior tibial) immediately before and after reduction maneuvers.",
                    safetyChecklist: [
                        "Check distal dorsalis pedis and posterior tibial arterial pulses",
                        "Verify rotational symmetry compared to contralateral uninjured limb",
                        "Maintain reduction with provisional pin-to-bar clamps"
                    ],
                    anatomicalFocus: "Tibial mechanical axis and distal pedal pulses"
                },
                {
                    stepNumber: 4,
                    title: "Modular Frame Assembly & Rigidity Verification",
                    duration: "15 mins",
                    description: "Connect the Schanz pins using pin-to-bar clamps and 11 mm carbon fiber or stainless steel connecting rods. Construct a rigid delta or double-stacked frame configuration to resist bending and torsional stresses.",
                    criticalWarning: "Leave at least 2 cm of clearance between the connecting rod and skin to allow for postoperative wound swelling and dressing changes.",
                    safetyChecklist: [
                        "Ensure 2 cm rod-to-skin clearance for swelling management",
                        "Tighten all clamp bolts systematically with torque wrench/spanner",
                        "Perform gentle wound debridement and apply sterile petrolatum pin site dressings"
                    ],
                    anatomicalFocus: "External fixator frame geometry and pin-skin interface"
                }
            ],
            quiz: [
                {
                    question: "Which anatomical surface of the tibia represents the safe corridor for external fixator Schanz pin insertion?",
                    options: [
                        "Posterior compartment surface",
                        "Anteromedial subcutaneous surface",
                        "Anterolateral muscular surface",
                        "Deep lateral surface behind the fibula"
                    ],
                    correctIndex: 1,
                    explanation: "The anteromedial subcutaneous surface of the tibia is free from major overlying muscles, nerves, and arteries, making it the safest corridor for pin placement."
                },
                {
                    question: "What is the primary method to prevent thermal bone necrosis and subsequent pin loosening during Schanz pin drilling?",
                    options: [
                        "Drilling at maximum RPM with dull drill bits",
                        "Continuous saline irrigation/cooling and low-speed pre-drilling",
                        "Omitting the pre-drilling step entirely",
                        "Inserting pins through muscular bellies"
                    ],
                    correctIndex: 1,
                    explanation: "Continuous saline cooling and sharp pre-drilling prevent thermal necrosis of cortical bone, ensuring rigid, long-term pin purchase."
                }
            ]
        },
        {
            id: "course-z-plasty",
            title: "Z-Plasty & Local Tissue Rearrangement in Burn Contractures",
            subtitle: "Standardized procedural guide inspired by SurgHub (UNITAR) & Amodisc Ltd curriculum.",
            specialty: "Plastic & Reconstructive",
            resourceLevel: "Resource-Limited (District Hospital / Level 1)",
            duration: "45 mins",
            accreditation: "3.0 CME Credits",
            difficulty: "Intermediate",
            icon: "scissors",
            featured: true,
            thumbnail: "assets/images/orthopedic_training_ar.jpg",
            overview: "A comprehensive guide on transposing triangular flaps to release joint-limiting burn scar contractures, restore functional range of motion, and reorient tension lines along Langer's planes using basic surgical instruments.",
            indications: [
                "Post-burn scar contractures causing joint flexion limitation",
                "Reorientation of hypertrophic surgical scars along relaxed skin tension lines (RSTL)",
                "Widening of constricted circular stomas or tubular structures"
            ],
            steps: [
                {
                    stepNumber: 1,
                    title: "Landmark Identification & Geometric Marking",
                    duration: "8 mins",
                    description: "Identify the central limb along the line of greatest scar contracture. Mark two equal lateral limbs at standard 60-degree angles (theoretically providing a 75% gain in longitudinal length and 90-degree axis rotation).",
                    criticalWarning: "Ensure lateral limb lengths exactly equal the central limb length (L1 = L2 = L3) to avoid asymmetrical flap dog-ears.",
                    safetyChecklist: [
                        "Palpate underlying subcutaneous tissue to confirm viable vascular bed",
                        "Verify 60-degree angle markers with sterile caliper or surgical pen",
                        "Confirm tension-free skin redundancy adjacent to lateral limbs"
                    ],
                    anatomicalFocus: "Subdermal vascular plexus and Langer's tension vectors"
                },
                {
                    stepNumber: 2,
                    title: "Infiltration & Precise Incision",
                    duration: "10 mins",
                    description: "Administer local infiltration with 1% lidocaine with 1:200,000 epinephrine for hydrodissection and hemostasis. Incise cleanly perpendicular to the epidermis through full-thickness dermis down to superficial subcutaneous fat.",
                    criticalWarning: "Avoid beveling the blade; maintain a strict 90-degree angle to the skin surface to preserve dermal edge vascularity.",
                    safetyChecklist: [
                        "Allow 7-10 minutes for epinephrine vasoconstriction before incision",
                        "Incise the central limb first, then both lateral limbs",
                        "Maintain meticulous bipolar hemostasis to prevent flap hematoma"
                    ],
                    anatomicalFocus: "Dermal-subcutaneous junction"
                },
                {
                    stepNumber: 3,
                    title: "Flap Elevation & Subdermal Undermining",
                    duration: "15 mins",
                    description: "Elevate both triangular flaps (Flap A and Flap B) at the level of the deep subcutaneous fat. Include adequate subcutaneous tissue at the flap base to protect the subdermal perforator supply.",
                    criticalWarning: "Do NOT grasp the delicate flap tips with crushing forceps; use fine skin hooks or atraumatic micro-forceps.",
                    safetyChecklist: [
                        "Undermine surrounding wound edges by 5-10 mm to facilitate transposition",
                        "Assess flap capillary refill time (must be < 2 seconds)",
                        "Release any deep fibrous tethering bands restricting transposition"
                    ],
                    anatomicalFocus: "Perforator vascular leash at flap base"
                },
                {
                    stepNumber: 4,
                    title: "Flap Transposition & Insetting",
                    duration: "12 mins",
                    description: "Transpose Flap A into the contralateral defect and Flap B into the ipsilateral defect. Place a key anchoring suture at each flap apex using 4-0 or 5-0 monofilament (e.g., Nylon/Prolene) using the half-buried horizontal mattress (Gillies) technique.",
                    criticalWarning: "Never tie apex sutures under excessive tension; if blanching persists over 10 seconds, loosen the suture.",
                    safetyChecklist: [
                        "Place Gillies corner suture through flap apex with minimal tension",
                        "Interrupted simple sutures for lateral edges with 3-4 mm spacing",
                        "Apply non-adherent petrolatum gauze dressing with gentle bolster"
                    ],
                    anatomicalFocus: "Neovascular alignment and scar axis reorientation"
                }
            ],
            quiz: [
                {
                    question: "In a standard classical Z-plasty with 60-degree limb angles, what is the theoretical gain in length along the original contracture axis?",
                    options: ["25%", "50%", "75%", "100%"],
                    correctIndex: 2,
                    explanation: "A 60° Z-plasty yields a theoretical 75% increase in longitudinal length along the central limb and changes the scar orientation by 90°."
                },
                {
                    question: "Which suturing technique is recommended to secure the fragile tip of a triangular skin flap without causing necrosis?",
                    options: ["Vertical mattress suture", "Half-buried horizontal mattress (Gillies suture)", "Continuous locking suture", "Simple running cutaneous suture"],
                    correctIndex: 1,
                    explanation: "The half-buried horizontal mattress (Gillies) suture anchors the tip through the deep dermis without strangulating the epidermal capillary blood supply."
                }
            ]
        },
        {
            id: "course-trauma-laparotomy",
            title: "Damage Control Laparotomy in Blast & Penetrating Trauma",
            subtitle: "Life-saving protocols for severe abdominal hemorrhage in austere conflict zones.",
            specialty: "Trauma & General Surgery",
            resourceLevel: "Austere / Conflict Field Hospital",
            duration: "60 mins",
            accreditation: "4.0 CME Credits",
            difficulty: "Advanced",
            icon: "activity",
            featured: true,
            thumbnail: "assets/images/orthopedic_surgery_hero.jpg",
            overview: "Rapid four-quadrant packing, vascular isolation, provisional bowel control, and temporary abdominal closure (TAC) to break the lethal triad (hypothermia, coagulopathy, acidosis) under resource constraints.",
            indications: [
                "Hemodynamically unstable penetrating abdominal trauma",
                "Blast injury with multiple intra-abdominal organ disruptions",
                "Refractory metabolic acidosis (pH < 7.20) and hypothermia (< 35°C) during emergency laparotomy"
            ],
            steps: [
                {
                    stepNumber: 1,
                    title: "Rapid Midline Xiphoid-to-Pubis Laparotomy & Evisceration",
                    duration: "5 mins",
                    description: "Execute a rapid full midline incision. Evacuate hemoperitoneum manually and immediately place laparotomy pads into all four quadrants.",
                    criticalWarning: "Do not stop to inspect individual bleeding vessels before completing systematic four-quadrant packing.",
                    safetyChecklist: [
                        "Pack right upper quadrant (perihepatic)",
                        "Pack left upper quadrant (perisplenic)",
                        "Pack pelvis and paracolic gutters bilaterally"
                    ],
                    anatomicalFocus: "Four abdominal quadrants and retroperitoneal zones"
                },
                {
                    stepNumber: 2,
                    title: "Systematic Unpacking & Hemostasis Control",
                    duration: "20 mins",
                    description: "Unpack one quadrant at a time. Identify major vascular disruptions; utilize Pringle maneuver (hepatic inflow occlusion) or vascular shunts for critical vessels.",
                    criticalWarning: "Limit Pringle clamp time to 20-30 minutes maximum to avoid ischemic reperfusion liver failure.",
                    safetyChecklist: [
                        "Perform Pringle clamp if liver parenchymal bleeding persists",
                        "Direct pressure or balloon tamponade for deep missile tracts",
                        "Rapid ligation of non-critical mesenteric vessels"
                    ],
                    anatomicalFocus: "Hepatoduodenal ligament, mesenteric vessels, retroperitoneal Zone 1-3"
                },
                {
                    stepNumber: 3,
                    title: "Contamination Control (Staple/Tie & Run)",
                    duration: "15 mins",
                    description: "Rapidly isolate hollow viscus perforations. Resect destroyed bowel loops with linear cutting staplers or non-crushing ties without performing definitive anastomoses in the initial damage control phase.",
                    criticalWarning: "Do NOT perform complex bowel anastomoses or stomas during initial damage control phase in a coagulopathic patient.",
                    safetyChecklist: [
                        "Occlude gastrointestinal leaks with umbilical tape, ties, or rapid stapling",
                        "Copious warm saline lavage if available",
                        "Debride non-viable devascularized bowel margins"
                    ],
                    anatomicalFocus: "Small bowel mesentery and colon"
                },
                {
                    stepNumber: 4,
                    title: "Temporary Abdominal Closure (Bogota Bag / Vacuum Pack)",
                    duration: "15 mins",
                    description: "Place a fenestrated non-adherent plastic barrier over the bowel, cover with surgical towels/sponges, apply closed suction drains, and seal with adhesive drape to prevent abdominal compartment syndrome.",
                    criticalWarning: "Never close the fascial layer primarily in a damage control setting; intra-abdominal hypertension will cause multi-organ failure.",
                    safetyChecklist: [
                        "Apply sterile 3-liter saline bag or specialized vacuum pack (Barker technique)",
                        "Ensure suction is active and non-adherent layer protects bowel surface",
                        "Transfer to ICU/recovery for resuscitation and re-warming"
                    ],
                    anatomicalFocus: "Abdominal wall fascia and visceral peritoneum"
                }
            ],
            quiz: [
                {
                    question: "What is the primary goal of the initial operative phase in Damage Control Surgery?",
                    options: [
                        "Definitive anatomical organ reconstruction",
                        "Rapid control of hemorrhage and contamination to halt the lethal triad",
                        "Performing primary layered fascial closure",
                        "Creating permanent feeding jejunostomies"
                    ],
                    correctIndex: 1,
                    explanation: "Damage control surgery prioritizes rapid hemostasis and contamination control to abort the lethal triad (hypothermia, coagulopathy, acidosis), deferring definitive reconstruction to the secondary phase."
                }
            ]
        },
        {
            id: "course-pediatric-herniotomy",
            title: "Emergency Pediatric Inguinal Herniotomy in Remote Clinics",
            subtitle: "High-yield surgical technique for incarcerated infant inguinal hernia.",
            specialty: "Pediatric Surgery",
            resourceLevel: "Rural District Hospital",
            duration: "35 mins",
            accreditation: "2.5 CME Credits",
            difficulty: "Intermediate",
            icon: "shield",
            featured: false,
            thumbnail: "assets/images/orthopedic_training_ar.jpg",
            overview: "Essential steps for identifying the patent processus vaginalis, high sac ligation, and preserving the vas deferens and gonadal vessels in neonates and young children.",
            indications: [
                "Irreducible / Incarcerated pediatric inguinal hernia",
                "Symptomatic congenital inguinal hernia in remote facilities without pediatric subspecialists"
            ],
            steps: [
                {
                    stepNumber: 1,
                    title: "Inguinal Skin Crease Incision",
                    duration: "5 mins",
                    description: "Transverse incision in the lowest inguinal skin crease over the external inguinal ring.",
                    criticalWarning: "Maintain superficial dissection; infant tissues are exceptionally delicate.",
                    safetyChecklist: [
                        "Identify superficial epigastric vessels and coagulate",
                        "Expose Scarpa's fascia and external oblique aponeurosis"
                    ],
                    anatomicalFocus: "Inguinal canal and external ring"
                },
                {
                    stepNumber: 2,
                    title: "Sac Identification & Isolation from Cord Structures",
                    duration: "15 mins",
                    description: "Carefully tease the white peritoneal hernia sac from the anteromedial cord away from the vas deferens and spermatic vessels.",
                    criticalWarning: "Never apply toothed forceps to the vas deferens; preserve delicate vascular leash.",
                    safetyChecklist: [
                        "Visualize the pearl-white vas deferens distinctly",
                        "Separate sac cleanly up to the internal deep ring"
                    ],
                    anatomicalFocus: "Vas deferens and testicular vessels"
                },
                {
                    stepNumber: 3,
                    title: "High Sac Ligation at Preperitoneal Fat",
                    duration: "10 mins",
                    description: "Twist the isolated sac to ensure no contents are trapped, then perform transfixion suture-ligation at the neck with 3-0 or 4-0 absorbable suture.",
                    criticalWarning: "Always open and inspect sac before high ligation if sliding hernia or incarceration is suspected.",
                    safetyChecklist: [
                        "Confirm preperitoneal golden fat pad is reached (true high ligation)",
                        "Check testicle position in scrotum before closure"
                    ],
                    anatomicalFocus: "Internal inguinal ring and preperitoneal space"
                }
            ],
            quiz: [
                {
                    question: "At what anatomical landmark is a true high ligation of a pediatric hernia sac performed?",
                    options: ["At the external ring", "At the level of preperitoneal fat at the internal deep ring", "Midpoint of the inguinal canal", "At the pubic tubercle"],
                    correctIndex: 1,
                    explanation: "True high ligation must be done at the internal deep ring where the sac meets the preperitoneal fat, preventing recurrence."
                }
            ]
        }
    ],

    // Global Mentors & Faculty (Accredited Roster)
    mentors: [
        {
            id: "mentor-1",
            name: "Dr. Marcus Vance, MD, FACS",
            specialty: "Orthopedic Trauma & Global Surgery",
            affiliation: "Babson Global Surgery Slingshot Advisor / Senior Surgical Mentor",
            experience: "22+ Years",
            timezone: "UTC+1",
            status: "Online & Available",
            casesMentored: 184,
            languages: ["English", "Arabic"],
            avatar: "mentor-dr-marcus.jpg"
        },
        {
            id: "mentor-2",
            name: "Dr. Elena Rostova, MD, FRCS",
            specialty: "Plastic, Reconstructive & Burn Surgery",
            affiliation: "International Humanitarian Surgical Coalition",
            experience: "16+ Years",
            timezone: "UTC+0",
            status: "In Session (Ending in 12m)",
            casesMentored: 142,
            languages: ["English", "French", "Russian"],
            avatar: "mentor-dr-elena.jpg"
        },
        {
            id: "mentor-3",
            name: "Dr. Kwame Osei, MD, FWACS",
            specialty: "Pediatric & General Surgery",
            affiliation: "West African College of Surgeons / Rural Tele-Health",
            experience: "14+ Years",
            timezone: "UTC+0",
            status: "Online & Available",
            casesMentored: 98,
            languages: ["English", "Twi"],
            avatar: "mentor-dr-kwame.jpg"
        },
        {
            id: "mentor-4",
            name: "Dr. Sofia Morales, MD, FACS",
            specialty: "Obstetrics, Gynecology & Maternal Trauma",
            affiliation: "Pan-American Surgical Alliance",
            experience: "19+ Years",
            timezone: "UTC-5",
            status: "On Call",
            casesMentored: 215,
            languages: ["Spanish", "English", "Portuguese"],
            avatar: "mentor-dr-sofia.jpg"
        }
    ],

    // Field Pilot Sites & Simulated Case Studies
    caseStudies: [
        {
            id: "case-01",
            title: "Successful Tibial External Fixation in Rural District Hospital",
            fieldSurgeon: "Dr. Paul M., Gulu Regional Hospital, Uganda",
            mentor: "Dr. Marcus Vance (Remote Mentor)",
            network: "Starlink Field Dish (210ms latency, 110kbps cap)",
            outcome: "Rigid uniplannar frame established, distal pulses verified, limb length restored with zero nerve injury.",
            quote: "Real-time AR confirmation of the anteromedial safe corridor gave our surgical team total confidence during bi-cortical pin insertion."
        },
        {
            id: "case-02",
            title: "Z-Plasty Scar Revision in Remote South Sudan",
            fieldSurgeon: "Dr. John A., MSF Field Hospital, Malakal",
            mentor: "Dr. Elena Rostova (Remote Mentor, Geneva)",
            network: "Starlink Field Dish (240ms latency, 120kbps cap)",
            outcome: "Full 80% range-of-motion recovery in elbow flexion contracture with zero postoperative flap necrosis.",
            quote: "Without real-time AR telestration from the remote mentor, I would not have had the geometric confidence to transpose the flaps."
        },
        {
            id: "case-03",
            title: "Damage Control Laparotomy in Blast Trauma, Northern Syria",
            fieldSurgeon: "Dr. Tariq M., Underground Trauma Post",
            mentor: "Dr. Marcus Vance (Remote Mentor)",
            network: "Ultra-Low-Bandwidth 2G Mesh (38kbps, audio + vector pen)",
            outcome: "Patient stabilized, lethal triad aborted, successfully evacuated to definitive care facility 18 hours later.",
            quote: "The audio-priority channel and ultra-light vector telestration functioned seamlessly even when our satellite feed was severely throttled."
        }
    ],

    // Comparison Matrix: SurgEdge vs Legacy Platforms
    comparisonMatrix: [
        {
            feature: "Low-Bandwidth Optimization (<50kbps field mode)",
            surgEdge: "Built-in Adaptive SVAC Codec + Vector AR (<2kbps/layer)",
            proximie: "Requires High-Speed Hospital Broadband (10+ Mbps)",
            oramaVR: "Requires VR Headset & High Computational Rig",
            standardTelehealth: "Standard Zoom/Teams (Fails under packet loss)"
        },
        {
            feature: "Interactive Surgical Video Upload & Chapter Studio",
            surgEdge: "Drag & Drop Operative Video with Live AR Overlay & Debrief",
            proximie: "Proprietary Cloud Video Recording Only",
            oramaVR: "Pre-rendered 3D Assets (No Custom Video Upload)",
            standardTelehealth: "Screen Sharing Only (No Telestration Sync)"
        },
        {
            feature: "Device Hardware Requirement",
            surgEdge: "Any Smartphone / Rugged Tablet / USB Endoscope",
            proximie: "Proprietary Porthole Carts / Specialized Hardware",
            oramaVR: "Oculus Quest / Meta / SteamVR Headsets",
            standardTelehealth: "Generic Laptop / Webcam"
        },
        {
            feature: "Integrated SurgHub/UNITAR-Style Curriculum",
            surgEdge: "Native Procedural Step Checklists & Quizzes (Orthopedics & Plastic)",
            proximie: "Post-hoc Recording Library Only",
            oramaVR: "XR Simulation Only (No Live Field Tele-Mentoring)",
            standardTelehealth: "None (Video Conferencing Only)"
        },
        {
            feature: "Offline-First Emergency Intake & Triage",
            surgEdge: "Full Local Queueing with Auto-Sync on Signal Recovery",
            proximie: "Web Online Dependent",
            oramaVR: "Preloaded App",
            standardTelehealth: "Immediate Drop-off"
        },
        {
            feature: "Humanitarian / Low-Resource Mission Focus",
            surgEdge: "Designed explicitly for Rural, Remote & Conflict Zones",
            proximie: "Commercial Hospital ORs & MedTech Device OEMs",
            oramaVR: "Academic Medical Simulation Centers",
            standardTelehealth: "General Consumer Tele-Health"
        }
    ],

    // Partnership Tiers for Donors, Ministries of Health & NGOs
    partnershipTiers: [
        {
            tierName: "Field Clinic Starter",
            target: "Individual District Hospital or Rural Clinic",
            fieldKits: "1 SurgEdge Rugged Field Kit + Tablet Mount",
            teleMentoringHours: "100 Live On-Call Hours / Year",
            curriculumAccess: "Full Access to All 12 SurgHub Procedural Courses",
            support: "24/7 Field Tech Support & Low-Bandwidth Satellite Protocol",
            idealFor: "NGOs & Humanitarian Mission Teams"
        },
        {
            tierName: "Regional Health Network",
            target: "5-10 Cluster Hospitals across a District or Province",
            fieldKits: "10 SurgEdge Multi-Feed Hardware Bundles",
            teleMentoringHours: "1,000 Live On-Call Hours / Year + Dedicated Mentor Roster",
            curriculumAccess: "Custom Procedural Course Development with Amodisc Ltd",
            support: "Dedicated Clinical Coordinator & Outcome Analytics Engine",
            idealFor: "Ministries of Health & Global Surgery Foundations"
        },
        {
            tierName: "Global Surgery Slingshot Partner",
            target: "National or International Consortium",
            fieldKits: "50+ Enterprise Units with Robotic / XR Roadmap Integration",
            teleMentoringHours: "Unlimited Tele-Mentoring + AI Predictive Case Logging",
            curriculumAccess: "Institutional Co-Branding with Babson College KMH Center",
            support: "Full Sovereign Cloud Deployment & Local Server Relay Nodes",
            idealFor: "Multilateral Donors, WHO Regional Desks & Major Philanthropies"
        }
    ]
};

// Export to global window context
if (typeof window !== "undefined") {
    window.SURGEDGE_DATA = SURGEDGE_DATA;
}
