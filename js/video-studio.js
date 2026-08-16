/**
 * SurgEdge Platform - Surgical Education Academy & Faculty Dashboard Engine
 * Standardized Curriculum Player, AR Telestration, Video Upload Studio, and Faculty Tele-Guidance Dashboard
 */

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

    init() {
        this.video = document.getElementById('curriculumVideoPlayer');
        this.canvas = document.getElementById('curriculumTelestrationCanvas');

        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupPlaybackControls();
            this.setupCanvasDrawing();
            this.renderCurriculumCatalog();

            // Load first default surgical module (AR Knee Surgery)
            const defaultMod = (window.SURGEDGE_DATA && window.SURGEDGE_DATA.trainingVideos && window.SURGEDGE_DATA.trainingVideos[0]);
            if (defaultMod) {
                this.loadCurriculumModule(defaultMod);
            }

            this.setupCurriculumDirectUpload();
            window.addEventListener('resize', () => this.resizeCanvas());
        }

        this.setupFacultyDashboard();
        this.setupVideoUploadZone();
        this.setupAuthModalListeners();
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
            <div class="curriculum-module-card ${idx === 0 ? 'active' : ''}" onclick="window.videoStudio.selectCurriculumModule('${mod.id}')" data-id="${mod.id}">
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
            window.showAppToast(`Loaded procedural lecture: ${mod.title}`, 'info');
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
                this.video.src = mod.videoUrl;
                this.video.load();
            } else {
                this.video.removeAttribute('src');
                if (mod.thumbnail) {
                    this.video.poster = mod.thumbnail;
                }
            }

            if (playBtn) {
                playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;margin-left:2px;"><polygon points="5,3 19,12 5,21"/></svg>';
            }
            this.isPlaying = false;
        }

        if (titleEl) titleEl.textContent = mod.title;
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
                if (btn.id === 'studioClearCanvasBtn' || btn.id === 'studioExportSnapshotBtn') return;
                toolBtns.forEach(b => {
                    if (b.id !== 'studioClearCanvasBtn' && b.id !== 'studioExportSnapshotBtn') {
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

    /* --- DIRECT VIDEO UPLOAD ENGINE --- */
    setupCurriculumDirectUpload() {
        const quickInput = document.getElementById('curriculumQuickUploadInput');
        const quickBtn = document.getElementById('curriculumQuickUploadBtn');
        const browseBtn = document.getElementById('curriculumBrowseBtn');
        const dropBanner = document.getElementById('curriculumDropBanner');
        const playerViewport = document.querySelector('.curriculum-player-viewport');

        if (quickBtn && quickInput) {
            quickBtn.addEventListener('click', () => quickInput.click());
        }
        if (browseBtn && quickInput) {
            browseBtn.addEventListener('click', () => quickInput.click());
        }
        if (dropBanner && quickInput) {
            dropBanner.addEventListener('click', (e) => {
                if (e.target !== browseBtn) quickInput.click();
            });
        }

        const handleVideoFile = (file) => {
            if (!file || (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|avi|mkv|ogg)$/i))) {
                if (window.showAppToast) window.showAppToast('Please select a valid operative video file (.mp4, .webm, .mov).', 'error');
                return;
            }

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
                description: `Operative video file: ${file.name} (${fileSizeMB} MB). Loaded with interactive AR telestration, timeline stepping, and procedural chapters.`,
                videoUrl: objectUrl,
                thumbnail: 'assets/images/orthopedic_training_ar.jpg',
                isUploaded: true,
                chapters: [
                    { time: '00:00', title: '1. Incision & Exposure' },
                    { time: '01:30', title: '2. Operative Field Isolation' },
                    { time: '03:15', title: '3. Procedural Resection / Realignment' },
                    { time: '05:45', title: '4. Closure & Hemostasis' }
                ]
            };

            if (window.SURGEDGE_DATA && window.SURGEDGE_DATA.trainingVideos) {
                window.SURGEDGE_DATA.trainingVideos.unshift(newModule);
            }

            this.renderCurriculumCatalog();
            this.selectCurriculumModule(newModule.id);

            if (this.video) {
                this.video.src = objectUrl;
                this.video.load();
                this.video.play().then(() => {
                    const playBtn = document.getElementById('studioPlayBtn');
                    if (playBtn) {
                        playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                    }
                    this.isPlaying = true;
                }).catch(() => {});
            }

            if (window.showAppToast) {
                window.showAppToast(`🎉 Video "${file.name}" loaded into AR Player!`, 'success');
            }
        };

        if (quickInput) {
            quickInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleVideoFile(e.target.files[0]);
                }
            });
        }

        // Drag & Drop onto drop banner and player
        [dropBanner, playerViewport].forEach(zone => {
            if (!zone) return;
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('dragover');
            });
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('dragover');
            });
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleVideoFile(e.dataTransfer.files[0]);
                }
            });
        });
    }

    /* --- VIDEO UPLOAD STUDIO --- */
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

        // Click to browse
        dropzone.addEventListener('click', (e) => {
            if (e.target.closest('#removeUploadedFileBtn')) return;
            if (!this.uploadedVideoFile) {
                fileInput.click();
            }
        });

        // Drag & drop events
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
            if (e.target.files && e.target.files.length > 0) {
                this.handleVideoFileUpload(e.target.files[0]);
            }
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.resetUploadedVideo();
            });
        }
    }

    handleVideoFileUpload(file) {
        if (!file.type.startsWith('video/')) {
            if (window.showAppToast) {
                window.showAppToast('Please select a valid surgical video file (MP4, WebM, MOV).', 'error');
            }
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
        const titleInput = document.getElementById('pubLectureTitle');

        if (promptContent) promptContent.style.display = 'none';
        if (previewCard) previewCard.style.display = 'flex';

        if (previewFileName) previewFileName.textContent = file.name;
        if (previewFormatTag) {
            const ext = file.name.split('.').pop() || 'MP4';
            previewFormatTag.textContent = ext.toUpperCase();
        }

        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

        // Auto-fill title if empty
        if (titleInput && !titleInput.value) {
            const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            titleInput.value = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        }

        // Load preview and extract duration & frame thumbnail
        if (previewVideo) {
            previewVideo.src = this.uploadedVideoBlobUrl;
            previewVideo.onloadedmetadata = () => {
                const durFormatted = this.formatTime(previewVideo.duration);
                this.uploadedVideoDuration = durFormatted;
                if (previewFileMeta) {
                    previewFileMeta.textContent = `${sizeMB} MB • ${previewVideo.videoWidth}x${previewVideo.videoHeight} • ${durFormatted} duration`;
                }

                // Capture snapshot for thumbnail
                try {
                    previewVideo.currentTime = Math.min(1.0, previewVideo.duration / 2);
                } catch(e) {}
            };

            previewVideo.onseeked = () => {
                try {
                    const snapCanvas = document.createElement('canvas');
                    snapCanvas.width = 320;
                    snapCanvas.height = 180;
                    const snapCtx = snapCanvas.getContext('2d');
                    snapCtx.drawImage(previewVideo, 0, 0, 320, 180);
                    this.uploadedVideoThumbnail = snapCanvas.toDataURL('image/jpeg', 0.85);
                } catch(e) {}
            };
        }

        if (window.showAppToast) {
            window.showAppToast(`Video "${file.name}" ready for academy publishing.`, 'success');
        }
    }

    resetUploadedVideo() {
        this.uploadedVideoFile = null;
        this.uploadedVideoBlobUrl = null;
        this.uploadedVideoThumbnail = null;
        this.uploadedVideoDuration = "15:00";

        const fileInput = document.getElementById('pubVideoFileInput');
        const promptContent = document.getElementById('uploadDropzonePrompt');
        const previewCard = document.getElementById('uploadFilePreviewCard');
        const previewVideo = document.getElementById('uploadPreviewVideoEl');

        if (fileInput) fileInput.value = '';
        if (previewVideo) previewVideo.removeAttribute('src');
        if (promptContent) promptContent.style.display = 'flex';
        if (previewCard) previewCard.style.display = 'none';
    }

    /* --- FACULTY DASHBOARD & PUBLISHING STUDIO --- */
    setupFacultyDashboard() {
        const publishForm = document.getElementById('facultyPublishLectureForm');
        if (publishForm) {
            publishForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('pubLectureTitle')?.value || "Advanced Surgical Lecture";
                const spec = document.getElementById('pubSpecialty')?.value || "Orthopedic Surgery";
                const cme = document.getElementById('pubCmeHours')?.value || "3.0 AMA PRA Cat. 1";
                const objectives = document.getElementById('pubLearningObjectives')?.value || "";

                const chaptersList = objectives
                    ? objectives.split('\n').filter(o => o.trim()).map((obj, idx) => ({
                        time: `0${idx * 3}:00`,
                        title: obj.trim()
                    }))
                    : [
                        { time: "00:00", title: "Procedural Anatomy & Incision Planning" },
                        { time: "04:30", title: "Operative Execution & Landmark Guidance" },
                        { time: "11:00", title: "Hemostasis & Closure Verification" }
                    ];

                const newLecture = {
                    id: `mod-${Date.now()}`,
                    title: title,
                    specialty: spec,
                    duration: this.uploadedVideoDuration || "15:00",
                    author: "Hamdi Abdalkareem Abdalla (Faculty)",
                    thumbnail: this.uploadedVideoThumbnail || "assets/images/orthopedic_training_ar.jpg",
                    videoUrl: this.uploadedVideoBlobUrl || null,
                    description: `Accredited ${spec} procedural curriculum lecture (${cme}). Standardized operative guidance developed for low-resource district hospitals.`,
                    chapters: chaptersList
                };

                if (window.SURGEDGE_DATA && window.SURGEDGE_DATA.trainingVideos) {
                    window.SURGEDGE_DATA.trainingVideos.unshift(newLecture);
                    this.renderCurriculumCatalog();
                    this.selectCurriculumModule(newLecture.id);
                }

                // Add to Activity Feed
                const activityFeed = document.getElementById('facultyActivityFeed');
                if (activityFeed) {
                    const li = document.createElement('li');
                    li.className = 'activity-item';
                    li.innerHTML = `
                        <div class="activity-dot blue"></div>
                        <div class="activity-body">
                            <span class="activity-text"><strong>${title}</strong> (${spec}) published to Academy</span>
                            <span class="activity-time">Just now • Hamdi Abdalkareem</span>
                        </div>
                    `;
                    activityFeed.insertBefore(li, activityFeed.firstChild);
                }

                if (window.showAppToast) {
                    window.showAppToast(`🎉 Lecture "${title}" published & loaded into Curriculum Player!`, 'success');
                }

                // Reset form & upload zone
                publishForm.reset();
                this.resetUploadedVideo();

                // Scroll up smoothly to curriculum to view the loaded lecture
                const curriculumSection = document.getElementById('curriculum');
                if (curriculumSection) {
                    curriculumSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    /* --- FACULTY AUTHENTICATION MODAL --- */
    setupAuthModalListeners() {
        const authModal = document.getElementById('ownerAuthModal');
        const authForm = document.getElementById('ownerAuthForm');
        const closeBtn = document.getElementById('closeAuthModalBtn');
        const quickLoginBtn = document.getElementById('quickFacultyLoginBtn');

        if (closeBtn && authModal) {
            closeBtn.addEventListener('click', () => authModal.classList.remove('active'));
        }

        if (quickLoginBtn) {
            quickLoginBtn.addEventListener('click', () => {
                this.isFacultyLoggedIn = true;
                if (authModal) authModal.classList.remove('active');
                if (window.showAppToast) window.showAppToast('Faculty Access Verified: Welcome Hamdi Abdalkareem (Faculty Admin).', 'success');
                const dash = document.getElementById('faculty-dashboard');
                if (dash) {
                    dash.style.display = 'block';
                    dash.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.isFacultyLoggedIn = true;
                if (authModal) authModal.classList.remove('active');
                if (window.showAppToast) window.showAppToast('Faculty Authentication Successful.', 'success');
                const dash = document.getElementById('faculty-dashboard');
                if (dash) {
                    dash.style.display = 'block';
                    dash.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    openAuthModal() {
        if (window.openFacultyModal) window.openFacultyModal();
    }
}

// Global initialization
if (typeof window !== "undefined") {
    window.SurgicalVideoStudio = SurgicalAcademyEngine;
}
