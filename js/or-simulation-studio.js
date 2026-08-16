/**
 * SurgEdge Platform - Production-Grade AR Smart Surgical Glasses & 360° OR Suite
 * Medical Augmented Reality (AR) Heads-Up Display (HUD), Precision Alignment Reticles & Intra-Operative Telemetry
 */

class ORSimulationStudio {
    constructor() {
        this.viewport = document.getElementById('orSimViewport');
        this.canvas3D = document.getElementById('orSim3DCanvas');
        this.canvasTelestration = document.getElementById('orSimTelestrationCanvas');
        if (!this.viewport || !this.canvas3D) return;

        // Three.js 360° Panoramic WebGL Engine
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animFrameId = null;
        this.orPanoramaSphere = null;

        // Smart Glasses Spatial AR Group
        this.arSmartGlassesGroup = null;
        this.arLaserLine = null;
        this.arReticleMesh = null;
        this.arDepthPlane = null;

        // Zoom & Orbit Configuration
        this.defaultFov = 50;
        this.currentFov = 50;
        this.minFov = 18;  // Extreme surgical close-up
        this.maxFov = 75;  // Wide OR theatre panorama
        this.isAutoOrbiting = true;
        this.isPlaying = true;
        this.playbackSpeed = 1;
        this.currentTime = 0;
        this.duration = 480; // 8:00 minutes
        this.activeCameraMode = 'or-wide';

        // 2D Smart Glasses AR HUD & Telestration State
        this.ctx2D = this.canvasTelestration ? this.canvasTelestration.getContext('2d') : null;
        this.isDrawing = false;
        this.currentTool = null;
        this.currentColor = '#38BDF8';
        this.brushSize = 3.5;
        this.strokes = [];
        this.currentStroke = null;
        this.ecgOffset = 0;
        this.hudScanPhase = 0;

        // Procedural Step Milestones
        this.steps = [
            { id: 'step-1', time: 0, name: '1. Anatomic Landmark Mapping', angle: '8.4° Varus Deformity', cut: 'Pre-Resection Baseline', balance: 'Medial Compartment Overload' },
            { id: 'step-2', time: 120, name: '2. Intramedullary Rod Insertion', angle: '5.8° Valgus Offset Guide', cut: 'Anatomic Portal Calibrated', balance: 'Mechanical Axis Aligned (45%)' },
            { id: 'step-3', time: 260, name: '3. Resection Plane Calibration', angle: '0.4° Coronal Deviation', cut: '9.0mm Distal Femur Verified', balance: 'Cutting Block Pinned (85%)' },
            { id: 'step-4', time: 380, name: '4. Joint Realignment & Stability', angle: '0.2° Varus / 3.0° Flex', cut: '9.0mm Distal / 8.5mm Tibial', balance: '99.8% Symmetrical Balance' }
        ];

        this.init();
    }

    init() {
        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded');
            return;
        }

        const width = this.viewport.clientWidth || 800;
        const height = this.viewport.clientHeight || 450;

        // 1. WebGL 3D Scene
        this.scene = new THREE.Scene();

        // 2. 360° Perspective Camera
        this.camera = new THREE.PerspectiveCamera(this.currentFov, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 0.1);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas3D,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 4. 360° OrbitControls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.06;
            this.controls.rotateSpeed = -0.55;
            this.controls.enableZoom = false; // Handled smoothly via FOV for 360 spheres
            this.controls.target.set(0, -0.05, -1);
        }

        // 5. Ambient Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
        this.scene.add(ambientLight);

        // 6. Build 360° Panoramic Operating Room Environment
        this.build360PanoramaEnvironment();

        // 7. Build Spatial AR Smart Glasses Precision Crosshair & Resection Laser
        this.buildSpatialARSmartGlassesLayer();

        // 8. Event Listeners & Controls
        this.setupControls();
        this.setupZoomHandling();
        this.setupTelestration();
        this.resize2DCanvas();

        window.addEventListener('resize', () => {
            this.onWindowResize();
            this.resize2DCanvas();
        });

        // 9. Start Main Animation Loop
        this.animate = this.animate.bind(this);
        this.animate();
    }

    build360PanoramaEnvironment() {
        const sphereGeo = new THREE.SphereGeometry(50, 60, 40);
        sphereGeo.scale(-1, 1, 1);

        const textureSrc = (typeof window !== 'undefined' && window.OR_PANORAMA_BASE64) ? window.OR_PANORAMA_BASE64 : 'assets/images/or_3d_simulation_suite.jpg';
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(textureSrc, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const sphereMat = new THREE.MeshBasicMaterial({ map: texture });
            this.orPanoramaSphere = new THREE.Mesh(sphereGeo, sphereMat);
            this.scene.add(this.orPanoramaSphere);
        });
    }

    buildSpatialARSmartGlassesLayer() {
        // Precision AR Smart Glasses spatial alignment line over operative knee field
        this.arSmartGlassesGroup = new THREE.Group();
        this.arSmartGlassesGroup.position.set(0.15, -1.15, -6.8);

        // Precision Mechanical Axis Alignment Guide Laser
        const laserGeo = new THREE.CylinderGeometry(0.015, 0.015, 3.2, 16);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0x38BDF8,
            transparent: true,
            opacity: 0.85
        });
        this.arLaserLine = new THREE.Mesh(laserGeo, laserMat);
        this.arLaserLine.position.set(0, 0.2, 0);
        this.arLaserLine.rotation.z = 0.05;
        this.arSmartGlassesGroup.add(this.arLaserLine);

        // Surgical Resection Depth Grid Plane (Subtle Translucent Guide)
        const planeGeo = new THREE.PlaneGeometry(1.8, 1.2);
        const planeMat = new THREE.MeshBasicMaterial({
            color: 0x0284C7,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        this.arDepthPlane = new THREE.Mesh(planeGeo, planeMat);
        this.arDepthPlane.position.set(0, -0.25, 0.05);
        this.arDepthPlane.rotation.x = Math.PI / 2.2;
        this.arSmartGlassesGroup.add(this.arDepthPlane);

        this.scene.add(this.arSmartGlassesGroup);
    }

    setupZoomHandling() {
        // Mouse Wheel FOV Zoom
        this.canvas3D.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY) * 3.5;
            this.setZoomFov(this.currentFov + delta);
        }, { passive: false });

        // Touch Pinch Zoom
        let touchStartDist = 0;
        this.canvas3D.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                touchStartDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });

        this.canvas3D.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && touchStartDist > 0) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const diff = (touchStartDist - dist) * 0.1;
                this.setZoomFov(this.currentFov + diff);
                touchStartDist = dist;
            }
        }, { passive: true });

        // Zoom In Button (+)
        const zoomInBtn = document.getElementById('or3DZoomInBtn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.setZoomFov(this.currentFov - 8);
            });
        }

        // Zoom Out Button (-)
        const zoomOutBtn = document.getElementById('or3DZoomOutBtn');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.setZoomFov(this.currentFov + 8);
            });
        }
    }

    setZoomFov(newFov) {
        this.currentFov = Math.max(this.minFov, Math.min(this.maxFov, newFov));
        if (this.camera) {
            this.camera.fov = this.currentFov;
            this.camera.updateProjectionMatrix();
        }
    }

    setupControls() {
        // 360° Auto-Orbit Toggle
        const autoOrbitBtn = document.getElementById('or3DAutoOrbitBtn');
        if (autoOrbitBtn) {
            autoOrbitBtn.addEventListener('click', () => {
                this.isAutoOrbiting = !this.isAutoOrbiting;
                autoOrbitBtn.classList.toggle('active', this.isAutoOrbiting);
            });
        }

        // 360° Reset View Button
        const resetBtn = document.getElementById('or3DResetViewBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.setZoomFov(this.defaultFov);
                if (this.camera && this.controls) {
                    this.camera.position.set(0, 0, 0.1);
                    this.controls.target.set(0, -0.05, -1);
                    this.controls.update();
                }
            });
        }

        // Camera Views
        document.querySelectorAll('.or-cam-btn[data-cam]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.or-cam-btn[data-cam]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const camMode = e.currentTarget.dataset.cam;
                this.activeCameraMode = camMode;

                if (camMode === 'or-wide') {
                    this.setZoomFov(50);
                    this.controls.target.set(0, -0.05, -1);
                } else if (camMode === 'ar-align') {
                    this.setZoomFov(28); // Precision close-up into AR smart glasses field
                    this.controls.target.set(0.1, -0.2, -1);
                }
                this.controls.update();
            });
        });

        // Play / Pause
        const playBtn = document.getElementById('orSimPlayBtn');
        const playIcon = document.getElementById('orSimPlayIcon');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.isPlaying = !this.isPlaying;
                if (playIcon) playIcon.textContent = this.isPlaying ? '❚❚' : '▶';
            });
        }

        // Progress Scrubber
        const progressTrack = document.getElementById('orSimProgressTrack');
        if (progressTrack) {
            progressTrack.addEventListener('click', (e) => {
                const rect = progressTrack.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                this.currentTime = Math.max(0, Math.min(this.duration, clickPos * this.duration));
                this.updateUI();
            });
        }

        // Step Buttons
        document.querySelectorAll('.or-sim-step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stepIdx = parseInt(e.currentTarget.dataset.stepIndex, 10);
                if (!isNaN(stepIdx) && this.steps[stepIdx]) {
                    this.currentTime = this.steps[stepIdx].time;
                    this.updateUI();
                }
            });
        });

        // Speed Select
        const speedSelect = document.getElementById('orSimSpeedSelect');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.playbackSpeed = parseFloat(e.target.value) || 1;
            });
        }
    }

    setupTelestration() {
        if (!this.canvasTelestration) return;

        // Tool Switcher (Drawing Mode toggles pointer-events)
        document.querySelectorAll('.or-sim-tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wasActive = btn.classList.contains('active');
                if (wasActive) {
                    btn.classList.remove('active');
                    this.viewport.classList.remove('drawing-active');
                    this.currentTool = null;
                } else {
                    document.querySelectorAll('.or-sim-tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.viewport.classList.add('drawing-active');
                    this.currentTool = btn.dataset.tool;
                }
            });
        });

        // Color Swatches
        document.querySelectorAll('.or-sim-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                document.querySelectorAll('.or-sim-swatch').forEach(s => s.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentColor = e.currentTarget.dataset.color;
                this.viewport.classList.add('drawing-active');
                const drawBtn = document.querySelector('.or-sim-tool-btn[data-tool="pen"]');
                if (drawBtn) drawBtn.classList.add('active');
            });
        });

        // Clear
        const clearBtn = document.getElementById('orSimClearCanvasBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.strokes = [];
                this.viewport.classList.remove('drawing-active');
                const drawBtn = document.querySelector('.or-sim-tool-btn[data-tool="pen"]');
                if (drawBtn) drawBtn.classList.remove('active');
            });
        }

        const getPos = (e) => {
            const rect = this.canvasTelestration.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDraw = (e) => {
            if (!this.viewport.classList.contains('drawing-active')) return;
            this.isDrawing = true;
            const pos = getPos(e);
            this.currentStroke = {
                color: this.currentColor,
                width: this.brushSize,
                points: [pos]
            };
            this.strokes.push(this.currentStroke);
        };

        const drawMove = (e) => {
            if (!this.isDrawing || !this.currentStroke) return;
            const pos = getPos(e);
            this.currentStroke.points.push(pos);
        };

        const stopDraw = () => {
            this.isDrawing = false;
            this.currentStroke = null;
        };

        this.canvasTelestration.addEventListener('mousedown', startDraw);
        this.canvasTelestration.addEventListener('mousemove', drawMove);
        window.addEventListener('mouseup', stopDraw);

        this.canvasTelestration.addEventListener('touchstart', startDraw, { passive: true });
        this.canvasTelestration.addEventListener('touchmove', drawMove, { passive: true });
        window.addEventListener('touchend', stopDraw);
    }

    resize2DCanvas() {
        if (!this.canvasTelestration || !this.viewport) return;
        const rect = this.viewport.getBoundingClientRect();
        this.canvasTelestration.width = rect.width;
        this.canvasTelestration.height = rect.height;
    }

    onWindowResize() {
        if (!this.viewport || !this.renderer || !this.camera) return;
        const width = this.viewport.clientWidth;
        const height = this.viewport.clientHeight;
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        this.animFrameId = requestAnimationFrame(this.animate);

        // 1. OrbitControls & Continuous 360° Auto-Orbit
        if (this.controls) {
            this.controls.update();

            if (this.isAutoOrbiting && this.isPlaying) {
                const angle = 0.0022 * this.playbackSpeed;
                this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                this.controls.target.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            }
        }

        // 2. Playback Timeline Progress
        if (this.isPlaying) {
            this.currentTime += (1 / 60) * this.playbackSpeed;
            if (this.currentTime >= this.duration) {
                this.currentTime = 0;
            }
            this.hudScanPhase += 0.035 * this.playbackSpeed;
            this.updateUI();
        }

        // 3. Render 360° Three.js Scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        // 4. Render Smart Glasses AR Heads-Up Display (HUD) & Overlays
        this.renderSmartGlassesHUD();
    }

    renderSmartGlassesHUD() {
        if (!this.ctx2D || !this.canvasTelestration) return;
        const w = this.canvasTelestration.width;
        const h = this.canvasTelestration.height;
        if (!w || !h) return;

        this.ctx2D.clearRect(0, 0, w, h);

        // =========================================================
        // AR SMART GLASSES RETICLE OVERLAY (HEADS-UP OPTICAL VISOR)
        // =========================================================
        const cx = w * 0.58;
        const cy = h * 0.68;
        const reticleW = Math.min(260, w * 0.32);
        const reticleH = Math.min(180, h * 0.35);

        this.ctx2D.save();

        // 1. AR Smart Glasses Frame Optical Brackets [ ⟝ ⟞ ]
        this.ctx2D.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        this.ctx2D.lineWidth = 1.8;
        this.ctx2D.shadowColor = '#38BDF8';
        this.ctx2D.shadowBlur = 8;

        const cornerLen = 18;

        // Top Left Corner
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(cx - reticleW / 2, cy - reticleH / 2 + cornerLen);
        this.ctx2D.lineTo(cx - reticleW / 2, cy - reticleH / 2);
        this.ctx2D.lineTo(cx - reticleW / 2 + cornerLen, cy - reticleH / 2);
        this.ctx2D.stroke();

        // Top Right Corner
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(cx + reticleW / 2 - cornerLen, cy - reticleH / 2);
        this.ctx2D.lineTo(cx + reticleW / 2, cy - reticleH / 2);
        this.ctx2D.lineTo(cx + reticleW / 2, cy - reticleH / 2 + cornerLen);
        this.ctx2D.stroke();

        // Bottom Left Corner
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(cx - reticleW / 2, cy + reticleH / 2 - cornerLen);
        this.ctx2D.lineTo(cx - reticleW / 2, cy + reticleH / 2);
        this.ctx2D.lineTo(cx - reticleW / 2 + cornerLen, cy + reticleH / 2);
        this.ctx2D.stroke();

        // Bottom Right Corner
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(cx + reticleW / 2 - cornerLen, cy + reticleH / 2);
        this.ctx2D.lineTo(cx + reticleW / 2, cy + reticleH / 2);
        this.ctx2D.lineTo(cx + reticleW / 2, cy + reticleH / 2 - cornerLen);
        this.ctx2D.stroke();

        // 2. Precision Alignment Crosshair & Mechanical Axis Line
        this.ctx2D.beginPath();
        this.ctx2D.setLineDash([4, 4]);
        this.ctx2D.moveTo(cx - reticleW / 2 + 10, cy);
        this.ctx2D.lineTo(cx + reticleW / 2 - 10, cy);
        this.ctx2D.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        this.ctx2D.stroke();
        this.ctx2D.setLineDash([]);

        // Center Precision Target Reticle
        this.ctx2D.beginPath();
        this.ctx2D.arc(cx, cy, 14, 0, Math.PI * 2);
        this.ctx2D.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        this.ctx2D.lineWidth = 1.5;
        this.ctx2D.stroke();

        this.ctx2D.beginPath();
        this.ctx2D.arc(cx, cy, 2.5, 0, Math.PI * 2);
        this.ctx2D.fillStyle = '#38BDF8';
        this.ctx2D.fill();

        // 3. Heads-Up AR Glasses Floating Telemetry Labels
        this.ctx2D.fillStyle = 'rgba(7, 17, 30, 0.85)';
        this.ctx2D.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        this.ctx2D.lineWidth = 1;
        this.ctx2D.roundRect(cx + reticleW / 2 - 110, cy - reticleH / 2 - 28, 115, 24, 4);
        this.ctx2D.fill();
        this.ctx2D.stroke();

        this.ctx2D.fillStyle = '#38BDF8';
        this.ctx2D.font = 'bold 10px monospace';
        const liveDev = (0.2 + Math.sin(this.hudScanPhase) * 0.04).toFixed(1);
        this.ctx2D.fillText(`AR HUD · ${liveDev}° VAL`, cx + reticleW / 2 - 102, cy - reticleH / 2 - 12);

        this.ctx2D.restore();

        // =========================================================
        // REAL-TIME INTRA-OPERATIVE ECG OSCILLOSCOPE MONITOR
        // =========================================================
        const ecgBoxX = 16;
        const ecgBoxY = h - 60;
        const ecgW = Math.min(210, w * 0.35);
        const ecgH = 42;

        this.ctx2D.fillStyle = 'rgba(7, 17, 30, 0.88)';
        this.ctx2D.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        this.ctx2D.lineWidth = 1;
        this.ctx2D.roundRect(ecgBoxX, ecgBoxY, ecgW, ecgH, 6);
        this.ctx2D.fill();
        this.ctx2D.stroke();

        this.ctx2D.save();
        this.ctx2D.beginPath();
        this.ctx2D.rect(ecgBoxX + 2, ecgBoxY + 2, ecgW - 4, ecgH - 4);
        this.ctx2D.clip();

        this.ecgOffset = (this.ecgOffset + 2.5 * this.playbackSpeed) % w;
        this.ctx2D.beginPath();
        this.ctx2D.strokeStyle = '#38BDF8';
        this.ctx2D.lineWidth = 1.8;
        this.ctx2D.shadowColor = '#38BDF8';
        this.ctx2D.shadowBlur = 6;

        for (let x = 0; x < ecgW; x += 2) {
            const phase = ((x + this.ecgOffset) % 110) / 110;
            let y = ecgBoxY + ecgH * 0.58;

            if (phase > 0.35 && phase < 0.4) y -= 4; // P wave
            else if (phase >= 0.4 && phase < 0.43) y += 3; // Q dip
            else if (phase >= 0.43 && phase < 0.48) y -= 20; // R spike
            else if (phase >= 0.48 && phase < 0.52) y += 6; // S dip
            else if (phase >= 0.58 && phase < 0.68) y -= 5; // T wave

            if (x === 0) this.ctx2D.moveTo(ecgBoxX + x, y);
            else this.ctx2D.lineTo(ecgBoxX + x, y);
        }
        this.ctx2D.stroke();

        this.ctx2D.fillStyle = '#94A3B8';
        this.ctx2D.font = '9px system-ui, sans-serif';
        this.ctx2D.fillText('LEAD II · ECG 72 BPM', ecgBoxX + 8, ecgBoxY + 12);
        this.ctx2D.restore();

        // User Telestration Strokes
        this.ctx2D.lineCap = 'round';
        this.ctx2D.lineJoin = 'round';
        this.strokes.forEach(stroke => {
            if (stroke.points.length < 2) return;
            this.ctx2D.beginPath();
            this.ctx2D.strokeStyle = stroke.color;
            this.ctx2D.lineWidth = stroke.width;
            this.ctx2D.shadowColor = stroke.color;
            this.ctx2D.shadowBlur = 6;

            this.ctx2D.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                this.ctx2D.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            this.ctx2D.stroke();
            this.ctx2D.shadowBlur = 0;
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateUI() {
        const timeDisplay = document.getElementById('orSimTimeDisplay');
        if (timeDisplay) {
            timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;
        }

        const progressFill = document.getElementById('orSimProgressFill');
        if (progressFill) {
            const pct = (this.currentTime / this.duration) * 100;
            progressFill.style.width = `${pct}%`;
        }

        let currentStepIdx = 0;
        for (let i = this.steps.length - 1; i >= 0; i--) {
            if (this.currentTime >= this.steps[i].time) {
                currentStepIdx = i;
                break;
            }
        }

        const activeStep = this.steps[currentStepIdx];

        document.querySelectorAll('.or-sim-step-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === currentStepIdx);
        });

        const hudState = document.getElementById('orSimHudState');
        const hudAngle = document.getElementById('orSimHudAngle');
        const hudCut = document.getElementById('orSimHudCut');
        const hudBalance = document.getElementById('orSimHudBalance');

        if (hudState) hudState.textContent = activeStep.name;
        if (hudAngle) hudAngle.textContent = activeStep.angle;
        if (hudCut) hudCut.textContent = activeStep.cut;
        if (hudBalance) hudBalance.textContent = activeStep.balance;
    }
}

// Global Init
window.initORSimulationStudio = function() {
    if (!window._orSimStudioInstance) {
        window._orSimStudioInstance = new ORSimulationStudio();
    }
};
