/**
 * SurgEdge Interactive 3D Operating Room (OR) Surgical Simulation
 * Ultra-Realistic WebGL Knee Joint Realignment & AR Osteotomy Suite
 */

class Surgical3DViewer {
    constructor() {
        this.container = document.getElementById('surgical3DContainer');
        this.canvas = document.getElementById('surgical3DCanvas');
        if (!this.container || !this.canvas) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animFrameId = null;

        // OR Environment & Surgical Assembly
        this.orEnvironmentGroup = null;
        this.surgicalTableGroup = null;
        this.overheadLampGroup = null;
        this.kneeAssembly = null;
        this.femurGroup = null;
        this.tibiaGroup = null;
        this.patellaMesh = null;
        this.surgicalJigGroup = null;
        this.arHoloGroup = null;

        // Interactive Materials
        this.boneMat = null;
        this.cartilageMat = null;
        this.titaniumMat = null;
        this.drapeMat = null;
        this.steelMat = null;
        this.holoCyanMat = null;
        this.holoAmberMat = null;

        // State
        this.currentStep = 'locked'; // 'preop', 'reduction', 'pins', 'locked'
        this.isAutoRotating = true;
        this.showCorridors = true;
        this.showWireframe = false;

        this.init();
    }

    init() {
        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded');
            return;
        }

        const width = this.container.clientWidth || 700;
        const height = this.container.clientHeight || 460;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x07111e); // Realistic OR Theater Ambiance
        this.scene.fog = new THREE.FogExp2(0x07111e, 0.018);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(24, 12, 28);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 4. Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.06;
            this.controls.minDistance = 8;
            this.controls.maxDistance = 50;
            this.controls.maxPolarAngle = Math.PI / 2.05; // Don't go below floor
            this.controls.target.set(0, 0, 0);
        }

        // 5. Lighting
        this.setupLights();

        // 6. Complete Operating Room (OR) Architecture
        this.buildOperatingRoomEnvironment();

        // 7. Anatomical Knee Joint & Surgical Jig
        this.buildKneeOsteotomyModel();

        // 8. Event Listeners & UI
        this.setupUIListeners();
        window.addEventListener('resize', () => this.onWindowResize());

        // 9. Animation Loop
        this.animate = this.animate.bind(this);
        this.animate();
    }

    setupLights() {
        // Soft Ambient OR Light
        const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.75);
        this.scene.add(ambientLight);

        // Overhead Surgical Dome Spotlight 1 (Main Field Focus)
        const surgicalLampSpot1 = new THREE.SpotLight(0xffffff, 2.4, 45, Math.PI / 4.5, 0.3, 1.2);
        surgicalLampSpot1.position.set(8, 22, 12);
        surgicalLampSpot1.target.position.set(0, 0, 0);
        surgicalLampSpot1.castShadow = true;
        this.scene.add(surgicalLampSpot1);
        this.scene.add(surgicalLampSpot1.target);

        // Overhead Surgical Dome Spotlight 2 (Secondary Cross-Beam to prevent shadows)
        const surgicalLampSpot2 = new THREE.SpotLight(0xe0f2fe, 1.8, 40, Math.PI / 4, 0.35, 1.1);
        surgicalLampSpot2.position.set(-14, 18, -10);
        surgicalLampSpot2.target.position.set(0, 0, 0);
        this.scene.add(surgicalLampSpot2);
        this.scene.add(surgicalLampSpot2.target);

        // Cool Clinical Cyan Rim
        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
        rimLight.position.set(-15, 6, 15);
        this.scene.add(rimLight);
    }

    buildOperatingRoomEnvironment() {
        this.orEnvironmentGroup = new THREE.Group();

        // Materials
        this.steelMat = new THREE.MeshStandardMaterial({
            color: 0x94A3B8,
            metalness: 0.85,
            roughness: 0.25
        });

        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x0c1a2d,
            roughness: 0.4,
            metalness: 0.2
        });

        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x091424,
            roughness: 0.8,
            metalness: 0.1
        });

        this.drapeMat = new THREE.MeshStandardMaterial({
            color: 0x0E4D8B, // Sterile Surgical Navy/Blue Drape
            roughness: 0.75,
            metalness: 0.05
        });

        // 1. OR Floor with Subtle Medical Grid Lines
        const floorGeo = new THREE.PlaneGeometry(80, 80);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -10;
        floor.receiveShadow = true;
        this.orEnvironmentGroup.add(floor);

        const gridHelper = new THREE.GridHelper(50, 30, 0x0284c7, 0x172554);
        gridHelper.position.y = -9.95;
        this.orEnvironmentGroup.add(gridHelper);

        // 2. OR Back Walls
        const backWallGeo = new THREE.PlaneGeometry(80, 40);
        const backWall = new THREE.Mesh(backWallGeo, wallMat);
        backWall.position.set(0, 10, -35);
        this.orEnvironmentGroup.add(backWall);

        // 3. Dual-Dome Overhead Surgical Lights (Suspended in Ceiling)
        this.overheadLampGroup = new THREE.Group();

        // Surgical Dome 1
        const dome1 = this.createSurgicalLampDome(10, 22, 10, -0.4, 0.3);
        this.overheadLampGroup.add(dome1);

        // Surgical Dome 2
        const dome2 = this.createSurgicalLampDome(-12, 20, -8, 0.5, -0.4);
        this.overheadLampGroup.add(dome2);

        this.orEnvironmentGroup.add(this.overheadLampGroup);

        // 4. Operating Table (Pedestal, Cushion, Sterile Surgical Drapes)
        this.surgicalTableGroup = new THREE.Group();

        // Hydraulic Steel Pedestal
        const pedestalGeo = new THREE.CylinderGeometry(2.5, 3.2, 8, 24);
        const pedestal = new THREE.Mesh(pedestalGeo, this.steelMat);
        pedestal.position.set(0, -6, 0);
        this.surgicalTableGroup.add(pedestal);

        // Table Top Base
        const tableBaseGeo = new THREE.BoxGeometry(22, 1.2, 12);
        const tableBase = new THREE.Mesh(tableBaseGeo, this.steelMat);
        tableBase.position.set(-2, -2.4, 0);
        this.surgicalTableGroup.add(tableBase);

        // Sterile Blue Surgical Drape over Operating Table
        const drapeGeo = new THREE.BoxGeometry(24, 2.5, 14);
        const drape = new THREE.Mesh(drapeGeo, this.drapeMat);
        drape.position.set(-2, -2.8, 0);
        this.surgicalTableGroup.add(drape);

        // Patient Limb Contour Drape (Fenestrated Drape around Knee)
        const thighDrapeGeo = new THREE.CylinderGeometry(2.8, 3.4, 11, 24);
        const thighDrape = new THREE.Mesh(thighDrapeGeo, this.drapeMat);
        thighDrape.position.set(-7.5, 4.2, -1.8);
        thighDrape.rotation.z = 0.42;
        thighDrape.rotation.x = -0.22;
        this.surgicalTableGroup.add(thighDrape);

        const calfDrapeGeo = new THREE.CylinderGeometry(2.6, 2.1, 12, 24);
        const calfDrape = new THREE.Mesh(calfDrapeGeo, this.drapeMat);
        calfDrape.position.set(0.2, -8.2, 0.2);
        this.surgicalTableGroup.add(calfDrape);

        this.orEnvironmentGroup.add(this.surgicalTableGroup);

        // 5. OR Background Equipment: Wall Monitor / Tele-Guidance PACS Screen
        const monitorFrameGeo = new THREE.BoxGeometry(14, 8, 0.8);
        const monitorFrame = new THREE.Mesh(monitorFrameGeo, this.steelMat);
        monitorFrame.position.set(16, 7, -24);
        monitorFrame.rotation.y = -0.38;

        const screenGeo = new THREE.PlaneGeometry(13.2, 7.2);
        const screenMat = new THREE.MeshBasicMaterial({
            color: 0x0A2E50,
            side: THREE.DoubleSide
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(16, 7, -23.5);
        screen.rotation.y = -0.38;

        this.orEnvironmentGroup.add(monitorFrame);
        this.orEnvironmentGroup.add(screen);

        // 6. Stainless Mayo Instrument Stand in Periphery
        const mayoStandGroup = new THREE.Group();
        const mayoPoleGeo = new THREE.CylinderGeometry(0.3, 0.3, 10, 16);
        const mayoPole = new THREE.Mesh(mayoPoleGeo, this.steelMat);
        mayoPole.position.set(-14, -5, 8);
        mayoStandGroup.add(mayoPole);

        const mayoTrayGeo = new THREE.BoxGeometry(7, 0.4, 5);
        const mayoTray = new THREE.Mesh(mayoTrayGeo, this.steelMat);
        mayoTray.position.set(-14, 0, 8);
        mayoStandGroup.add(mayoTray);

        this.orEnvironmentGroup.add(mayoStandGroup);

        this.scene.add(this.orEnvironmentGroup);
    }

    createSurgicalLampDome(x, y, z, rotX, rotZ) {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(x, y, z);
        lampGroup.rotation.x = rotX;
        lampGroup.rotation.z = rotZ;

        // Suspension Articulated Arm
        const armGeo = new THREE.CylinderGeometry(0.35, 0.35, 8, 16);
        const arm = new THREE.Mesh(armGeo, this.steelMat);
        arm.position.set(0, 4, 0);
        lampGroup.add(arm);

        // Outer Dome
        const domeGeo = new THREE.SphereGeometry(4.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({
            color: 0xE2E8F0,
            roughness: 0.25,
            metalness: 0.6,
            side: THREE.DoubleSide
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.rotation.x = Math.PI;
        lampGroup.add(dome);

        // Glowing Multi-LED Light Face
        const ledFaceGeo = new THREE.CircleGeometry(4.3, 32);
        const ledFaceMat = new THREE.MeshBasicMaterial({
            color: 0xF0F9FF,
            side: THREE.DoubleSide
        });
        const ledFace = new THREE.Mesh(ledFaceGeo, ledFaceMat);
        ledFace.rotation.x = Math.PI / 2;
        ledFace.position.y = 0.1;
        lampGroup.add(ledFace);

        // Center Sterile Handle
        const handleGeo = new THREE.CylinderGeometry(0.25, 0.25, 2.2, 16);
        const handle = new THREE.Mesh(handleGeo, this.steelMat);
        handle.position.set(0, -1.2, 0);
        lampGroup.add(handle);

        return lampGroup;
    }

    buildKneeOsteotomyModel() {
        this.kneeAssembly = new THREE.Group();

        // Realistic Bone & Cartilage Shaders
        this.boneMat = new THREE.MeshStandardMaterial({
            color: 0xF3EFE6, // Realistic Bone Ivory
            roughness: 0.32,
            metalness: 0.05,
            flatShading: false
        });

        this.cartilageMat = new THREE.MeshStandardMaterial({
            color: 0xBEE3F8,
            roughness: 0.18,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85
        });

        this.titaniumMat = new THREE.MeshStandardMaterial({
            color: 0x94A3B8,
            metalness: 0.9,
            roughness: 0.2
        });

        this.holoCyanMat = new THREE.MeshBasicMaterial({
            color: 0x38BDF8,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        this.holoAmberMat = new THREE.MeshBasicMaterial({
            color: 0xFBBF24,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        // ==========================================
        // 1. FEMUR (DISTAL SEGMENT & CONDYLES)
        // ==========================================
        this.femurGroup = new THREE.Group();

        // Femoral Diaphysis
        const femurShaftGeo = new THREE.CylinderGeometry(1.45, 1.8, 9, 32);
        const femurShaft = new THREE.Mesh(femurShaftGeo, this.boneMat);
        femurShaft.position.set(-2.5, 4.2, -1.2);
        femurShaft.rotation.z = 0.38;
        femurShaft.rotation.x = -0.25;
        this.femurGroup.add(femurShaft);

        // Medial Femoral Condyle
        const medialCondyleGeo = new THREE.SphereGeometry(1.65, 32, 24);
        medialCondyleGeo.scale(1.2, 1.0, 1.5);
        const medialCondyle = new THREE.Mesh(medialCondyleGeo, this.boneMat);
        medialCondyle.position.set(-0.9, 0.4, 0.4);
        this.femurGroup.add(medialCondyle);

        // Lateral Femoral Condyle
        const lateralCondyleGeo = new THREE.SphereGeometry(1.5, 32, 24);
        lateralCondyleGeo.scale(1.1, 0.95, 1.4);
        const lateralCondyle = new THREE.Mesh(lateralCondyleGeo, this.boneMat);
        lateralCondyle.position.set(1.2, 0.4, 0.4);
        this.femurGroup.add(lateralCondyle);

        // Distal Cartilage Cap
        const cartilageCapGeo = new THREE.TorusGeometry(1.2, 0.4, 16, 32, Math.PI);
        const cartilageCap = new THREE.Mesh(cartilageCapGeo, this.cartilageMat);
        cartilageCap.position.set(0.15, -0.3, 0.5);
        cartilageCap.rotation.x = Math.PI / 2;
        this.femurGroup.add(cartilageCap);

        this.kneeAssembly.add(this.femurGroup);

        // ==========================================
        // 2. TIBIA & FIBULA (PROXIMAL SEGMENT)
        // ==========================================
        this.tibiaGroup = new THREE.Group();

        // Tibial Plateau
        const tibialPlateauGeo = new THREE.CylinderGeometry(2.3, 1.7, 1.8, 32);
        const tibialPlateau = new THREE.Mesh(tibialPlateauGeo, this.boneMat);
        tibialPlateau.position.set(0.15, -1.8, 0.2);
        this.tibiaGroup.add(tibialPlateau);

        // Tibial Shaft
        const tibiaShaftGeo = new THREE.CylinderGeometry(1.65, 1.35, 9.5, 32);
        const tibiaShaft = new THREE.Mesh(tibiaShaftGeo, this.boneMat);
        tibiaShaft.position.set(0.15, -6.8, 0.2);
        this.tibiaGroup.add(tibiaShaft);

        // Fibular Head & Shaft
        const fibulaGeo = new THREE.CylinderGeometry(0.55, 0.45, 8.5, 16);
        const fibula = new THREE.Mesh(fibulaGeo, this.boneMat);
        fibula.position.set(2.4, -6.2, -0.4);
        fibula.rotation.z = -0.05;
        this.tibiaGroup.add(fibula);

        this.kneeAssembly.add(this.tibiaGroup);

        // ==========================================
        // 3. PATELLA (KNEE CAP)
        // ==========================================
        const patellaGeo = new THREE.SphereGeometry(1.1, 24, 18);
        patellaGeo.scale(1.2, 1.4, 0.65);
        this.patellaMesh = new THREE.Mesh(patellaGeo, this.boneMat);
        this.patellaMesh.position.set(0.15, 1.1, 2.3);
        this.patellaMesh.rotation.x = -0.2;
        this.kneeAssembly.add(this.patellaMesh);

        // ==========================================
        // 4. SURGICAL REALIGNMENT JIG & RESECTION HARDWARE
        // ==========================================
        this.surgicalJigGroup = new THREE.Group();

        // Intramedullary Alignment Rod
        const rodGeo = new THREE.CylinderGeometry(0.24, 0.24, 14, 20);
        const alignmentRod = new THREE.Mesh(rodGeo, this.titaniumMat);
        alignmentRod.position.set(0.2, 2.5, 3.2);
        alignmentRod.rotation.x = 0.28;
        this.surgicalJigGroup.add(alignmentRod);

        // Distal Femoral Resection Cutting Block
        const blockGeo = new THREE.BoxGeometry(4.2, 1.4, 1.2);
        const cuttingBlock = new THREE.Mesh(blockGeo, this.titaniumMat);
        cuttingBlock.position.set(0.15, 0.6, 2.8);
        this.surgicalJigGroup.add(cuttingBlock);

        // Fixation Pins
        const pinGeo = new THREE.CylinderGeometry(0.12, 0.12, 5, 16);
        pinGeo.rotateX(Math.PI / 2);

        const pinMedial = new THREE.Mesh(pinGeo, this.titaniumMat);
        pinMedial.position.set(-1.2, 0.6, 1.2);
        this.surgicalJigGroup.add(pinMedial);

        const pinLateral = new THREE.Mesh(pinGeo, this.titaniumMat);
        pinLateral.position.set(1.5, 0.6, 1.2);
        this.surgicalJigGroup.add(pinLateral);

        this.kneeAssembly.add(this.surgicalJigGroup);

        // ==========================================
        // 5. AR HOLOGRAPHIC TRAJECTORY RINGS & DISCS
        // ==========================================
        this.arHoloGroup = new THREE.Group();

        // Holographic Resection Disc (Cyan)
        const disc1Geo = new THREE.RingGeometry(0.3, 3.6, 36);
        const holoDisc1 = new THREE.Mesh(disc1Geo, this.holoCyanMat);
        holoDisc1.position.set(-2.2, 3.8, -0.8);
        holoDisc1.rotation.x = Math.PI / 2.3;
        holoDisc1.rotation.y = -0.3;
        this.arHoloGroup.add(holoDisc1);

        // Holographic Mechanical Axis Ring (Amber)
        const ring2Geo = new THREE.TorusGeometry(3.2, 0.08, 16, 48);
        const holoRing2 = new THREE.Mesh(ring2Geo, this.holoAmberMat);
        holoRing2.position.set(0.15, 0.0, 0.6);
        holoRing2.rotation.x = Math.PI / 2;
        this.arHoloGroup.add(holoRing2);

        // Cutting Plane Guide
        const cutPlaneGeo = new THREE.PlaneGeometry(6.2, 4.5);
        const cutPlaneMat = new THREE.MeshBasicMaterial({
            color: 0x38BDF8,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide
        });
        const cutPlane = new THREE.Mesh(cutPlaneGeo, cutPlaneMat);
        cutPlane.position.set(0.15, 0.4, 0.6);
        cutPlane.rotation.x = Math.PI / 2;
        this.arHoloGroup.add(cutPlane);

        // Laser Guidance Cone
        const laserBeamGeo = new THREE.ConeGeometry(0.8, 7, 24, 1, true);
        const laserBeamMat = new THREE.MeshBasicMaterial({
            color: 0x38BDF8,
            transparent: true,
            opacity: 0.35,
            wireframe: true
        });
        const laserBeam = new THREE.Mesh(laserBeamGeo, laserBeamMat);
        laserBeam.position.set(0.2, 4.8, 1.8);
        laserBeam.rotation.x = -0.28;
        this.arHoloGroup.add(laserBeam);

        this.kneeAssembly.add(this.arHoloGroup);

        this.scene.add(this.kneeAssembly);

        // Default to locked state
        this.applyProceduralStep('locked');
    }

    applyProceduralStep(step) {
        this.currentStep = step;

        const hudStatus = document.getElementById('hudProcedureState');
        const hudAngle = document.getElementById('hudVarusAngle');
        const hudDepth = document.getElementById('hudDrillDepth');
        const hudStability = document.getElementById('hudStabilityScore');

        // Reset step buttons
        document.querySelectorAll('.step-3d-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.step === step);
        });

        switch(step) {
            case 'preop':
                this.femurGroup.position.set(-0.8, 0.2, 0.2);
                this.femurGroup.rotation.set(0.1, 0, -0.22);
                this.tibiaGroup.rotation.set(-0.08, 0, 0.12);
                this.surgicalJigGroup.visible = false;
                this.arHoloGroup.visible = true;
                if (hudStatus) hudStatus.textContent = "Step 1: Anatomic Mapping — Severe Varus Malalignment";
                if (hudAngle) hudAngle.textContent = "8.4° Varus Deformity (Target: 0.0°)";
                if (hudDepth) hudDepth.textContent = "Pre-Resection (Baseline)";
                if (hudStability) hudStability.textContent = "Asymmetrical Joint Contact (Medial Overload)";
                break;

            case 'reduction':
                this.femurGroup.position.set(-0.2, 0.1, 0);
                this.femurGroup.rotation.set(0, 0, -0.06);
                this.tibiaGroup.rotation.set(0, 0, 0);
                this.surgicalJigGroup.visible = true;
                this.arHoloGroup.visible = true;
                if (hudStatus) hudStatus.textContent = "Step 2: Intramedullary Alignment Rod & Valgus Calibration";
                if (hudAngle) hudAngle.textContent = "Valgus Correction: 5.8° Anatomic Offset";
                if (hudDepth) hudDepth.textContent = "Entry Portal Calibrated (Anteromedial)";
                if (hudStability) hudStability.textContent = "Mechanical Axis Aligned (45% Guided)";
                break;

            case 'pins':
                this.femurGroup.position.set(0, 0, 0);
                this.femurGroup.rotation.set(0, 0, 0);
                this.tibiaGroup.rotation.set(0, 0, 0);
                this.surgicalJigGroup.visible = true;
                this.arHoloGroup.visible = true;
                if (hudStatus) hudStatus.textContent = "Step 3: Distal Femoral Resection Plane & Pin Anchoring";
                if (hudAngle) hudAngle.textContent = "0.4° Coronal Deviation (Within Tolerance)";
                if (hudDepth) hudDepth.textContent = "Distal Femur Cut: 9.0 mm (Verified)";
                if (hudStability) hudStability.textContent = "Pins Locked (85% Fixed)";
                break;

            case 'locked':
            default:
                this.femurGroup.position.set(0, 0, 0);
                this.femurGroup.rotation.set(0, 0, 0);
                this.tibiaGroup.rotation.set(0, 0, 0);
                this.surgicalJigGroup.visible = true;
                this.arHoloGroup.visible = this.showCorridors;
                if (hudStatus) hudStatus.textContent = "Step 4: Mechanical Neutral Axis Realignment Complete";
                if (hudAngle) hudAngle.textContent = "Varus/Valgus: 0.2° · Flex/Ext: 3.0°";
                if (hudDepth) hudDepth.textContent = "Resection: 9.0mm Distal / 8.5mm Tibial";
                if (hudStability) hudStability.textContent = "99.8% Symmetrical Joint Balance";
                break;
        }
    }

    setupUIListeners() {
        document.querySelectorAll('.step-3d-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const step = e.currentTarget.dataset.step;
                if (step) this.applyProceduralStep(step);
            });
        });

        const rotBtn = document.getElementById('toggle3DRotationBtn');
        if (rotBtn) {
            rotBtn.addEventListener('click', () => {
                this.isAutoRotating = !this.isAutoRotating;
                rotBtn.classList.toggle('active', this.isAutoRotating);
            });
        }

        const corridorBtn = document.getElementById('toggle3DCorridorsBtn');
        if (corridorBtn) {
            corridorBtn.addEventListener('click', () => {
                this.showCorridors = !this.showCorridors;
                if (this.arHoloGroup) this.arHoloGroup.visible = this.showCorridors;
                corridorBtn.classList.toggle('active', this.showCorridors);
            });
        }

        const wireBtn = document.getElementById('toggle3DWireframeBtn');
        if (wireBtn) {
            wireBtn.addEventListener('click', () => {
                this.showWireframe = !this.showWireframe;
                if (this.boneMat) this.boneMat.wireframe = this.showWireframe;
                wireBtn.classList.toggle('active', this.showWireframe);
            });
        }

        const resetBtn = document.getElementById('reset3DCameraBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.camera && this.controls) {
                    this.camera.position.set(24, 12, 28);
                    this.controls.target.set(0, -1, 0);
                    this.controls.update();
                }
            });
        }
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        this.animFrameId = requestAnimationFrame(this.animate);

        if (this.controls) this.controls.update();

        // Slow cinematic auto rotation around knee joint
        if (this.isAutoRotating && this.kneeAssembly) {
            this.kneeAssembly.rotation.y += 0.005;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Global initialization
window.initSurgical3DViewer = function() {
    if (!window._surgical3DInstance) {
        window._surgical3DInstance = new Surgical3DViewer();
    }
};
