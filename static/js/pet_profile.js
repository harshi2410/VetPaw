// VETPAW Pet Profile JavaScript — Full Dashboard

let currentPetId = null;
let currentPet = null;
let allClinics = [];
let allVets = [];
let medicationFilter = 'all';
let allMedications = [];

document.addEventListener('DOMContentLoaded', function() {
    const pathParts = window.location.pathname.split('/');
    currentPetId = pathParts[pathParts.length - 1];

    if (currentPetId && currentPetId !== 'pets') {
        loadPetProfile();
        initTabs();
        loadClinicsAndVets();
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeModal(this.id);
        });
    });

    // Close modals on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
        }
    });
});

// ==================== TABS ====================

function initTabs() {
    loadHealthRecords();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName + '-tab');
    });

    switch (tabName) {
        case 'health-records': loadHealthRecords(); break;
        case 'vaccinations': loadVaccinations(); break;
        case 'medications': loadMedications(); break;
        case 'weight': loadWeightHistory(); break;
        case 'appointments': loadAppointments(); break;
        case 'pet-info': loadPetInfo(); break;
    }
}

// ==================== MODAL ====================

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// ==================== TOAST ====================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3500);
}

// ==================== FETCH HELPERS ====================

const apiHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
};

function getFormData(formId) {
    const form = document.getElementById(formId);
    const data = {};
    new FormData(form).forEach((value, key) => {
        if (value !== '') data[key] = value;
    });
    return data;
}

// ==================== LOAD PET PROFILE ====================

async function loadPetProfile() {
    try {
        const response = await fetch(`/pets/${currentPetId}`, { headers: apiHeaders });
        const data = await response.json();

        if (response.ok && data.pet) {
            currentPet = data.pet;
            const pet = data.pet;

            // Avatar mapping
            const avatarMap = { 
                Dog: '🐶', 
                dog: '🐶', 
                Cat: '🐱', 
                cat: '🐱', 
                Bird: '🐦', 
                bird: '🐦', 
                Rabbit: '🐰',
                rabbit: '🐰'
            };
            document.getElementById('pet-avatar').textContent = avatarMap[pet.species] || '🐾';
            document.getElementById('pet-name').textContent = pet.name || 'Pet Name';
            document.getElementById('pet-breed').textContent = `${pet.species || 'Pet'} • ${pet.breed || 'Mixed Breed'}`;
            document.getElementById('pet-vetpaw-id').textContent = `VETPAW ID: ${pet.vetpaw_id || 'N/A'}`;
            document.getElementById('pet-age').textContent = pet.age != null ? `${pet.age} yr` : '-';
            document.getElementById('pet-weight').textContent = pet.weight_kg ? `${pet.weight_kg} kg` : '-';
            document.getElementById('pet-gender').textContent = pet.gender || '-';

            // Extra details badges
            const extras = [];
            if (pet.date_of_birth) extras.push(`🎂 Born: ${pet.date_of_birth}`);
            if (pet.color) extras.push(`🎨 ${pet.color}`);
            if (pet.is_neutered) extras.push(`✓ Spayed/Neutered`);
            if (pet.activity_level) extras.push(`🏃 ${pet.activity_level} Energy`);
            if (pet.microchip_id) extras.push(`📟 Chip: ${pet.microchip_id}`);
            if (pet.allergies) extras.push(`⚠️ Allergies: ${pet.allergies}`);
            if (pet.medical_conditions) extras.push(`🩺 ${pet.medical_conditions}`);
            document.getElementById('pet-extra-details').innerHTML = extras.map(e => `<span>${e}</span>`).join('');

            // Load quick stats + health score
            updateQuickStats();
        }
    } catch (error) {
        console.error('Error loading pet profile:', error);
    }
}


// ==================== QUICK STATS & HEALTH SCORE ====================

async function updateQuickStats() {
    try {
        const [vacRes, medRes, weightRes, apptRes, hrRes] = await Promise.all([
            fetch(`/pets/${currentPetId}/vaccinations`, { headers: apiHeaders }),
            fetch(`/pets/${currentPetId}/medications`, { headers: apiHeaders }),
            fetch(`/pets/${currentPetId}/weight`, { headers: apiHeaders }),
            fetch(`/pets/${currentPetId}/appointments`, { headers: apiHeaders }),
            fetch(`/pets/${currentPetId}/health-records`, { headers: apiHeaders })
        ]);

        const vacData = await vacRes.json();
        const medData = await medRes.json();
        const weightData = await weightRes.json();
        const apptData = await apptRes.json();
        const hrData = await hrRes.json();

        const vaccinations = vacData.vaccinations || [];
        allMedications = medData.medications || [];
        const weights = weightData.weight_history || [];
        const appointments = apptData.appointments || [];
        const healthRecords = hrData.health_records || [];

        // Quick stats
        document.getElementById('qs-vaccinations').textContent = vaccinations.length;
        const activeMeds = allMedications.filter(m => m.is_active);
        document.getElementById('qs-medications').textContent = activeMeds.length;

        const upcomingAppts = appointments.filter(a => a.status === 'SCHEDULED');
        document.getElementById('qs-appointments').textContent = upcomingAppts.length;

        if (weights.length > 0) {
            document.getElementById('qs-last-weight').textContent = `${weights[0].weight_kg} kg`;
        } else {
            document.getElementById('qs-last-weight').textContent = '-';
        }

        // Health score computation
        calculateHealthScore(vaccinations, weights, healthRecords);
    } catch (error) {
        console.error('Error updating quick stats:', error);
    }
}

function calculateHealthScore(vaccinations, weights, healthRecords) {
    let score = 0;
    const breakdown = [];
    const today = new Date();

    // 1. Vaccinations up-to-date (40 pts)
    const overdueVacs = vaccinations.filter(v => {
        if (v.status === 'OVERDUE') return true;
        if (v.next_due_date && v.status !== 'COMPLETED') {
            return new Date(v.next_due_date) < today;
        }
        return false;
    });

    if (vaccinations.length === 0) {
        breakdown.push({ text: '⚠️ No vaccination records', cls: 'warn', pts: 20 });
        score += 20;
    } else if (overdueVacs.length === 0) {
        breakdown.push({ text: '✅ Vaccines up-to-date', cls: 'check', pts: 40 });
        score += 40;
    } else {
        breakdown.push({ text: `⚠️ ${overdueVacs.length} overdue vaccine(s)`, cls: 'fail', pts: 10 });
        score += 10;
    }

    // 2. Weight tracked in last 90 days (30 pts)
    if (weights.length > 0) {
        const lastWeightDate = new Date(weights[0].recorded_date);
        const daysSince = Math.floor((today - lastWeightDate) / (1000 * 60 * 60 * 24));
        if (daysSince <= 90) {
            breakdown.push({ text: '✅ Weight tracked recently', cls: 'check', pts: 30 });
            score += 30;
        } else {
            breakdown.push({ text: '⚠️ Weight record older than 90 days', cls: 'warn', pts: 15 });
            score += 15;
        }
    } else {
        breakdown.push({ text: '❌ No weight records tracked', cls: 'fail', pts: 0 });
    }

    // 3. Health checkup in last 180 days (30 pts)
    if (healthRecords.length > 0) {
        const lastVisit = new Date(healthRecords[0].visit_date);
        const daysSince = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
        if (daysSince <= 180) {
            breakdown.push({ text: '✅ Recent checkup recorded', cls: 'check', pts: 30 });
            score += 30;
        } else {
            breakdown.push({ text: '⚠️ Last checkup over 6 months ago', cls: 'warn', pts: 15 });
            score += 15;
        }
    } else {
        breakdown.push({ text: '❌ No checkup records', cls: 'fail', pts: 0 });
    }

    // Update UI Score Elements
    const circle = document.getElementById('health-score-circle');
    circle.textContent = score;
    circle.className = 'health-score-circle';
    if (score >= 70) circle.classList.add('excellent');
    else if (score >= 40) circle.classList.add('good');
    else circle.classList.add('needs-attention');

    const label = document.getElementById('health-score-label');
    if (score >= 80) label.textContent = '🌟 Excellent Health';
    else if (score >= 60) label.textContent = '✨ Good Health Status';
    else if (score >= 40) label.textContent = '⚠️ Attention Needed';
    else label.textContent = '🔴 Immediate Attention Recommended';

    document.getElementById('health-score-detail').textContent = `Overall Score: ${score}/100`;

    document.getElementById('health-breakdown').innerHTML = breakdown.map(b =>
        `<div class="breakdown-item"><span class="${b.cls}">${b.text}</span></div>`
    ).join('');
}

// ==================== HEALTH RECORDS ====================

async function loadHealthRecords() {
    const container = document.getElementById('health-records-container');
    try {
        const response = await fetch(`/pets/${currentPetId}/health-records`, { headers: apiHeaders });
        const data = await response.json();

        if (response.ok && data.health_records && data.health_records.length > 0) {
            container.innerHTML = data.health_records.map(r => `
                <div class="record-card">
                    <div class="record-header">
                        <h4>📋 ${r.record_type || 'Health Record'}</h4>
                        <span class="record-date">${r.visit_date || ''}</span>
                    </div>
                    ${r.diagnosis ? `<p class="record-detail"><strong>🩺 Diagnosis:</strong> ${r.diagnosis}</p>` : ''}
                    ${r.treatment ? `<p class="record-detail"><strong>💊 Treatment:</strong> ${r.treatment}</p>` : ''}
                    <p class="record-detail"><strong>🏢 Clinic:</strong> ${r.clinic_name || 'N/A'}</p>
                    <p class="record-detail"><strong>👨‍⚕️ Vet:</strong> ${r.veterinarian_name || 'N/A'}</p>
                    ${r.notes ? `<p class="record-detail"><strong>📝 Notes:</strong> ${r.notes}</p>` : ''}
                    ${r.follow_up_date ? `<p class="record-detail"><strong>📅 Follow-up:</strong> ${r.follow_up_date}</p>` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p class="empty-text">No health records yet</p><p class="empty-subtext">Add your first health record to start tracking.</p></div>`;
        }
    } catch (error) { 
        console.error('Error loading health records:', error); 
    }
}

async function submitHealthRecord(e) {
    e.preventDefault();
    try {
        const response = await fetch(`/pets/${currentPetId}/health-records`, {
            method: 'POST', headers: apiHeaders,
            body: JSON.stringify(getFormData('health-record-form'))
        });
        if (response.ok) {
            closeModal('health-record-modal');
            document.getElementById('health-record-form').reset();
            loadHealthRecords();
            updateQuickStats();
            showToast('Health record added successfully! 📋');
        } else { 
            showToast('Failed to add record', 'error'); 
        }
    } catch (error) { 
        showToast('Error saving record', 'error'); 
    }
}

// ==================== VACCINATIONS ====================

async function loadVaccinations() {
    const container = document.getElementById('vaccinations-container');
    try {
        const response = await fetch(`/pets/${currentPetId}/vaccinations`, { headers: apiHeaders });
        const data = await response.json();

        if (response.ok && data.vaccinations && data.vaccinations.length > 0) {
            const today = new Date();
            container.innerHTML = data.vaccinations.map(v => {
                const isOverdue = v.status !== 'COMPLETED' && v.next_due_date && new Date(v.next_due_date) < today;
                
                let badgeClass = 'brown';
                let badgeText = v.status || 'SCHEDULED';
                if (v.status === 'COMPLETED') {
                    badgeClass = 'green';
                    badgeText = 'COMPLETED';
                } else if (isOverdue || v.status === 'OVERDUE') {
                    badgeClass = 'red';
                    badgeText = '⚠️ OVERDUE';
                }

                let overdueWarning = '';
                if (isOverdue) {
                    overdueWarning = `<p class="overdue-warning" style="margin-top:0.5rem;">⚠️ This vaccination is overdue! Scheduled date: ${v.next_due_date}</p>`;
                }

                return `
                    <div class="record-card">
                        <div class="record-header">
                            <h4>💉 ${v.vaccine_name}</h4>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                        <p class="record-detail"><strong>Administered:</strong> ${v.administration_date || 'Not administered yet'}</p>
                        <p class="record-detail"><strong>Next Due:</strong> ${v.next_due_date || 'Not set'}</p>
                        <p class="record-detail"><strong>Clinic:</strong> ${v.clinic_name || 'N/A'}</p>
                        <p class="record-detail"><strong>Veterinarian:</strong> ${v.veterinarian_name || 'N/A'}</p>
                        ${v.batch_number ? `<p class="record-detail"><strong>Batch:</strong> ${v.batch_number}</p>` : ''}
                        ${v.notes ? `<p class="record-detail"><strong>Notes:</strong> ${v.notes}</p>` : ''}
                        ${overdueWarning}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">💉</div><p class="empty-text">No vaccinations recorded</p><p class="empty-subtext">Track your pet's vaccinations to stay on schedule.</p></div>`;
        }
    } catch (error) { 
        console.error('Error loading vaccinations:', error); 
    }
}

async function submitVaccination(e) {
    e.preventDefault();
    try {
        const response = await fetch(`/pets/${currentPetId}/vaccinations`, {
            method: 'POST', headers: apiHeaders,
            body: JSON.stringify(getFormData('vaccination-form'))
        });
        if (response.ok) {
            closeModal('vaccination-modal');
            document.getElementById('vaccination-form').reset();
            loadVaccinations();
            updateQuickStats();
            showToast('Vaccination added successfully! 💉');
        } else { 
            showToast('Failed to add vaccination', 'error'); 
        }
    } catch (error) { 
        showToast('Error saving vaccination', 'error'); 
    }
}

// ==================== MEDICATIONS ====================

function setMedicationFilter(filter) {
    medicationFilter = filter;
    document.querySelectorAll('.med-filters button').forEach(btn => {
        btn.classList.remove('active-med-filter');
    });
    const activeBtn = document.getElementById(`filter-med-${filter}`);
    if (activeBtn) activeBtn.classList.add('active-med-filter');
    renderMedications();
}

async function loadMedications() {
    try {
        const response = await fetch(`/pets/${currentPetId}/medications`, { headers: apiHeaders });
        const data = await response.json();
        if (response.ok && data.medications) {
            allMedications = data.medications;
            renderMedications();
        }
    } catch (error) {
        console.error('Error loading medications:', error);
    }
}

function renderMedications() {
    const container = document.getElementById('medications-container');
    let filtered = allMedications;
    if (medicationFilter === 'active') {
        filtered = allMedications.filter(m => m.is_active);
    } else if (medicationFilter === 'completed') {
        filtered = allMedications.filter(m => !m.is_active);
    }

    if (filtered.length > 0) {
        container.innerHTML = filtered.map(m => `
            <div class="record-card">
                <div class="record-header">
                    <h4>💊 ${m.medication_name}</h4>
                    <span class="badge ${m.is_active ? 'green' : 'brown'}">${m.is_active ? 'Active' : 'Completed'}</span>
                </div>
                <p class="record-detail"><strong>Dosage:</strong> ${m.dosage}</p>
                <p class="record-detail"><strong>Frequency:</strong> ${m.frequency}</p>
                <p class="record-detail"><strong>Start Date:</strong> ${m.start_date || 'N/A'} ${m.end_date ? '→ <strong>End Date:</strong> ' + m.end_date : ''}</p>
                <p class="record-detail"><strong>Prescribed by:</strong> ${m.prescribing_vet || 'N/A'}</p>
                ${m.notes ? `<p class="record-detail"><strong>Notes:</strong> ${m.notes}</p>` : ''}
                <div class="record-card-actions">
                    <span style="font-size: 0.8rem; color: var(--text-light);">Status: ${m.is_active ? 'Currently Active' : 'Completed Treatment'}</span>
                    <button class="btn btn-secondary btn-small" onclick="toggleMedicationStatus(${m.id}, ${m.is_active})">
                        ${m.is_active ? '✓ Mark Completed' : '↺ Mark Active'}
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">💊</div><p class="empty-text">No ${medicationFilter !== 'all' ? medicationFilter + ' ' : ''}medications found</p><p class="empty-subtext">Add medications to keep track of dosages and schedules.</p></div>`;
    }
}

async function toggleMedicationStatus(medId, currentStatus) {
    try {
        const response = await fetch(`/pets/${currentPetId}/medications/${medId}`, {
            method: 'PUT',
            headers: apiHeaders,
            body: JSON.stringify({ is_active: !currentStatus })
        });
        if (response.ok) {
            await loadMedications();
            updateQuickStats();
            showToast(`Medication marked as ${!currentStatus ? 'Active' : 'Completed'}! 💊`);
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (error) {
        showToast('Error updating medication status', 'error');
    }
}

async function submitMedication(e) {
    e.preventDefault();
    try {
        const data = getFormData('medication-form');
        data.is_active = true;
        const response = await fetch(`/pets/${currentPetId}/medications`, {
            method: 'POST', headers: apiHeaders,
            body: JSON.stringify(data)
        });
        if (response.ok) {
            closeModal('medication-modal');
            document.getElementById('medication-form').reset();
            loadMedications();
            updateQuickStats();
            showToast('Medication added successfully! 💊');
        } else { 
            showToast('Failed to add medication', 'error'); 
        }
    } catch (error) { 
        showToast('Error saving medication', 'error'); 
    }
}

// ==================== WEIGHT HISTORY ====================

async function loadWeightHistory() {
    const container = document.getElementById('weight-container');
    try {
        const response = await fetch(`/pets/${currentPetId}/weight`, { headers: apiHeaders });
        const data = await response.json();

        if (response.ok && data.weight_history && data.weight_history.length > 0) {
            const weights = data.weight_history;
            const maxWeight = Math.max(...weights.map(w => w.weight_kg), 1);

            // Chronological order for visual trend chart
            const chronologicalWeights = [...weights].sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));

            let html = '<div style="margin-bottom:1.5rem;"><h4 style="margin-bottom:0.75rem; color:var(--text-dark);">📈 Weight Progress Trend</h4><div class="weight-chart">';
            chronologicalWeights.forEach(w => {
                const pct = Math.max(15, (w.weight_kg / maxWeight) * 100);
                html += `
                    <div class="weight-bar-row">
                        <div class="weight-bar-label">${w.recorded_date || ''}</div>
                        <div class="weight-bar-track">
                            <div class="weight-bar-fill" style="width: ${pct}%">${w.weight_kg} kg</div>
                        </div>
                    </div>
                `;
            });
            html += '</div></div>';

            // Reverse-chronological cards list (newest first)
            html += '<div><h4 style="margin-bottom:0.75rem; color:var(--text-dark);">📋 Weight Entry Logs</h4>';
            weights.forEach(w => {
                html += `
                    <div class="record-card">
                        <div class="record-header">
                            <h4>⚖️ ${w.weight_kg} kg</h4>
                            <span class="record-date">${w.recorded_date || ''}</span>
                        </div>
                        ${w.notes ? `<p class="record-detail"><strong>Notes:</strong> ${w.notes}</p>` : ''}
                    </div>
                `;
            });
            html += '</div>';

            container.innerHTML = html;
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚖️</div><p class="empty-text">No weight records</p><p class="empty-subtext">Track your pet's weight over time to monitor healthy growth.</p></div>`;
        }
    } catch (error) { 
        console.error('Error loading weight history:', error); 
    }
}

async function submitWeight(e) {
    e.preventDefault();
    try {
        const data = getFormData('weight-form');
        data.weight_kg = parseFloat(data.weight_kg);
        const response = await fetch(`/pets/${currentPetId}/weight`, {
            method: 'POST', headers: apiHeaders,
            body: JSON.stringify(data)
        });
        if (response.ok) {
            closeModal('weight-modal');
            document.getElementById('weight-form').reset();
            loadWeightHistory();
            updateQuickStats();
            showToast('Weight entry recorded successfully! ⚖️');
        } else { 
            showToast('Failed to add weight entry', 'error'); 
        }
    } catch (error) { 
        showToast('Error saving weight', 'error'); 
    }
}

// ==================== APPOINTMENTS ====================

async function loadAppointments() {
    const container = document.getElementById('appointments-container');
    try {
        const response = await fetch(`/pets/${currentPetId}/appointments`, { headers: apiHeaders });
        const data = await response.json();

        if (response.ok && data.appointments && data.appointments.length > 0) {
            container.innerHTML = data.appointments.map(a => `
                <div class="record-card">
                    <div class="record-header">
                        <h4>📅 ${a.reason || 'Veterinary Appointment'}</h4>
                        <span class="badge ${a.status === 'SCHEDULED' ? 'green' : 'brown'}">${a.status}</span>
                    </div>
                    <p class="record-detail"><strong>Date & Time:</strong> ${a.appointment_date || 'N/A'}</p>
                    ${a.notes ? `<p class="record-detail"><strong>Notes:</strong> ${a.notes}</p>` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p class="empty-text">No appointments scheduled</p><p class="empty-subtext">Book vet appointments for your pet to stay proactive.</p></div>`;
        }
    } catch (error) { 
        console.error('Error loading appointments:', error); 
    }
}

async function submitAppointment(e) {
    e.preventDefault();
    try {
        const formData = getFormData('appointment-form');
        let appointmentDate = formData.appointment_date || '';
        if (formData.appointment_time) {
            appointmentDate += `T${formData.appointment_time}`;
        }
        const payload = {
            pet_id: parseInt(currentPetId),
            clinic_id: formData.clinic_id ? parseInt(formData.clinic_id) : null,
            veterinarian_id: formData.veterinarian_id ? parseInt(formData.veterinarian_id) : null,
            appointment_date: appointmentDate,
            reason: formData.reason,
            notes: formData.notes || ''
        };
        const response = await fetch('/api/appointments', {
            method: 'POST', headers: apiHeaders,
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            closeModal('appointment-modal');
            document.getElementById('appointment-form').reset();
            loadAppointments();
            updateQuickStats();
            showToast('Appointment booked successfully! 📅');
        } else { 
            showToast('Failed to book appointment', 'error'); 
        }
    } catch (error) { 
        showToast('Error booking appointment', 'error'); 
    }
}

// ==================== PET INFO & HEALTH PROFILE ====================

function loadPetInfo() {
    if (!currentPet) return;
    const p = currentPet;
    const container = document.getElementById('pet-info-container');
    
    container.innerHTML = `
        <!-- 1. Identity & Physical Vitals -->
        <div style="grid-column: 1 / -1; margin-top: 0.5rem;">
            <h4 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>🏷️</span> Basic Vitals & Identity
            </h4>
        </div>
        <div class="info-field">
            <div class="field-label">Pet Name</div>
            <div class="field-value">${p.name}</div>
        </div>
        <div class="info-field">
            <div class="field-label">Species & Breed</div>
            <div class="field-value">${p.species} • ${p.breed || 'Mixed Breed'}</div>
        </div>
        <div class="info-field">
            <div class="field-label">Date of Birth / Age</div>
            <div class="field-value">${p.date_of_birth || 'Not recorded'} (${p.age != null ? p.age + ' years old' : 'Age unknown'})</div>
        </div>
        <div class="info-field">
            <div class="field-label">Gender & Reproductive Status</div>
            <div class="field-value">${p.gender || 'Unknown'} ${p.is_neutered ? '• Neutered/Spayed' : '• Intact'}</div>
        </div>
        <div class="info-field">
            <div class="field-label">Weight & Color</div>
            <div class="field-value">${p.weight_kg ? p.weight_kg + ' kg' : 'Unrecorded'} • ${p.color || 'N/A'}</div>
        </div>
        <div class="info-field">
            <div class="field-label">VETPAW Unique ID</div>
            <div class="field-value" style="color: var(--primary-color); font-weight: 700;">${p.vetpaw_id}</div>
        </div>

        <!-- 2. Medical & Health Profile -->
        <div style="grid-column: 1 / -1; margin-top: 1rem;">
            <h4 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>🩺</span> Health & Medical Profile
            </h4>
        </div>
        <div class="info-field" style="grid-column: 1 / -1; ${p.allergies ? 'background: #FFEBEE; border-color: #EF9A9A;' : ''}">
            <div class="field-label" style="${p.allergies ? 'color: #C62828;' : ''}">Known Allergies</div>
            <div class="field-value" style="${p.allergies ? 'color: #B71C1C;' : ''}">${p.allergies || 'None reported'}</div>
        </div>
        <div class="info-field" style="grid-column: 1 / -1;">
            <div class="field-label">Chronic Conditions & Medical History</div>
            <div class="field-value">${p.medical_conditions || 'No chronic conditions reported'}</div>
        </div>
        <div class="info-field" style="grid-column: 1 / -1;">
            <div class="field-label">Dietary Needs & Feeding Instructions</div>
            <div class="field-value">${p.dietary_needs || 'Standard feeding'}</div>
        </div>
        <div class="info-field">
            <div class="field-label">Activity & Energy Level</div>
            <div class="field-value">${p.activity_level || 'Moderate'}</div>
        </div>
        <div class="info-field">
            <div class="field-label">Blood Group / Type</div>
            <div class="field-value">${p.blood_type || 'Unknown'}</div>
        </div>

        <!-- 3. Identification & Insurance -->
        <div style="grid-column: 1 / -1; margin-top: 1rem;">
            <h4 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>📑</span> Identification & Insurance
            </h4>
        </div>
        <div class="info-field">
            <div class="field-label">Microchip ID</div>
            <div class="field-value">${p.microchip_id || 'Not microchipped'}</div>
        </div>
        <div class="info-field">
            <div class="field-label">City Registration / Tag ID</div>
            <div class="field-value">${p.registration_id || 'Not registered'}</div>
        </div>
        <div class="info-field">
            <div class="field-label">Pet Insurance Provider</div>
            <div class="field-value">${p.insurance_provider || 'No insurance recorded'}</div>
        </div>
        <div class="info-field">
            <div class="field-label">Insurance Policy Number</div>
            <div class="field-value">${p.insurance_policy_number || 'N/A'}</div>
        </div>

        <!-- 4. Emergency Contacts & Notes -->
        <div style="grid-column: 1 / -1; margin-top: 1rem;">
            <h4 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>📞</span> Emergency Contacts & Notes
            </h4>
        </div>
        <div class="info-field">
            <div class="field-label">Emergency Contact</div>
            <div class="field-value">${p.emergency_contact_name || 'N/A'} (${p.emergency_contact_phone || 'No phone'})</div>
        </div>
        <div class="info-field" style="grid-column: 1 / -1;">
            <div class="field-label">Special Care & Personality Notes</div>
            <div class="field-value">${p.notes || 'No special notes'}</div>
        </div>
    `;
}

function openEditPetInfo() {
    if (!currentPet) return;
    const p = currentPet;
    
    document.getElementById('edit-name').value = p.name || '';
    document.getElementById('edit-species').value = p.species || 'Dog';
    document.getElementById('edit-breed').value = p.breed || '';
    document.getElementById('edit-dob').value = p.date_of_birth || '';
    document.getElementById('edit-gender').value = p.gender || '';
    document.getElementById('edit-color').value = p.color || '';
    document.getElementById('edit-weight').value = p.weight_kg != null ? p.weight_kg : '';
    
    // Medical
    document.getElementById('edit-allergies').value = p.allergies || '';
    document.getElementById('edit-conditions').value = p.medical_conditions || '';
    document.getElementById('edit-diet').value = p.dietary_needs || '';
    document.getElementById('edit-neutered').value = p.is_neutered ? 'true' : 'false';
    document.getElementById('edit-activity').value = p.activity_level || 'Moderate';
    document.getElementById('edit-blood-type').value = p.blood_type || '';
    
    // Identification & Insurance
    document.getElementById('edit-microchip').value = p.microchip_id || '';
    document.getElementById('edit-reg-id').value = p.registration_id || '';
    document.getElementById('edit-insurance-provider').value = p.insurance_provider || '';
    document.getElementById('edit-insurance-policy').value = p.insurance_policy_number || '';
    
    // Emergency & Notes
    document.getElementById('edit-ec-name').value = p.emergency_contact_name || '';
    document.getElementById('edit-ec-phone').value = p.emergency_contact_phone || '';
    document.getElementById('edit-notes').value = p.notes || '';
    
    openModal('pet-info-modal');
}

async function submitPetInfo(e) {
    e.preventDefault();
    try {
        const data = getFormData('pet-info-form');
        if (data.weight_kg) data.weight_kg = parseFloat(data.weight_kg);
        if (data.is_neutered) data.is_neutered = data.is_neutered === 'true';

        const response = await fetch(`/pets/${currentPetId}`, {
            method: 'PUT',
            headers: apiHeaders,
            body: JSON.stringify(data)
        });
        if (response.ok) {
            closeModal('pet-info-modal');
            await loadPetProfile();
            loadPetInfo();
            showToast('Pet health profile updated successfully! 📝');
        } else { 
            showToast('Failed to update pet info', 'error'); 
        }
    } catch (error) { 
        showToast('Error updating pet info', 'error'); 
    }
}


// ==================== CLINICS & VETS ====================

async function loadClinicsAndVets() {
    try {
        const [cRes, vRes] = await Promise.all([
            fetch('/api/clinics', { headers: apiHeaders }),
            fetch('/api/veterinarians', { headers: apiHeaders })
        ]);
        const cData = await cRes.json();
        const vData = await vRes.json();
        allClinics = cData.clinics || [];
        allVets = vData.veterinarians || [];

        const clinicSelect = document.getElementById('appt-clinic-select');
        if (clinicSelect) {
            allClinics.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.name}${c.city ? ' — ' + c.city : ''}`;
                clinicSelect.appendChild(opt);
            });
        }
    } catch (error) { 
        console.error('Error loading clinics/vets:', error); 
    }
}

function loadVetsForClinic(clinicId) {
    const vetSelect = document.getElementById('appt-vet-select');
    if (!vetSelect) return;
    vetSelect.innerHTML = '<option value="">Select vet...</option>';
    const filtered = clinicId ? allVets.filter(v => v.clinic_id == clinicId) : allVets;
    filtered.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.name}${v.specialization ? ' (' + v.specialization + ')' : ''}`;
        vetSelect.appendChild(opt);
    });
}
