/**
 * SurgEdge Platform - Course & Curriculum Engine
 * Inspired by SurgHub (UNITAR) & Amodisc Ltd standard
 */

class CourseLibraryEngine {
    constructor() {
        this.courses = (window.SURGEDGE_DATA && window.SURGEDGE_DATA.courses) || [];
        this.selectedSpecialty = 'all';
        this.selectedResource = 'all';
        this.activeCourse = null;
        this.currentStepIndex = 0;
        this.completedSteps = new Set();
        this.quizAnswers = {};
    }

    init() {
        this.renderCatalog();
        this.setupFilterListeners();
        this.setupModalListeners();
    }

    setupFilterListeners() {
        const specialtyFilter = document.getElementById('courseSpecialtyFilter');
        const resourceFilter = document.getElementById('courseResourceFilter');

        if (specialtyFilter) {
            specialtyFilter.addEventListener('change', (e) => {
                this.selectedSpecialty = e.target.value;
                this.renderCatalog();
            });
        }

        if (resourceFilter) {
            resourceFilter.addEventListener('change', (e) => {
                this.selectedResource = e.target.value;
                this.renderCatalog();
            });
        }

        const searchInput = document.getElementById('courseSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderCatalog(e.target.value.trim().toLowerCase());
            });
        }
    }

    setupModalListeners() {
        const modal = document.getElementById('coursePlayerModal');
        const closeBtn = document.getElementById('closeCourseModalBtn');

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }

    getFilteredCourses(searchTerm = '') {
        return this.courses.filter(course => {
            const matchesSpecialty = this.selectedSpecialty === 'all' || course.specialty.toLowerCase().includes(this.selectedSpecialty.toLowerCase());
            const matchesResource = this.selectedResource === 'all' || course.resourceLevel.toLowerCase().includes(this.selectedResource.toLowerCase());
            const matchesSearch = !searchTerm || course.title.toLowerCase().includes(searchTerm) || course.overview.toLowerCase().includes(searchTerm);
            return matchesSpecialty && matchesResource && matchesSearch;
        });
    }

    renderCatalog(searchTerm = '') {
        const container = document.getElementById('courseCatalogGrid');
        if (!container) return;

        const filtered = this.getFilteredCourses(searchTerm);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state-card">
                    <div class="empty-icon">🔍</div>
                    <h3>No surgical modules match your filter</h3>
                    <p>Try selecting "All Specialties" or resetting your resource tier search parameters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(course => `
            <div class="course-card ${course.featured ? 'featured-card' : ''}" data-id="${course.id}">
                <div class="course-card-header">
                    <div class="course-specialty-badge">${course.specialty}</div>
                    <div class="course-cme-badge">${course.accreditation}</div>
                </div>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-subtitle">${course.subtitle}</p>
                <div class="course-meta-pills">
                    <span class="meta-pill"><i class="icon-clock"></i> ⏱ ${course.duration}</span>
                    <span class="meta-pill"><i class="icon-layer"></i> 📊 ${course.difficulty}</span>
                    <span class="meta-pill resource-pill">📍 ${course.resourceLevel}</span>
                </div>
                <p class="course-desc-preview">${course.overview.substring(0, 140)}...</p>
                <div class="course-card-footer">
                    <button class="btn btn-primary btn-sm open-course-btn" onclick="window.courseEngine.openCourse('${course.id}')">
                        Launch Interactive Module ➔
                    </button>
                </div>
            </div>
        `).join('');
    }

    openCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        this.activeCourse = course;
        this.currentStepIndex = 0;
        this.completedSteps.clear();
        this.quizAnswers = {};

        const modal = document.getElementById('coursePlayerModal');
        if (!modal) return;

        this.renderCourseModalContent();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    renderCourseModalContent() {
        const course = this.activeCourse;
        if (!course) return;

        const titleEl = document.getElementById('modalCourseTitle');
        const specialtyEl = document.getElementById('modalCourseSpecialty');
        const cmeEl = document.getElementById('modalCourseCme');
        const bodyContainer = document.getElementById('modalCourseBody');

        if (titleEl) titleEl.textContent = course.title;
        if (specialtyEl) specialtyEl.textContent = `${course.specialty} • ${course.resourceLevel}`;
        if (cmeEl) cmeEl.textContent = `${course.accreditation} • ${course.duration}`;

        if (!bodyContainer) return;

        bodyContainer.innerHTML = `
            <div class="course-player-layout">
                <!-- Left Sidebar: Step Navigation -->
                <aside class="course-player-sidebar">
                    <div class="sidebar-header">
                        <h4>Procedural Milestones</h4>
                        <span class="progress-indicator" id="courseProgressText">0 of ${course.steps.length} Complete</span>
                    </div>
                    <nav class="course-step-list">
                        ${course.steps.map((step, idx) => `
                            <button class="step-nav-btn ${idx === this.currentStepIndex ? 'active' : ''} ${this.completedSteps.has(idx) ? 'completed' : ''}" 
                                    onclick="window.courseEngine.goToStep(${idx})">
                                <span class="step-badge">${step.stepNumber}</span>
                                <div class="step-info">
                                    <span class="step-name">${step.title}</span>
                                    <span class="step-dur">⏱ ${step.duration}</span>
                                </div>
                                <span class="step-status-icon">${this.completedSteps.has(idx) ? '✓' : ''}</span>
                            </button>
                        `).join('')}
                        <button class="step-nav-btn quiz-nav-btn ${this.currentStepIndex === course.steps.length ? 'active' : ''}"
                                onclick="window.courseEngine.goToStep(${course.steps.length})">
                            <span class="step-badge">★</span>
                            <div class="step-info">
                                <span class="step-name">Knowledge Check & Certification</span>
                                <span class="step-dur">Self-Assessment</span>
                            </div>
                        </button>
                    </nav>
                </aside>

                <!-- Main Content Area: Active Step or Quiz -->
                <main class="course-player-main" id="coursePlayerMainView">
                    ${this.renderActiveStepOrQuiz()}
                </main>
            </div>
        `;
    }

    goToStep(index) {
        this.currentStepIndex = index;
        const mainView = document.getElementById('coursePlayerMainView');
        if (mainView) {
            mainView.innerHTML = this.renderActiveStepOrQuiz();
            mainView.scrollTop = 0;
        }

        // Update active class on step buttons
        const btns = document.querySelectorAll('.step-nav-btn');
        btns.forEach((btn, idx) => {
            btn.classList.toggle('active', idx === index);
        });
    }

    renderActiveStepOrQuiz() {
        const course = this.activeCourse;
        if (!course) return '';

        // If on the Quiz step
        if (this.currentStepIndex === course.steps.length) {
            return this.renderQuizView();
        }

        const step = course.steps[this.currentStepIndex];

        return `
            <div class="step-detail-card">
                <div class="step-header">
                    <div class="step-tag">STEP ${step.stepNumber} OF ${course.steps.length}</div>
                    <h2>${step.title}</h2>
                    <span class="step-est-time">Expected Operative Time: ${step.duration}</span>
                </div>

                <!-- Anatomical Target Banner -->
                <div class="anatomical-target-box">
                    <strong>🎯 Anatomical Focus:</strong> ${step.anatomicalFocus}
                </div>

                <!-- Step Description -->
                <div class="step-procedural-body">
                    <h3>Technique & Operative Sequence</h3>
                    <p>${step.description}</p>
                </div>

                <!-- Critical Clinical Hazard Warning -->
                <div class="critical-warning-box">
                    <div class="warning-icon">⚠</div>
                    <div class="warning-content">
                        <strong>CRITICAL SAFETY WARNING:</strong>
                        <p>${step.criticalWarning}</p>
                    </div>
                </div>

                <!-- Interactive Checklist -->
                <div class="step-safety-checklist">
                    <h3>Intra-operative Safety Verifications</h3>
                    <ul class="checklist-items">
                        ${step.safetyChecklist.map((item, itemIdx) => `
                            <li class="checklist-item">
                                <label class="custom-checkbox-label">
                                    <input type="checkbox" id="chk_${this.currentStepIndex}_${itemIdx}" onchange="window.courseEngine.checkSafetyItem(${this.currentStepIndex}, ${itemIdx})">
                                    <span class="checkbox-box"></span>
                                    <span class="checkbox-text">${item}</span>
                                </label>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Step Footer Actions -->
                <div class="step-navigation-footer">
                    <button class="btn btn-secondary" onclick="window.courseEngine.goToStep(${this.currentStepIndex - 1})" ${this.currentStepIndex === 0 ? 'disabled' : ''}>
                        ← Previous Step
                    </button>

                    <button class="btn btn-primary" onclick="window.courseEngine.completeCurrentStep()">
                        ${this.currentStepIndex === course.steps.length - 1 ? 'Proceed to Quiz & Certification ➔' : 'Complete Step & Proceed ➔'}
                    </button>
                </div>
            </div>
        `;
    }

    checkSafetyItem(stepIdx, itemIdx) {
        // Subtle feedback
    }

    completeCurrentStep() {
        this.completedSteps.add(this.currentStepIndex);
        this.updateProgressIndicator();
        this.goToStep(this.currentStepIndex + 1);

        if (window.showAppToast) {
            window.showAppToast(`Step ${this.currentStepIndex} Completed`, 'success');
        }
    }

    updateProgressIndicator() {
        const text = document.getElementById('courseProgressText');
        if (text && this.activeCourse) {
            text.textContent = `${this.completedSteps.size} of ${this.activeCourse.steps.length} Complete`;
        }
    }

    renderQuizView() {
        const course = this.activeCourse;
        if (!course || !course.quiz) return '';

        return `
            <div class="quiz-container-card">
                <div class="quiz-header">
                    <h2>Knowledge Assessment & Peer-Verified Certification</h2>
                    <p>Complete this clinical knowledge verification to earn your verified CME accreditation for ${course.title}.</p>
                </div>

                <div class="quiz-questions-list">
                    ${course.quiz.map((q, qIdx) => `
                        <div class="quiz-question-box" id="quizQ_${qIdx}">
                            <h4>Question ${qIdx + 1}: ${q.question}</h4>
                            <div class="quiz-options-group">
                                ${q.options.map((opt, optIdx) => `
                                    <label class="quiz-option-label" id="optLabel_${qIdx}_${optIdx}">
                                        <input type="radio" name="quiz_q_${qIdx}" value="${optIdx}" onchange="window.courseEngine.selectQuizOption(${qIdx}, ${optIdx})">
                                        <span class="radio-custom"></span>
                                        <span class="option-text">${opt}</span>
                                    </label>
                                `).join('')}
                            </div>
                            <div class="quiz-feedback-box" id="feedback_${qIdx}" style="display: none;"></div>
                        </div>
                    `).join('')}
                </div>

                <div class="quiz-action-footer">
                    <button class="btn btn-primary btn-lg" id="submitQuizBtn" onclick="window.courseEngine.evaluateQuiz()">
                        Submit & Validate Certification ➔
                    </button>
                </div>

                <div id="quizCertificateResult" style="display: none;"></div>
            </div>
        `;
    }

    selectQuizOption(qIdx, optIdx) {
        this.quizAnswers[qIdx] = optIdx;
    }

    evaluateQuiz() {
        const course = this.activeCourse;
        if (!course || !course.quiz) return;

        let score = 0;
        let allAnswered = true;

        course.quiz.forEach((q, qIdx) => {
            const selected = this.quizAnswers[qIdx];
            const feedbackEl = document.getElementById(`feedback_${qIdx}`);

            if (selected === undefined) {
                allAnswered = false;
                return;
            }

            feedbackEl.style.display = 'block';
            if (selected === q.correctIndex) {
                score++;
                feedbackEl.className = 'quiz-feedback-box correct';
                feedbackEl.innerHTML = `<strong>✓ Correct:</strong> ${q.explanation}`;
            } else {
                feedbackEl.className = 'quiz-feedback-box incorrect';
                feedbackEl.innerHTML = `<strong>✗ Incorrect:</strong> ${q.explanation}`;
            }
        });

        if (!allAnswered) {
            if (window.showAppToast) {
                window.showAppToast('Please answer all questions before submitting', 'warning');
            }
            return;
        }

        const certContainer = document.getElementById('quizCertificateResult');
        const submitBtn = document.getElementById('submitQuizBtn');
        if (submitBtn) submitBtn.style.display = 'none';

        if (certContainer) {
            certContainer.style.display = 'block';
            if (score === course.quiz.length) {
                certContainer.innerHTML = `
                    <div class="certificate-badge-card">
                        <div class="cert-ribbon">🎖 VERIFIED CME ACCREDITATION</div>
                        <h3>SurgEdge Certificate of Procedural Mastery</h3>
                        <p>This certifies that the participating surgical clinician has demonstrated verified theoretical and procedural competency in:</p>
                        <h4>${course.title}</h4>
                        <div class="cert-meta-row">
                            <span><strong>Program:</strong> Global Surgery Slingshot / Babson College</span>
                            <span><strong>Technical Partner:</strong> Amodisc Ltd</span>
                            <span><strong>Accreditation:</strong> ${course.accreditation}</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="window.print()">
                            🖨 Print / Save Verified PDF Certificate
                        </button>
                    </div>
                `;
                if (window.showAppToast) {
                    window.showAppToast('Congratulations! Perfect score achieved and Certificate Issued.', 'success');
                }
            } else {
                certContainer.innerHTML = `
                    <div class="quiz-retry-card">
                        <h3>Score: ${score} of ${course.quiz.length} Correct</h3>
                        <p>Review the clinical rationales above and re-attempt to earn CME certification.</p>
                        <button class="btn btn-primary btn-sm" onclick="window.courseEngine.goToStep(${course.steps.length})">
                            Re-attempt Assessment
                        </button>
                    </div>
                `;
            }
        }
    }
}

// Global initialization
if (typeof window !== "undefined") {
    window.CourseLibraryEngine = CourseLibraryEngine;
}
