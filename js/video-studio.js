/**
 * SurgEdge Platform - Surgical Education Academy & Faculty Dashboard Engine
 * Standardized Curriculum Player, AR Telestration, IndexedDB Video Persistence, and Tele-Guidance Dashboard
 */

// ═══════════════════════════════════════════════════════════════════════════
// INDEXED-DB PERSISTENT SURGICAL VIDEO STORAGE ENGINE
// ═══════════════════════════════════════════════════════════════════════════
const SurgEdgeDB = {
    dbName: 'SurgEdge_Operative_Videos_DB_v2',
    storeName: 'uploaded_videos',
    version: 1,

    open() {
        return new Promise((resolve, reject) => {
            try {
                if (!window.indexedDB) {
                    console.warn('IndexedDB not supported');
                    return resolve(null);
                }
                const req = indexedDB.open(this.dbName, this.version);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'id' });
                    }
                };
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = (e) => {
                    console.warn('IndexedDB open error:', e.target.error);
                    resolve(null);
                };
            } catch (err) {
                console.warn('IndexedDB exception:', err);
                resolve(null);
            }
        });
    },

    async save(record) {
        try {
            const db = await this.open();
            if (!db) return false;
            return new Promise((resolve) => {
                try {
                    const tx = db.transaction(this.storeName, 'readwrite');
                    const store = tx.objectStore(this.storeName);
                    // Save clean cloneable record with blob
                    const cleanRecord = {
                        id: record.id,
                        title: record.title,
                        specialty: record.specialty,
                        author: record.author,
                        duration: record.duration,
                        description: record.description,
                        blob: record.blob,
                        fileName: record.fileName,
                        fileSize: record.fileSize,
                        isUploaded: true,
                        createdAt: record.createdAt || Date.now(),
                        chapters: record.chapters
                    };
                    const req = store.put(cleanRecord);
                    req.onsuccess = () => resolve(true);
                    req.onerror = () => resolve(false);
                } catch (e) {
                    resolve(false);
                }
            });
        } catch (err) {
            return false;
        }
    },

    async getAll() {
        try {
            const db = await this.open();
            if (!db) return [];
            return new Promise((resolve) => {
                try {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const store = tx.objectStore(this.storeName);
                    const req = store.getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => resolve([]);
                } catch (e) {
                    resolve([]);
                }
            });
        } catch (err) {
            return [];
        }
    },

    async delete(id) {
        try {
            const db = await this.open();
            if (!db) return false;
            return new Promise((resolve) => {
                try {
                    const tx = db.transaction(this.storeName, 'readwrite');
                    const store = tx.objectStore(this.storeName);
                    const req = store.delete(id);
                    req.onsuccess = () => resolve(true);
                    req.onerror = () => resolve(false);
                } catch (e) {
                    resolve(false);
                }
            });
        } catch (err) {
            return false;
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SURGICAL ACADEMY ENGINE
// ═══════════════════════════════════════════════════════════════════════════
class SurgicalAcademyEngine {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#38BDF8';
        this.strokeWidth = 3;
        this.isPlaying = false;
        this.activeModuleData = null;
        this.isFacultyLoggedIn = false;

        // Upload state
        this.uploadedVideoFile = null;
        this.uploadedVideoBlobUrl = null;
        this.uploadedVideoThumbnail = null;
        this.uploadedVideoDuration = "15:00";
    }

    async init() {
        this.video = document.getElementById('curriculumVideoPlayer');
        this.canvas = document.getElementById('curriculumTelestrationCanvas');

        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupPlaybackControls();
            this.setupCanvasDrawing();
            this.renderCurriculumCatalog();

            // Load initial module in memory first
            const defaultMod = (window.SURGEDGE_DATA && window.SURGEDGE_DATA.trainingVideos && window.SURGEDGE_DATA.trainingVideos[0]);
            if (defaultMod) {
                this.loadCurriculumModule(defaultMod);
            }

            this.setupCurriculumDirectUpload();
            window.addEventListener('resize', () => this.resizeCanvas());
        }

        // Restore all uploaded videos from IndexedDB
        await this.restorePersistedVideosFromDB();

        this.setupFacultyDashboard();
        this.setupVideoUploadZone();
        this.setupAuthModalListeners();
    }

    async restorePersistedVideosFromDB() {
        if (!window.SURGEDGE_DATA || !window.SURGEDGE_DATA.trainingVideos) return;

        try {
            const savedRecords = await SurgEdgeDB.getAll();
            if (savedRecords && savedRecords.length > 0) {
                savedRecords.forEach(rec => {
                    if (rec.blob) {
                        rec.videoUrl = URL.createObjectURL(rec.blob);
                    }
                    if (!window.SURGEDGE_DATA.trainingVideos.some(v => v.id === rec.id)) {
                        window.SURGEDGE_DATA.trainingVideos.unshift(rec);
                    }
                });

                this.renderCurriculumCatalog();

                // Select the most recent uploaded video if available
                const latestUploaded = window.SURGEDGE_DATA.trainingVideos.find(v => v.isUploaded);
                if (latestUploaded) {
                    this.selectCurriculumModule(latestUploaded.id);
                }
            }
        } catch (e) {
            console.warn('Could not restore videos from DB:', e);
        }
    }

    resizeCanvas() {
        if (!this.canvas || !this.video) return;
        const rect = this.video.getBoundingClientRect();
        this.canvas.width = rect.width || 800;
        this.canvas.height = rect.height || 450;
    }

    /* --- CURRICULUM PLAYER CONTROLS --- */
    setupPlaybackControls() {
        const playBtn = document.getElementById('studioPlayBtn');
        const seekBar = document.getElementById('studioSeekBar');
        const timeDisplay = document.getElementById('studioTimeDisplay');
        const speedSelect = document.getElementById('studioSpeedSelect');
        const stepPrevBtn = document.getElementById('studioStepPrevBtn');
        const stepNextBtn = document.getElementById('studioStepNextBtn');

        if (playBtn && this.video) {
            playBtn.addEventListener('click', () => {
                if (this.video.paused) {
                    this.video.play().catch(() => {});
                    playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                    this.isPlaying = true;
                } else {
                    this.video.pause();
                    playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;margin-left:2px;"><polygon points="5,3 19,12 5,21"/></svg>';
                    this.isPlaying = false;
                }
            });
        }

        if (this.video) {
            this.video.addEventListener('timeupdate', () => {
                if (seekBar && this.video.duration) {
                    seekBar.value = (this.video.currentTime / this.video.duration) * 100;
                }
                if (timeDisplay) {
                    timeDisplay.textContent = `${this.formatTime(this.video.currentTime)} / ${this.formatTime(this.video.duration || 0)}`;
                }
            });

            this.video.addEventListener('loadedmetadata', () => {
                this.resizeCanvas();
                if (timeDisplay) {
                    timeDisplay.textContent = `00:00 / ${this.formatTime(this.video.duration || 0)}`;
                }
            });

            this.video.addEventListener('ended', () => {
                if (playBtn) {
                    playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;margin-left:2px;"><polygon points="5,3 19,12 5,21"/></svg>';
                }
                this.isPlaying = false;
            });
        }

        if (seekBar && this.video) {
            seekBar.addEventListener('input', () => {
                if (this.video.duration) {
                    this.video.currentTime = (seekBar.value / 100) * this.video.duration;
                }
            });
        }

        if (speedSelect && this.video) {
            speedSelect.addEventListener('change', (e) => {
                this.video.playbackRate = parseFloat(e.target.value);
            });
        }

        if (stepPrevBtn && this.video) {
            stepPrevBtn.addEventListener('click', () => {
                this.video.pause();
                this.video.currentTime = Math.max(0, this.video.currentTime - (1 / 30));
                if (playBtn) {
                    playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;margin-left:2px;"><polygon points="5,3 19,12 5,21"/></svg>';
                }
            });
        }

        if (stepNextBtn && this.video) {
            stepNextBtn.addEventListener('click', () => {
                this.video.pause();
                this.video.currentTime = Math.min(this.video.duration || 1000, this.video.currentTime + (1 / 30));
                if (playBtn) {
                    playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;margin-left:2px;"><polygon points="5,3 19,12 5,21"/></svg>';
                }
            });
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    seekToChapter(timeStr) {
        if (!this.video) return;
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            this.video.currentTime = sec;
        }
    }

    renderCurriculumCatalog() {
        const container = document.getElementById('preloadedVideosList');
        const countTag = document.getElementById('moduleCountTag');
        if (!container || !window.SURGEDGE_DATA || !window.SURGEDGE_DATA.trainingVideos) return;

        const videos = window.SURGEDGE_DATA.trainingVideos;
        if (countTag) {
            countTag.textContent = `${videos.length} modules`;
        }

        container.innerHTML = videos.map((mod, idx) => `
            <div class="curriculum-module-card ${this.activeModuleData && this.activeModuleData.id === mod.id ? 'active' : (idx === 0 && !this.activeModuleData ? 'active' : '')}" onclick="window.videoStudio.selectCurriculumModule('${mod.id}')" data-id="${mod.id}">
                ${mod.isUploaded ? `<button class="module-delete-btn" onclick="event.stopPropagation(); window.videoStudio.deleteUploadedVideo('${mod.id}')" title="Delete this uploaded video">🗑</button>` : ''}
                <div class="module-thumb-wrapper">
                    <img src="${mod.thumbnail || 'assets/images/orthopedic_training_ar.jpg'}" alt="${mod.title}" class="module-thumb-img">
                    <span class="module-duration-badge">${mod.duration || '15:00'}</span>
                </div>
                <div class="module-info-block">
                    <h4 class="module-title">${mod.title} ${mod.isUploaded ? '<span class="uploaded-badge-tag">Uploaded</span>' : ''}</h4>
                    <span class="module-spec-tag">${mod.specialty}</span>
                    <span class="module-author">${mod.author}</span>
                </div>
            </div>
        `).join('');
    }

    selectCurriculumModule(modId) {
        const mod = window.SURGEDGE_DATA.trainingVideos.find(v => v.id === modId);
        if (!mod) return;

        document.querySelectorAll('.curriculum-module-card').forEach(c => {
            c.classList.toggle('active', c.dataset.id === modId);
        });

        this.loadCurriculumModule(mod);

        if (window.showAppToast) {
            window.showAppToast(`Loaded: ${mod.title}`, 'info');
        }
    }

    loadCurriculumModule(mod) {
        this.activeModuleData = mod;
        const titleEl = document.getElementById('studioVideoTitleDisplay');
        const specEl = document.getElementById('studioVideoSpecDisplay');
        const descEl = document.getElementById('studioVideoDescDisplay');
        const chapterListEl = document.getElementById('studioChapterList');
        const playBtn = document.getElementById('studioPlayBtn');

        if (this.video) {
            if (mod.videoUrl) {
                this.video.removeAttribute('poster');
                this.video.src = mod.videoUrl;
                this.video.load();
                this.video.play().then(() => {
                    if (playBtn) {
                        playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                    }
                    this.isPlaying = true;
                }).catch(() => {});
            } else {
                this.video.removeAttribute('src');
                if (mod.thumbnail) {
                    this.video.poster = mod.thumbnail;
                }
            }
        }

        if (titleEl) {
            titleEl.innerHTML = `${mod.title} ${mod.isUploaded ? `<button class="btn-delete-case" onclick="window.videoStudio.deleteUploadedVideo('${mod.id}')">🗑 Delete Case</button>` : ''}`;
        }
        if (specEl) specEl.textContent = `${mod.specialty} • ${mod.author}`;
        if (descEl) descEl.textContent = mod.description;

        if (chapterListEl && mod.chapters) {
            chapterListEl.innerHTML = mod.chapters.map(ch => `
                <div class="chapter-step-row" onclick="window.videoStudio.seekToChapter('${ch.time}')">
                    <span class="step-num-pill">${ch.time}</span>
                    <span>${ch.title}</span>
                </div>
            `).join('');
        }

        this.clearCanvas();
    }

    /* --- DELETE UPLOADED VIDEO ENGINE --- */
    async deleteUploadedVideo(modId) {
        if (!confirm('Are you sure you want to delete this operative video from your library?')) return;

        // 1. Delete from IndexedDB
        await SurgEdgeDB.delete(modId);

        // 2. Remove from local trainingVideos array
        const idx = window.SURGEDGE_DATA.trainingVideos.findIndex(v => v.id === modId);
        if (idx !== -1) {
            const removed = window.SURGEDGE_DATA.trainingVideos.splice(idx, 1)[0];
            if (removed && removed.videoUrl && removed.videoUrl.startsWith('blob:')) {
                URL.revokeObjectURL(removed.videoUrl);
            }
        }

        // 3. Re-render catalog
        this.renderCurriculumCatalog();

        // 4. Switch back to remaining video
        const fallbackMod = window.SURGEDGE_DATA.trainingVideos[0];
        if (fallbackMod) {
            this.selectCurriculumModule(fallbackMod.id);
        }

        if (window.showAppToast) {
            window.showAppToast('🗑 Operative video deleted from library.', 'warning');
        }
    }

    setupCanvasDrawing() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.strokeWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        });

        this.canvas.addEventListener('mouseup', () => { this.isDrawing = false; });
        this.canvas.addEventListener('mouseleave', () => { this.isDrawing = false; });

        const toolBtns = document.querySelectorAll('.curriculum-tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'studioClearCanvasBtn' || btn.id === 'studioExportSnapshotBtn' || btn.classList.contains('upload-tool-btn')) return;
                toolBtns.forEach(b => {
                    if (b.id !== 'studioClearCanvasBtn' && b.id !== 'studioExportSnapshotBtn' && !b.classList.contains('upload-tool-btn')) {
                        b.classList.remove('active');
                    }
                });
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool || 'pen';
            });
        });

        const swatches = document.querySelectorAll('.curriculum-color-swatch');
        swatches.forEach(s => {
            s.addEventListener('click', () => {
                swatches.forEach(sw => sw.classList.remove('active'));
                s.classList.add('active');
                this.currentColor = s.dataset.color || '#38BDF8';
            });
        });

        const clearBtn = document.getElementById('studioClearCanvasBtn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearCanvas());

        const exportBtn = document.getElementById('studioExportSnapshotBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportAnnotatedSnapshot());
    }

    clearCanvas() {
        if (!this.canvas || !this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    exportAnnotatedSnapshot() {
        if (!this.canvas) return;
        const outCanvas = document.createElement('canvas');
        outCanvas.width = this.canvas.width;
        outCanvas.height = this.canvas.height;
        const outCtx = outCanvas.getContext('2d');

        if (this.video && this.video.videoWidth) {
            outCtx.drawImage(this.video, 0, 0, outCanvas.width, outCanvas.height);
        } else {
            outCtx.fillStyle = '#0F172A';
            outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
        }

        outCtx.drawImage(this.canvas, 0, 0);

        outCtx.fillStyle = 'rgba(15, 76, 129, 0.95)';
        outCtx.fillRect(0, 0, outCanvas.width, 32);
        outCtx.fillStyle = '#FFFFFF';
        outCtx.font = 'bold 12px sans-serif';
        outCtx.fillText(`SURGEDGE SURGICAL ACADEMY | ${this.activeModuleData ? this.activeModuleData.title : 'CASE'}`, 14, 21);

        const dataUrl = outCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.download = `SurgEdge_Curriculum_Annotation_${Date.now()}.png`;
        a.href = dataUrl;
        a.click();

        if (window.showAppToast) {
            window.showAppToast('Surgical training annotation saved to downloads.', 'success');
        }
    }

    /* --- DIRECT VIDEO UPLOAD ENGINE & IMMEDIATE PLAYBACK --- */
    setupCurriculumDirectUpload() {
        const quickInput = document.getElementById('curriculumQuickUploadInput');
        const playerViewport = document.querySelector('.curriculum-player-viewport');

        const handleVideoFile = (file) => {
            if (!file) return;

            const objectUrl = URL.createObjectURL(file);
            const fileNameClean = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            const formattedTitle = fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

            const newModule = {
                id: 'uploaded-' + Date.now(),
                title: formattedTitle,
                specialty: 'Clinical Operative Case',
                author: 'Local Attending Surgeon',
                duration: 'Auto-Calibrated',
                description: `Operative video file: ${file.name} (${fileSizeMB} MB). Persisted in IndexedDB with interactive AR telestration, timeline stepping, and procedural chapters.`,
                videoUrl: objectUrl,
                blob: file,
                fileName: file.name,
                fileSize: file.size,
                thumbnail: 'assets/images/orthopedic_training_ar.jpg',
                isUploaded: true,
                createdAt: Date.now(),
                chapters: [
                    { time: '00:00', title: '1. Incision & Exposure' },
                    { time: '01:30', title: '2. Operative Field Isolation' },
                    { time: '03:15', title: '3. Procedural Resection / Realignment' },
                    { time: '05:45', title: '4. Closure & Hemostasis' }
                ]
            };

            // 1. Immediately insert into in-memory catalog
            if (window.SURGEDGE_DATA && window.SURGEDGE_DATA.trainingVideos) {
                window.SURGEDGE_DATA.trainingVideos.unshift(newModule);
            }

            // 2. Immediately render catalog and load into player
            this.renderCurriculumCatalog();
            this.loadCurriculumModule(newModule);

            // 3. Persist in background to IndexedDB
            SurgEdgeDB.save(newModule).then((saved) => {
                console.log('Video persisted to IndexedDB:', saved);
            }).catch((err) => {
                console.warn('IndexedDB background save error:', err);
            });

            if (window.showAppToast) {
                window.showAppToast(`🎉 Video "${file.name}" loaded and saved to library!`, 'success');
            }

            // Reset input so re-selecting same file works
            if (quickInput) quickInput.value = '';
        };

        if (quickInput) {
            quickInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleVideoFile(e.target.files[0]);
                }
            });
        }

        // Drag & Drop onto player
        if (playerViewport) {
            playerViewport.addEventListener('dragover', (e) => {
                e.preventDefault();
                playerViewport.classList.add('dragover');
            });
            playerViewport.addEventListener('dragleave', () => {
                playerViewport.classList.remove('dragover');
            });
            playerViewport.addEventListener('drop', (e) => {
                e.preventDefault();
                playerViewport.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleVideoFile(e.dataTransfer.files[0]);
                }
            });
        }
    }

    /* --- VIDEO UPLOAD STUDIO (FACULTY FORM) --- */
    setupVideoUploadZone() {
        const dropzone = document.getElementById('videoUploadDropzone');
        const fileInput = document.getElementById('pubVideoFileInput');
        const promptContent = document.getElementById('uploadDropzonePrompt');
        const previewCard = document.getElementById('uploadFilePreviewCard');
        const previewVideo = document.getElementById('uploadPreviewVideoEl');
        const previewFileName = document.getElementById('previewFileName');
        const previewFileMeta = document.getElementById('previewFileMeta');
        const previewFormatTag = document.getElementById('previewFormatTag');
        const removeBtn = document.getElementById('removeUploadedFileBtn');

        if (!dropzone || !fileInput) return;

        dropzone.addEventListener('click', (e) => {
            if (e.target.closest('#removeUploadedFileBtn')) return;
            if (!this.uploadedVideoFile) {
                fileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                this.handleVideoFileUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                this.handleVideoFileUpload(files[0]);
            }
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearUploadedFileState();
            });
        }

        const publishBtn = document.getElementById('publishVideoSubmitBtn');
        if (publishBtn) {
            publishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePublishCurriculumModule();
            });
        }
    }

    handleVideoFileUpload(file) {
        if (!file.type.startsWith('video/')) {
            if (window.showAppToast) window.showAppToast('Please select a valid operative video file.', 'error');
            return;
        }

        this.uploadedVideoFile = file;
        this.uploadedVideoBlobUrl = URL.createObjectURL(file);

        const promptContent = document.getElementById('uploadDropzonePrompt');
        const previewCard = document.getElementById('uploadFilePreviewCard');
        const previewVideo = document.getElementById('uploadPreviewVideoEl');
        const previewFileName = document.getElementById('previewFileName');
        const previewFileMeta = document.getElementById('previewFileMeta');
        const previewFormatTag = document.getElementById('previewFormatTag');

        if (promptContent) promptContent.style.display = 'none';
        if (previewCard) previewCard.style.display = 'flex';

        if (previewFileName) previewFileName.textContent = file.name;
        if (previewFileMeta) previewFileMeta.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB · Ready to Publish`;
        if (previewFormatTag) previewFormatTag.textContent = file.type.split('/')[1]?.toUpperCase() || 'MP4';

        if (previewVideo) {
            previewVideo.src = this.uploadedVideoBlobUrl;
            previewVideo.onloadedmetadata = () => {
                const dur = this.formatTime(previewVideo.duration);
                this.uploadedVideoDuration = dur;
                if (previewFileMeta) {
                    previewFileMeta.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB · ${dur} Duration`;
                }
            };
        }

        const titleInput = document.getElementById('pubVideoTitle');
        if (titleInput && !titleInput.value) {
            const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            titleInput.value = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }

        if (window.showAppToast) {
            window.showAppToast(`Video ${file.name} staged for publishing.`, 'info');
        }
    }

    clearUploadedFileState() {
        if (this.uploadedVideoBlobUrl) {
            URL.revokeObjectURL(this.uploadedVideoBlobUrl);
            this.uploadedVideoBlobUrl = null;
        }
        this.uploadedVideoFile = null;

        const promptContent = document.getElementById('uploadDropzonePrompt');
        const previewCard = document.getElementById('uploadFilePreviewCard');
        const previewVideo = document.getElementById('uploadPreviewVideoEl');
        const fileInput = document.getElementById('pubVideoFileInput');

        if (fileInput) fileInput.value = '';
        if (promptContent) promptContent.style.display = 'flex';
        if (previewCard) previewCard.style.display = 'none';
        if (previewVideo) {
            previewVideo.removeAttribute('src');
            previewVideo.load();
        }
    }

    async handlePublishCurriculumModule() {
        const titleInput = document.getElementById('pubVideoTitle');
        const specSelect = document.getElementById('pubVideoSpecialty');
        const authorInput = document.getElementById('pubVideoInstructor');
        const descInput = document.getElementById('pubVideoDescription');

        const title = titleInput ? titleInput.value.trim() : '';
        const specialty = specSelect ? specSelect.value : 'General Surgery';
        const author = authorInput ? authorInput.value.trim() : 'Attending Surgeon';
        const description = descInput ? descInput.value.trim() : 'Accredited operative case lecture.';

        if (!title) {
            if (window.showAppToast) window.showAppToast('Please enter an operative video title.', 'error');
            return;
        }

        const newId = 'module-' + Date.now();
        const newModule = {
            id: newId,
            title: title,
            specialty: specialty,
            author: author,
            duration: this.uploadedVideoDuration || '15:00',
            description: description,
            videoUrl: this.uploadedVideoBlobUrl || '',
            blob: this.uploadedVideoFile || null,
            thumbnail: 'assets/images/orthopedic_training_ar.jpg',
            isUploaded: true,
            createdAt: Date.now(),
            chapters: [
                { time: '00:00', title: '1. Incision & Sterile Prep' },
                { time: '02:00', title: '2. Anatomical Exposure' },
                { time: '05:30', title: '3. Main Operative Technique' },
                { time: '09:45', title: '4. Verification & Closure' }
            ]
        };

        if (this.uploadedVideoFile) {
            await SurgEdgeDB.save(newModule);
        }

        if (window.SURGEDGE_DATA && window.SURGEDGE_DATA.trainingVideos) {
            window.SURGEDGE_DATA.trainingVideos.unshift(newModule);
        }

        this.renderCurriculumCatalog();
        this.selectCurriculumModule(newId);

        if (titleInput) titleInput.value = '';
        if (authorInput) authorInput.value = '';
        if (descInput) descInput.value = '';
        this.clearUploadedFileState();

        const curriculumSec = document.getElementById('curriculum');
        if (curriculumSec) {
            curriculumSec.scrollIntoView({ behavior: 'smooth' });
        }

        if (window.showAppToast) {
            window.showAppToast(`🎉 "${title}" published permanently to Curriculum Library!`, 'success');
        }
    }

    /* --- FACULTY GATE & MODAL CONTROLS --- */
    setupFacultyDashboard() {
        const unlockBtn = document.getElementById('facultyGateUnlockBtn');
        const passInput = document.getElementById('facultyGatePasscode');

        if (unlockBtn && passInput) {
            unlockBtn.addEventListener('click', () => {
                const val = passInput.value.trim();
                if (val === 'slingshot2026') {
                    this.unlockFacultyDashboard();
                } else {
                    if (window.showAppToast) window.showAppToast('Invalid faculty passcode. Use slingshot2026', 'error');
                }
            });

            passInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') unlockBtn.click();
            });
        }
    }

    unlockFacultyDashboard() {
        this.isFacultyLoggedIn = true;
        const gate = document.getElementById('facultyLockedGate');
        const activeArea = document.getElementById('facultyDashboardActive');

        if (gate) gate.style.display = 'none';
        if (activeArea) activeArea.style.display = 'block';

        if (window.showAppToast) {
            window.showAppToast('Faculty portal unlocked. Access granted.', 'success');
        }
    }

    setupAuthModalListeners() {
        const modal = document.getElementById('facultyLoginModal');
        const openBtns = document.querySelectorAll('.open-faculty-modal-btn');
        const closeBtn = document.getElementById('closeFacultyModalBtn');
        const modalPass = document.getElementById('modalFacultyPasscode');
        const modalSubmit = document.getElementById('modalFacultyLoginSubmit');

        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (modal) modal.classList.add('active');
            });
        });

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        }

        if (modalSubmit && modalPass) {
            modalSubmit.addEventListener('click', () => {
                if (modalPass.value.trim() === 'slingshot2026') {
                    if (modal) modal.classList.remove('active');
                    this.unlockFacultyDashboard();
                    const dashSec = document.getElementById('facultyDashboard');
                    if (dashSec) dashSec.scrollIntoView({ behavior: 'smooth' });
                } else {
                    if (window.showAppToast) window.showAppToast('Incorrect passcode. Use slingshot2026', 'error');
                }
            });
        }
    }
}

// Global Class Exports
window.SurgicalAcademyEngine = SurgicalAcademyEngine;
window.SurgicalVideoStudio = SurgicalAcademyEngine;

// Global Init Function
window.initSurgicalAcademy = function() {
    if (!window.videoStudio) {
        window.videoStudio = new SurgicalAcademyEngine();
        window.videoStudio.init();
    }
};

// Auto-run if DOM is already loaded or on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initSurgicalAcademy());
} else {
    window.initSurgicalAcademy();
}
