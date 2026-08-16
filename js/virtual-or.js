/**
 * SurgEdge Virtual OR Suite & AR Telestration Engine
 * High-fidelity interactive tele-mentoring workspace
 */

class VirtualORSuite {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.bgCanvas = null;
        this.bgCtx = null;
        this.vitalsCanvas = null;
        this.vitalsCtx = null;

        // Tool state
        this.currentTool = 'pen'; // 'pen', 'arrow', 'caliper', 'dangerZone', 'stepPin', 'laser'
        this.currentColor = '#00E5CC'; // Default surgical cyan
        this.strokeWidth = 3;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.stepCounter = 1;

        // History Stack for Undo/Redo
        this.history = [];
        this.historyStep = -1;
        this.maxHistory = 30;

        // Active Camera Feed
        this.activeFeed = 'laparoscopic'; // 'laparoscopic', 'overhead', 'pocus'
        this.isPipActive = true;
        this.pipFeed = 'overhead';

        // Network Quality Simulation
        this.currentNetwork = 'satellite'; // 'fiber', 'lte', 'satellite', 'lowband'
        this.networkPresets = {
            fiber: { name: 'High-Speed Fiber', resolution: '4K Ultra-HD (3840x2160)', bitrate: '12.4 Mbps', latency: '14 ms', packetLoss: '0.0%', fps: 60 },
            lte: { name: 'Standard 4G LTE', resolution: '1080p Full-HD (1920x1080)', bitrate: '3.8 Mbps', latency: '48 ms', packetLoss: '0.4%', fps: 30 },
            satellite: { name: 'Starlink Field Satellite', resolution: '720p HD (1280x720)', bitrate: '850 kbps', latency: '185 ms', packetLoss: '1.8%', fps: 24 },
            lowband: { name: '2G/3G Low-Bandwidth Field Mode', resolution: 'Adaptive Frame (640x360)', bitrate: '28 kbps', latency: '340 ms', packetLoss: '5.2%', fps: 12 }
        };

        // Patient Vitals State
        this.vitals = {
            hr: 76,
            spo2: 98,
            bpSys: 122,
            bpDia: 78,
            etco2: 36,
            temp: 36.8
        };
        this.ecgPoints = [];
        this.vitalsAnimId = null;

        // Laser pointer state
        this.laserPos = { x: 0, y: 0, visible: false, pulseRadius: 0 };
        this.laserAnimId = null;

        // Case Log Milestones
        this.caseLogs = [];
    }

    init() {
        this.canvas = document.getElementById('telestrationCanvas');
        this.bgCanvas = document.getElementById('feedBackgroundCanvas');
        this.vitalsCanvas = document.getElementById('ecgWaveformCanvas');

        if (!this.canvas || !this.bgCanvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.bgCtx = this.bgCanvas.getContext('2d');
        if (this.vitalsCanvas) {
            this.vitalsCtx = this.vitalsCanvas.getContext('2d');
        }

        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());

        this.setupEventListeners();
        this.renderSimulatedFeed();
        this.saveState();
        this.startVitalsSimulation();
        this.startLaserAnimation();
        this.updateNetworkUI();
        this.initDefaultLogs();
    }

    resizeCanvases() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = (width * 9) / 16; // Standard 16:9 aspect ratio

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            tempCtx.drawImage(this.canvas, 0, 0);
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.bgCanvas.width = width;
        this.bgCanvas.height = height;

        if (this.vitalsCanvas) {
            this.vitalsCanvas.width = this.vitalsCanvas.parentElement.clientWidth || 300;
            this.vitalsCanvas.height = 60;
        }

        this.renderSimulatedFeed();

        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            this.ctx.drawImage(tempCanvas, 0, 0, width, height);
        }
    }

    setupEventListeners() {
        // Telestration Canvas mouse/touch events
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        this.canvas.addEventListener('mouseleave', () => this.handlePointerLeave());

        // Touch events for tablets & mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerDown(this.getTouchPos(touch));
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerMove(this.getTouchPos(touch));
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePointerUp();
        }, { passive: false });

        // Tool Selection Buttons
        const toolBtns = document.querySelectorAll('.or-tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                if (this.currentTool === 'laser') {
                    this.canvas.style.cursor = 'crosshair';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                }
            });
        });

        // Color Swatches
        const colorSwatches = document.querySelectorAll('.or-color-swatch');
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                colorSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.currentColor = swatch.dataset.color;
            });
        });

        // Action Buttons
        const undoBtn = document.getElementById('orUndoBtn');
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());

        const redoBtn = document.getElementById('orRedoBtn');
        if (redoBtn) redoBtn.addEventListener('click', () => this.redo());

        const clearBtn = document.getElementById('orClearBtn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearTelestration());

        const snapshotBtn = document.getElementById('orSnapshotBtn');
        if (snapshotBtn) snapshotBtn.addEventListener('click', () => this.exportSnapshot());

        // Camera Feed Selectors
        const feedBtns = document.querySelectorAll('.or-feed-tab');
        feedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                feedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFeed = btn.dataset.feed;
                this.renderSimulatedFeed();
            });
        });

        // Network Quality Selector
        const networkSelect = document.getElementById('networkQualitySelector');
        if (networkSelect) {
            networkSelect.addEventListener('change', (e) => {
                this.setNetworkPreset(e.target.value);
            });
        }

        // Intraoperative Log Form
        const addLogBtn = document.getElementById('addOrLogBtn');
        const logInput = document.getElementById('orLogInput');
        if (addLogBtn && logInput) {
            addLogBtn.addEventListener('click', () => {
                if (logInput.value.trim()) {
                    this.addCaseLog(logInput.value.trim());
                    logInput.value = '';
                }
            });
            logInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && logInput.value.trim()) {
                    this.addCaseLog(logInput.value.trim());
                    logInput.value = '';
                }
            });
        }
    }

    getPointerPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    getTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            clientX: touch.clientX,
            clientY: touch.clientY,
            x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (touch.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handlePointerDown(e) {
        const pos = e.x !== undefined ? e : this.getPointerPos(e);
        this.isDrawing = true;
        this.startX = pos.x;
        this.startY = pos.y;

        if (this.currentTool === 'stepPin') {
            this.drawStepPin(pos.x, pos.y, this.stepCounter++);
            this.saveState();
            this.isDrawing = false;
        } else if (this.currentTool === 'laser') {
            this.laserPos = { x: pos.x, y: pos.y, visible: true, pulseRadius: 5 };
        } else if (this.currentTool === 'pen') {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.strokeWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        }
    }

    handlePointerMove(e) {
        const pos = e.x !== undefined ? e : this.getPointerPos(e);

        if (this.currentTool === 'laser') {
            this.laserPos.x = pos.x;
            this.laserPos.y = pos.y;
            this.laserPos.visible = true;
            return;
        }

        if (!this.isDrawing) return;

        if (this.currentTool === 'pen') {
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        } else if (this.currentTool === 'arrow' || this.currentTool === 'caliper' || this.currentTool === 'dangerZone') {
            this.restoreToLastState();
            if (this.currentTool === 'arrow') {
                this.drawArrow(this.startX, this.startY, pos.x, pos.y);
            } else if (this.currentTool === 'caliper') {
                this.drawCaliper(this.startX, this.startY, pos.x, pos.y);
            } else if (this.currentTool === 'dangerZone') {
                this.drawDangerZone(this.startX, this.startY, pos.x, pos.y);
            }
        }
    }

    handlePointerUp(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.saveState();
    }

    handlePointerLeave() {
        if (this.currentTool === 'laser') {
            this.laserPos.visible = false;
        }
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    // Geometry & Drawing Helpers
    drawArrow(fromX, fromY, toX, toY) {
        const headLength = 16;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        this.ctx.save();
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.lineWidth = this.strokeWidth + 1;
        this.ctx.lineCap = 'round';

        // Main line
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        // Arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    drawCaliper(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distancePx = Math.sqrt(dx * dx + dy * dy);
        // Calibrated estimate: ~10px = 1mm at surgical optical zoom
        const distanceMm = (distancePx / 9.5).toFixed(1);
        const angle = Math.atan2(dy, dx);
        const tickLength = 12;

        this.ctx.save();
        this.ctx.strokeStyle = '#FFE600'; // High-visibility yellow for measurements
        this.ctx.fillStyle = '#FFE600';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 2]);

        // Dimension line
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
        // Perpendicular end ticks
        const drawTick = (x, y) => {
            this.ctx.beginPath();
            this.ctx.moveTo(x - tickLength * Math.cos(angle + Math.PI / 2), y - tickLength * Math.sin(angle + Math.PI / 2));
            this.ctx.lineTo(x + tickLength * Math.cos(angle + Math.PI / 2), y + tickLength * Math.sin(angle + Math.PI / 2));
            this.ctx.stroke();
        };

        drawTick(fromX, fromY);
        drawTick(toX, toY);

        // Distance Tag Badge
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2 - 12;

        this.ctx.fillStyle = 'rgba(11, 19, 43, 0.9)';
        this.ctx.strokeStyle = '#FFE600';
        this.ctx.lineWidth = 1;
        const tagText = `${distanceMm} mm`;
        this.ctx.font = 'bold 12px "JetBrains Mono", monospace';
        const textWidth = this.ctx.measureText(tagText).width;

        this.ctx.fillRect(midX - textWidth / 2 - 6, midY - 10, textWidth + 12, 20);
        this.ctx.strokeRect(midX - textWidth / 2 - 6, midY - 10, textWidth + 12, 20);

        this.ctx.fillStyle = '#FFE600';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(tagText, midX, midY);

        this.ctx.restore();
    }

    drawDangerZone(fromX, fromY, toX, toY) {
        const radius = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // Translucent danger red
        this.ctx.strokeStyle = '#EF4444';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 3]);

        this.ctx.beginPath();
        this.ctx.arc(fromX, fromY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Danger Warning Tag
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = '#EF4444';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠ VASCULAR DANGER ZONE', fromX, fromY - radius - 6);

        this.ctx.restore();
    }

    drawStepPin(x, y, stepNum) {
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowBlur = 8;

        // Outer Glow Circle
        this.ctx.fillStyle = '#FF6B4A'; // Warm Coral
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.arc(x, y, 14, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Number
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(stepNum.toString(), x, y);

        this.ctx.restore();
    }

    // State Stack (Undo / Redo)
    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyStep--;
        }
        this.updateUndoRedoUI();
    }

    restoreToLastState() {
        if (this.historyStep >= 0 && this.history[this.historyStep]) {
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
        }
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
            this.updateUndoRedoUI();
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
            this.updateUndoRedoUI();
        }
    }

    clearTelestration() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.stepCounter = 1;
        this.saveState();
    }

    updateUndoRedoUI() {
        const undoBtn = document.getElementById('orUndoBtn');
        const redoBtn = document.getElementById('orRedoBtn');
        if (undoBtn) undoBtn.disabled = this.historyStep <= 0;
        if (redoBtn) redoBtn.disabled = this.historyStep >= this.history.length - 1;
    }

    // Realistic Simulated Medical Video Feeds
    renderSimulatedFeed() {
        const w = this.bgCanvas.width;
        const h = this.bgCanvas.height;
        const ctx = this.bgCtx;

        ctx.clearRect(0, 0, w, h);

        if (this.activeFeed === 'laparoscopic') {
            // Laparoscopic High-Definition Abdominal Cavity Simulation
            const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w / 1.5);
            grad.addColorStop(0, '#5C1D24'); // Liver/Peritoneal deep crimson
            grad.addColorStop(0.4, '#381216');
            grad.addColorStop(0.8, '#1E0A0D');
            grad.addColorStop(1, '#08080C'); // Optical vignetting
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Anatomical Structures (Liver edge, gallbladder bed, peritoneal fold)
            ctx.fillStyle = '#8B2635';
            ctx.beginPath();
            ctx.ellipse(w * 0.45, h * 0.35, w * 0.32, h * 0.22, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Hepatic vein highlights
            ctx.strokeStyle = 'rgba(70, 130, 180, 0.4)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(w * 0.3, h * 0.25);
            ctx.bezierCurveTo(w * 0.4, h * 0.3, w * 0.45, h * 0.4, w * 0.52, h * 0.45);
            ctx.stroke();

            // Calot's Triangle Target Zone
            ctx.fillStyle = '#6B8E23'; // Gallbladder fundus greenish-amber
            ctx.beginPath();
            ctx.ellipse(w * 0.62, h * 0.48, w * 0.12, h * 0.18, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Laparoscopic Grasper & Hook Cautery Silhouette
            ctx.strokeStyle = '#D1D5DB';
            ctx.lineWidth = 14;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            ctx.moveTo(w * 0.95, h * 0.88);
            ctx.lineTo(w * 0.68, h * 0.58);
            ctx.stroke();

            // Metallic Cautery Tip
            ctx.fillStyle = '#9CA3AF';
            ctx.beginPath();
            ctx.arc(w * 0.68, h * 0.58, 6, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.activeFeed === 'overhead') {
            // Open Surgical Field / Draped Operative Field
            ctx.fillStyle = '#0F2C3A'; // Surgical teal drape
            ctx.fillRect(0, 0, w, h);

            // Incision Opening (Fenestrated Drape Aperture)
            ctx.fillStyle = '#D4A373'; // Skin tone
            ctx.beginPath();
            ctx.roundRect(w * 0.25, h * 0.2, w * 0.5, h * 0.6, 20);
            ctx.fill();

            // Burn Contracture Scar Line (Z-Plasty Template)
            ctx.strokeStyle = '#B91C1C';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(w * 0.5, h * 0.28);
            ctx.lineTo(w * 0.5, h * 0.72); // Central contracture limb
            ctx.stroke();

            // Dotted Lateral Limbs
            ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(w * 0.5, h * 0.28);
            ctx.lineTo(w * 0.38, h * 0.42); // Upper 60-deg limb
            ctx.moveTo(w * 0.5, h * 0.72);
            ctx.lineTo(w * 0.62, h * 0.58); // Lower 60-deg limb
            ctx.stroke();
            ctx.setLineDash([]);

            // Retractors & Towel Clamps
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(w * 0.2, h * 0.45);
            ctx.lineTo(w * 0.28, h * 0.45);
            ctx.moveTo(w * 0.8, h * 0.45);
            ctx.lineTo(w * 0.72, h * 0.45);
            ctx.stroke();

        } else if (this.activeFeed === 'pocus') {
            // Point-of-Care Ultrasound (POCUS) Sector Scan
            ctx.fillStyle = '#05070B';
            ctx.fillRect(0, 0, w, h);

            // Ultrasound Fan Sector
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(w * 0.5, h * 0.1);
            ctx.arc(w * 0.5, h * 0.1, h * 0.8, Math.PI * 0.3, Math.PI * 0.7);
            ctx.closePath();
            ctx.clip();

            // Speckle Noise & Anatomical Hyperechoic Lines
            const scanGrad = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.9);
            scanGrad.addColorStop(0, '#2D3748');
            scanGrad.addColorStop(0.3, '#1A202C');
            scanGrad.addColorStop(0.6, '#4A5568');
            scanGrad.addColorStop(1, '#171923');
            ctx.fillStyle = scanGrad;
            ctx.fillRect(0, 0, w, h);

            // Peritoneal stripe / FAST Exam fluid collection
            ctx.fillStyle = '#000000'; // Anechoic free fluid
            ctx.beginPath();
            ctx.ellipse(w * 0.48, h * 0.55, w * 0.14, h * 0.08, -0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w * 0.35, h * 0.48);
            ctx.quadraticCurveTo(w * 0.5, h * 0.5, w * 0.65, h * 0.46);
            ctx.stroke();

            ctx.restore();

            // POCUS Depth & Gain Scale
            ctx.fillStyle = '#00E5CC';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillText('DEPTH: 14cm | GAIN: 52dB | FAST MORISON POUCH', 16, 24);
        }

        // Overlay Clinical Telemetry Watermark
        this.renderFeedWatermark();
    }

    renderFeedWatermark() {
        const ctx = this.bgCtx;
        const w = this.bgCanvas.width;
        const h = this.bgCanvas.height;

        ctx.save();
        // Timecode & Case ID
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(12, h - 34, 320, 24);

        ctx.fillStyle = '#00E5CC';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        ctx.fillText(`SURGEDGE LIVE | CASE #SD-2026-08 | ${timeStr} UTC`, 20, h - 18);

        // Mentor Active Presence Indicator
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)'; // Green live dot
        ctx.beginPath();
        ctx.arc(w - 120, 20, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('MENTOR CONNECTED', w - 108, 23);

        ctx.restore();
    }

    // Laser Spotlight Animation
    startLaserAnimation() {
        const animate = () => {
            if (this.currentTool === 'laser' && this.laserPos.visible) {
                this.restoreToLastState();

                this.ctx.save();
                this.laserPos.pulseRadius = (this.laserPos.pulseRadius + 0.4) % 18;

                // Pulsing outer ripple ring
                this.ctx.strokeStyle = 'rgba(0, 229, 204, ' + (1 - this.laserPos.pulseRadius / 18) + ')';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(this.laserPos.x, this.laserPos.y, this.laserPos.pulseRadius + 6, 0, Math.PI * 2);
                this.ctx.stroke();

                // Core brilliant laser dot
                this.ctx.fillStyle = '#00E5CC';
                this.ctx.shadowColor = '#00E5CC';
                this.ctx.shadowBlur = 12;
                this.ctx.beginPath();
                this.ctx.arc(this.laserPos.x, this.laserPos.y, 5, 0, Math.PI * 2);
                this.ctx.fill();

                // Mentor pointer label
                this.ctx.fillStyle = 'rgba(11, 19, 43, 0.9)';
                this.ctx.fillRect(this.laserPos.x + 10, this.laserPos.y - 12, 115, 18);
                this.ctx.fillStyle = '#00E5CC';
                this.ctx.font = 'bold 9px sans-serif';
                this.ctx.fillText('DR. ALAA (MENTOR)', this.laserPos.x + 14, this.laserPos.y);

                this.ctx.restore();
            }
            this.laserAnimId = requestAnimationFrame(animate);
        };
        animate();
    }

    // Real-Time Patient Vitals Simulator
    startVitalsSimulation() {
        if (!this.vitalsCanvas || !this.vitalsCtx) return;

        let x = 0;
        const width = this.vitalsCanvas.width;
        const height = this.vitalsCanvas.height;
        const midY = height / 2;

        const drawEcg = () => {
            this.vitalsCtx.fillStyle = 'rgba(11, 19, 43, 0.15)';
            this.vitalsCtx.fillRect(0, 0, width, height);

            this.vitalsCtx.strokeStyle = '#10B981'; // Medical Pulse Green
            this.vitalsCtx.lineWidth = 2;
            this.vitalsCtx.beginPath();

            // Realistic P-Q-R-S-T ECG Waveform Generator
            const cycle = x % 120;
            let y = midY;

            if (cycle > 20 && cycle <= 30) {
                // P Wave
                y = midY - 6 * Math.sin(((cycle - 20) / 10) * Math.PI);
            } else if (cycle > 40 && cycle <= 44) {
                // Q Dip
                y = midY + 4;
            } else if (cycle > 44 && cycle <= 50) {
                // R Peak (Tall ventricular depolarization)
                y = midY - 24;
            } else if (cycle > 50 && cycle <= 54) {
                // S Dip
                y = midY + 8;
            } else if (cycle > 65 && cycle <= 80) {
                // T Wave (Ventricular repolarization)
                y = midY - 9 * Math.sin(((cycle - 65) / 15) * Math.PI);
            }

            this.vitalsCtx.lineTo(x % width, y);
            this.vitalsCtx.stroke();

            x += 2;
            this.vitalsAnimId = requestAnimationFrame(drawEcg);
        };

        drawEcg();

        // Slight natural physiological fluctuations
        setInterval(() => {
            this.vitals.hr = 74 + Math.floor(Math.random() * 5);
            this.vitals.spo2 = 98 + Math.floor(Math.random() * 2);
            this.updateVitalsUI();
        }, 3000);
    }

    updateVitalsUI() {
        const hrEl = document.getElementById('vitalHrVal');
        const spo2El = document.getElementById('vitalSpo2Val');
        const bpEl = document.getElementById('vitalBpVal');
        const etco2El = document.getElementById('vitalEtco2Val');

        if (hrEl) hrEl.textContent = this.vitals.hr;
        if (spo2El) spo2El.textContent = `${this.vitals.spo2}%`;
        if (bpEl) bpEl.textContent = `${this.vitals.bpSys}/${this.vitals.bpDia}`;
        if (etco2El) etco2El.textContent = `${this.vitals.etco2} mmHg`;
    }

    // Network Throttling Simulation
    setNetworkPreset(presetKey) {
        if (!this.networkPresets[presetKey]) return;
        this.currentNetwork = presetKey;
        this.updateNetworkUI();

        // Notify user via toast
        if (window.showAppToast) {
            window.showAppToast(`Network Profile Switched: ${this.networkPresets[presetKey].name}`, 'info');
        }
    }

    updateNetworkUI() {
        const preset = this.networkPresets[this.currentNetwork];
        const resEl = document.getElementById('netResVal');
        const bitrateEl = document.getElementById('netBitrateVal');
        const latencyEl = document.getElementById('netLatencyVal');
        const packetLossEl = document.getElementById('netLossVal');
        const badgeEl = document.getElementById('globalNetworkBadge');

        if (resEl) resEl.textContent = preset.resolution;
        if (bitrateEl) bitrateEl.textContent = preset.bitrate;
        if (latencyEl) latencyEl.textContent = preset.latency;
        if (packetLossEl) packetLossEl.textContent = preset.packetLoss;

        if (badgeEl) {
            badgeEl.className = `network-badge net-${this.currentNetwork}`;
            badgeEl.innerHTML = `<span class="pulse-dot"></span> ${preset.name} (${preset.latency})`;
        }
    }

    // Case Log Milestones
    initDefaultLogs() {
        this.addCaseLog("Session initialized. Dual-feed WebRTC established.", "13:20:14 UTC");
        this.addCaseLog("Field surgeon requested geometric Z-plasty limb alignment verification.", "13:22:05 UTC");
        this.addCaseLog("Mentor verified 60-degree incision vectors with AR caliper.", "13:24:30 UTC");
    }

    addCaseLog(text, customTime = null) {
        const time = customTime || new Date().toTimeString().split(' ')[0] + ' UTC';
        this.caseLogs.push({ time, text });
        this.renderCaseLogs();
    }

    renderCaseLogs() {
        const logContainer = document.getElementById('orCaseLogList');
        if (!logContainer) return;

        logContainer.innerHTML = this.caseLogs.map(log => `
            <div class="case-log-item">
                <span class="log-time">${log.time}</span>
                <span class="log-text">${log.text}</span>
            </div>
        `).join('');

        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Snapshot Export (Combines surgical background and telestration layer)
    exportSnapshot() {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width;
        exportCanvas.height = this.canvas.height;
        const expCtx = exportCanvas.getContext('2d');

        // Draw Background Video Frame
        expCtx.drawImage(this.bgCanvas, 0, 0);
        // Draw AR Telestration Overlay
        expCtx.drawImage(this.canvas, 0, 0);

        // Watermark Banner
        expCtx.fillStyle = 'rgba(8, 14, 26, 0.9)';
        expCtx.fillRect(0, 0, exportCanvas.width, 30);
        expCtx.fillStyle = '#00E5CC';
        expCtx.font = 'bold 12px sans-serif';
        expCtx.fillText('SURGEDGE TELE-SURGERY AUDIT SNAPSHOT | BABSON GLOBAL SURGERY SLINGSHOT | AMODISC LTD', 16, 20);

        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `SurgEdge_Telestration_Case_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        if (window.showAppToast) {
            window.showAppToast('Surgical Telestration Snapshot Exported Successfully', 'success');
        }
    }
}

// Global initialization
if (typeof window !== "undefined") {
    window.VirtualORSuite = VirtualORSuite;
}
