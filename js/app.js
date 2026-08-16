/**
 * SurgEdge Platform - Clean Core Controller
 * Focused on: Surgical Video Training & Real-Time Doctor Tele-Connect
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Toast Notification System
    window.showAppToast = function(message, type = 'info') {
        let toastContainer = document.getElementById('appToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'appToastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 4000);
    };

    // 2. Initialize Surgical Video Studio
    if (window.SurgicalVideoStudio) {
        window.videoStudio = new window.SurgicalVideoStudio();
        window.videoStudio.init();
    }

    // 3. Render Mentors & Setup Interactions
    renderMentorsRoster();
    setupDirectTeleCallForm();
    setupNavigationAndMobileMenu();
    setupAuthGate();

    // 4. Initialize Cinema-Grade OR 3D Simulation Suite
    if (window.initORSimulationStudio) {
        window.initORSimulationStudio();
    }
});

/* --- FACULTY AUTH GATE --- */
window.openFacultyModal = function() {
    const modal = document.getElementById('ownerAuthModal');
    if (modal) modal.classList.add('active');
};

function setupAuthGate() {
    const modal = document.getElementById('ownerAuthModal');
    const closeBtn = document.getElementById('closeAuthModalBtn');
    const quickBtn = document.getElementById('quickFacultyLoginBtn');
    const authForm = document.getElementById('ownerAuthForm');
    const logoutBtn = document.getElementById('dashLogoutBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    // Close on overlay click
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

    function unlockDashboard() {
        modal.classList.remove('active');
        const dash = document.getElementById('faculty-dashboard');
        if (dash) {
            dash.style.display = 'block';
            dash.scrollIntoView({ behavior: 'smooth' });
        }
        window.showAppToast('Faculty access granted. Welcome, Hamdi Abdalkareem (Faculty Admin).', 'success');
        setTimeout(animateDashboardCounters, 350);
    }

    function lockDashboard() {
        const dash = document.getElementById('faculty-dashboard');
        if (dash) dash.style.display = 'none';
        document.querySelectorAll('.dash-metric-val[data-count]').forEach(el => { el.textContent = '0'; });
        window.showAppToast('Faculty session ended.', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (quickBtn) quickBtn.addEventListener('click', unlockDashboard);
    if (authForm) authForm.addEventListener('submit', (e) => { e.preventDefault(); unlockDashboard(); });
    if (logoutBtn) logoutBtn.addEventListener('click', lockDashboard);
}

/* --- ANIMATED NUMBER COUNTERS (ease-out cubic) --- */
function animateDashboardCounters() {
    document.querySelectorAll('.dash-metric-val[data-count]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const isDecimal = el.hasAttribute('data-decimal');
        const duration = 1400;
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * ease);
            el.textContent = isDecimal
                ? (current / 10).toFixed(1) + '%'
                : current.toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

// Navigation & Smooth Scrolling
function setupNavigationAndMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuToggle');
    const navLinksList = document.getElementById('navLinksContainer');

    if (mobileMenuBtn && navLinksList) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinksList.classList.toggle('mobile-open');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinksList) navLinksList.classList.remove('mobile-open');
            if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
        });
    });

    // Active Section Tracking via IntersectionObserver
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link[href^="#"]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navItems.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { threshold: 0.25 });

    sections.forEach(sec => observer.observe(sec));
}

// Render Accredited Global Doctor Roster
function renderMentorsRoster() {
    const container = document.getElementById('mentorRosterGrid');
    if (!container || !window.SURGEDGE_DATA) return;

    const mentors = window.SURGEDGE_DATA.mentors || [];
    container.innerHTML = mentors.map(m => `
        <div class="mentor-card">
            <div class="mentor-card-top">
                <div class="mentor-avatar-initials">${m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                <div class="mentor-status-tag ${m.status.includes('Online') ? 'online' : 'busy'}">
                    ● ${m.status}
                </div>
            </div>
            <h4 class="mentor-name">${m.name}</h4>
            <p class="mentor-specialty">${m.specialty}</p>
            <p class="mentor-affiliation">${m.affiliation}</p>
            <div class="mentor-stats-row" style="font-size: 0.78rem; display: flex; justify-content: space-between; margin-bottom: 12px; color: var(--text-muted);">
                <span><strong>${m.casesMentored}+</strong> Guided</span>
                <span><strong>${m.experience}</strong> Exp.</span>
            </div>
            <button class="btn btn-secondary btn-sm btn-block" onclick="selectMentorForCall('${m.name}', '${m.specialty}')">
                Connect with Doctor ➔
            </button>
        </div>
    `).join('');
}

// Select Doctor for Direct Call
window.selectMentorForCall = function(mentorName, specialty) {
    const specSelect = document.getElementById('quickSpecialty');
    if (specSelect) {
        for (let opt of specSelect.options) {
            if (opt.text.toLowerCase().includes(specialty.toLowerCase().split(' ')[0])) {
                opt.selected = true;
                break;
            }
        }
    }
    const callForm = document.getElementById('quickCallForm');
    if (callForm) {
        callForm.scrollIntoView({ behavior: 'smooth' });
    }
    if (window.showAppToast) {
        window.showAppToast(`Selected ${mentorName} for consultation. Fill details to connect.`, 'info');
    }
};

// Quick Field Doctor Call Submission
function setupDirectTeleCallForm() {
    const form = document.getElementById('directTeleCallForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const facility = document.getElementById('quickFacility')?.value || 'Rural OR';
        const procedure = document.getElementById('quickProcedure')?.value || 'Surgical Procedure';
        const specialty = document.getElementById('quickSpecialty')?.value || 'General Surgery';
        const urgency = document.getElementById('quickUrgency')?.value || 'urgent';

        if (window.showAppToast) {
            window.showAppToast(`Call Dispatched! Connecting ${facility} with on-call specialist (${specialty}) via low-bandwidth channel.`, 'success');
        }

        // Open live session confirmation simulation
        setTimeout(() => {
            if (window.showAppToast) {
                window.showAppToast(`Dr. Marcus Vance, MD (On-Call Faculty) has joined your tele-mentoring channel. Audio & AR active.`, 'success');
            }
        }, 1500);

        form.reset();
    });
}

// Theme Switcher (Clinical Dark / Light)
function setupThemeSwitcher() {
    const themeBtn = document.getElementById('themeToggleBtn');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeBtn.innerHTML = isLight ? '🌙' : '☀️';
        if (window.showAppToast) {
            window.showAppToast(`Theme switched to ${isLight ? 'Clinical Clean Light' : 'Surgical Dark Mode'}`, 'info');
        }
    });
}
