/**
 * SurgEdge Platform - Emergency Triage & Session Intake Engine
 * Offline-First queueing, mentor matching, and field request workflow
 */

class TriageBookingEngine {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {
            caseId: '',
            specialty: 'Trauma & General Surgery',
            procedure: '',
            facilityName: '',
            countryRegion: '',
            networkType: 'satellite',
            cameraSource: 'smartphone',
            urgency: 'urgent',
            patientAgeGroup: 'adult',
            clinicalNotes: ''
        };
        this.offlineQueueKey = 'surgedge_offline_cases_v1';
    }

    init() {
        this.generateRandomCaseId();
        this.setupFormListeners();
        this.loadOfflineQueue();
        this.setupSchedulerForm();
    }

    generateRandomCaseId() {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.formData.caseId = `SE-CAS-${rand}`;
        const idDisplay = document.getElementById('generatedCaseId');
        if (idDisplay) idDisplay.textContent = this.formData.caseId;
    }

    setupFormListeners() {
        const nextBtn = document.getElementById('triageNextBtn');
        const prevBtn = document.getElementById('triagePrevBtn');
        const submitBtn = document.getElementById('triageSubmitBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNextStep());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.handlePrevStep());
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitTriageCase();
            });
        }

        // Urgency Radio Selection Cards
        const urgencyCards = document.querySelectorAll('.urgency-select-card');
        urgencyCards.forEach(card => {
            card.addEventListener('click', () => {
                urgencyCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const radio = card.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    this.formData.urgency = radio.value;
                }
            });
        });
    }

    collectStepData() {
        if (this.currentStep === 1) {
            const specialtyEl = document.getElementById('triageSpecialty');
            const procedureEl = document.getElementById('triageProcedure');
            const ageEl = document.getElementById('triageAgeGroup');
            const notesEl = document.getElementById('triageNotes');

            if (specialtyEl) this.formData.specialty = specialtyEl.value;
            if (procedureEl) this.formData.procedure = procedureEl.value;
            if (ageEl) this.formData.patientAgeGroup = ageEl.value;
            if (notesEl) this.formData.clinicalNotes = notesEl.value;
        } else if (this.currentStep === 2) {
            const facilityEl = document.getElementById('triageFacility');
            const regionEl = document.getElementById('triageRegion');
            const networkEl = document.getElementById('triageNetwork');
            const cameraEl = document.getElementById('triageCamera');

            if (facilityEl) this.formData.facilityName = facilityEl.value;
            if (regionEl) this.formData.countryRegion = regionEl.value;
            if (networkEl) this.formData.networkType = networkEl.value;
            if (cameraEl) this.formData.cameraSource = cameraEl.value;
        }
    }

    validateCurrentStep() {
        this.collectStepData();
        if (this.currentStep === 1) {
            if (!this.formData.procedure.trim()) {
                if (window.showAppToast) window.showAppToast('Please enter the planned or active surgical procedure', 'warning');
                return false;
            }
        } else if (this.currentStep === 2) {
            if (!this.formData.facilityName.trim() || !this.formData.countryRegion.trim()) {
                if (window.showAppToast) window.showAppToast('Please specify facility name and geographic region', 'warning');
                return false;
            }
        }
        return true;
    }

    handleNextStep() {
        if (!this.validateCurrentStep()) return;

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateWizardView();
        }
    }

    handlePrevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateWizardView();
        }
    }

    updateWizardView() {
        // Step Cards Visibility
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepPane = document.getElementById(`triageStepPane_${i}`);
            const stepIndicator = document.getElementById(`triageStepIndicator_${i}`);
            if (stepPane) {
                stepPane.style.display = i === this.currentStep ? 'block' : 'none';
            }
            if (stepIndicator) {
                stepIndicator.classList.toggle('active', i === this.currentStep);
                stepIndicator.classList.toggle('completed', i < this.currentStep);
            }
        }

        const prevBtn = document.getElementById('triagePrevBtn');
        const nextBtn = document.getElementById('triageNextBtn');
        const submitBtn = document.getElementById('triageSubmitBtn');

        if (prevBtn) prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        if (nextBtn) nextBtn.style.display = this.currentStep < this.totalSteps ? 'inline-flex' : 'none';
        if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';
    }

    submitTriageCase() {
        this.collectStepData();

        // Save to offline storage first
        this.saveCaseToOfflineStorage(this.formData);

        // Find best matched mentor
        const matchedMentor = this.findBestMentor(this.formData.specialty);

        // Show Success Modal / Matching Screen
        const resultContainer = document.getElementById('triageSuccessModal');
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="triage-match-card">
                    <div class="match-pulse-ring">
                        <span class="match-icon">✓</span>
                    </div>
                    <h2>Tele-Mentoring Session Dispatched!</h2>
                    <p class="case-id-tag">Case Identifier: <strong>${this.formData.caseId}</strong></p>
                    
                    <div class="matched-mentor-profile">
                        <div class="mentor-badge-hdr">MATCHED GLOBAL SURGICAL FACULTY</div>
                        <div class="mentor-details-row">
                            <div class="mentor-avatar-box">👨‍⚕️</div>
                            <div class="mentor-meta">
                                <h3>${matchedMentor.name}</h3>
                                <p class="mentor-spec">${matchedMentor.specialty}</p>
                                <p class="mentor-inst">${matchedMentor.affiliation}</p>
                                <span class="mentor-status-tag">🟢 ${matchedMentor.status}</span>
                            </div>
                        </div>
                    </div>

                    <div class="triage-summary-box">
                        <div class="summary-item">
                            <span>Facility:</span>
                            <strong>${this.formData.facilityName} (${this.formData.countryRegion})</strong>
                        </div>
                        <div class="summary-item">
                            <span>Network Protocol:</span>
                            <strong>${this.formData.networkType.toUpperCase()} (Low-Bandwidth WebRTC)</strong>
                        </div>
                        <div class="summary-item">
                            <span>Urgency Level:</span>
                            <strong class="urgency-tag-${this.formData.urgency}">${this.formData.urgency.toUpperCase()}</strong>
                        </div>
                    </div>

                    <div class="triage-modal-actions">
                        <button class="btn btn-primary btn-lg" onclick="window.location.hash = '#virtual-or'; document.getElementById('triageModalWrapper').classList.remove('active');">
                            Enter Virtual OR Tele-Mentoring Room ➔
                        </button>
                        <button class="btn btn-secondary" onclick="document.getElementById('triageModalWrapper').classList.remove('active');">
                            Close & Monitor Queue
                        </button>
                    </div>
                </div>
            `;
            const modalWrapper = document.getElementById('triageModalWrapper');
            if (modalWrapper) modalWrapper.classList.add('active');
        }

        if (window.showAppToast) {
            window.showAppToast(`Case ${this.formData.caseId} Dispatched. Mentor Matched!`, 'success');
        }

        // Reset wizard
        this.currentStep = 1;
        this.generateRandomCaseId();
        this.updateWizardView();
    }

    findBestMentor(specialty) {
        const mentors = (window.SURGEDGE_DATA && window.SURGEDGE_DATA.mentors) || [];
        const match = mentors.find(m => m.specialty.toLowerCase().includes(specialty.toLowerCase().split(' ')[0]));
        return match || mentors[0];
    }

    saveCaseToOfflineStorage(caseData) {
        let queue = [];
        try {
            const stored = localStorage.getItem(this.offlineQueueKey);
            if (stored) queue = JSON.parse(stored);
        } catch (e) {
            queue = [];
        }

        queue.unshift({
            ...caseData,
            timestamp: new Date().toISOString(),
            status: 'Synced'
        });

        try {
            localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue.slice(0, 15)));
        } catch (e) {
            console.warn('LocalStorage error:', e);
        }

        this.loadOfflineQueue();
    }

    loadOfflineQueue() {
        const queueContainer = document.getElementById('offlineQueueList');
        if (!queueContainer) return;

        let queue = [];
        try {
            const stored = localStorage.getItem(this.offlineQueueKey);
            if (stored) queue = JSON.parse(stored);
        } catch (e) {
            queue = [];
        }

        if (queue.length === 0) {
            queueContainer.innerHTML = `<p class="empty-queue-note">No queued cases in local offline cache.</p>`;
            return;
        }

        queueContainer.innerHTML = queue.map(c => `
            <div class="queued-case-row">
                <span class="q-case-id">${c.caseId}</span>
                <span class="q-proc">${c.procedure || c.specialty}</span>
                <span class="q-fac">${c.facilityName || 'District OR'}</span>
                <span class="q-status-badge synced">● Synced</span>
            </div>
        `).join('');
    }

    setupSchedulerForm() {
        const schedForm = document.getElementById('meetingSchedulerForm');
        if (schedForm) {
            schedForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('schedName')?.value || 'Guest';
                const email = document.getElementById('schedEmail')?.value;
                const role = document.getElementById('schedRole')?.value;
                const time = document.getElementById('schedTime')?.value;

                if (window.showAppToast) {
                    window.showAppToast(`Meeting request submitted for ${name} (${role}). An invitation link has been dispatched.`, 'success');
                }
                schedForm.reset();
            });
        }
    }
}

// Global initialization
if (typeof window !== "undefined") {
    window.TriageBookingEngine = TriageBookingEngine;
}
