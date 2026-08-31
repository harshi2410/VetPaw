// VETPAW Appointments JavaScript with Dog / Cat Selection

let allUserPets = [];
let allClinics = [];
let allVets = [];
let allAppointments = [];
let selectedSpecies = 'Dog';
let activeListFilter = 'ALL';

const quickReasonsMap = {
    Dog: [
        { label: '🐕 Annual Dog Checkup', text: 'Annual Canine Wellness Examination & Health Checkup' },
        { label: '💉 Rabies & 9-in-1 DHPP', text: 'Canine Vaccination: Rabies & DHPP 9-in-1 Booster' },
        { label: '🪱 Deworming & Flea/Tick', text: 'Deworming and Flea/Tick Preventative Treatment' },
        { label: '🦷 Dental Cleaning', text: 'Canine Dental Scaling and Oral Health Check' },
        { label: '✂️ Spay / Neuter Consult', text: 'Canine Spay / Neuter Consultation and Pre-Op Screening' },
        { label: '🩺 Skin / Allergy Exam', text: 'Skin Rash, Itching & Allergy Consultation' }
    ],
    Cat: [
        { label: '🐈 Feline Wellness Exam', text: 'Annual Feline Wellness Checkup & Physical Exam' },
        { label: '💉 Rabies & FVRCP Vaccine', text: 'Feline Vaccination: Rabies & FVRCP 3-in-1 Vaccine' },
        { label: '🐱 Hairball / Digestive Care', text: 'Hairball, Vomiting & Digestive Health Consultation' },
        { label: '🦷 Feline Dental Care', text: 'Feline Dental Scaling & Gingivitis Treatment' },
        { label: '✂️ Spay / Neuter Consult', text: 'Feline Spay / Neuter Consultation' },
        { label: '🩺 Senior Cat Screening', text: 'Senior Feline Health & Kidney Function Screening' }
    ],
    Other: [
        { label: '🐾 General Wellness Check', text: 'General Wellness & Preventive Health Checkup' },
        { label: '💉 Routine Vaccination', text: 'Routine Preventive Vaccination' },
        { label: '🩹 Wound / Injury Exam', text: 'Wound, Limping or Injury Examination' },
        { label: '🩺 Health Consultation', text: 'Veterinary Diagnostic Consultation' }
    ]
};

document.addEventListener('DOMContentLoaded', async function() {
    // 1. Check URL parameters for preselected pet or species
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedPetId = urlParams.get('pet_id');
    const preselectedSpecies = urlParams.get('species');

    if (preselectedSpecies && (preselectedSpecies === 'Dog' || preselectedSpecies === 'Cat' || preselectedSpecies === 'Other')) {
        selectedSpecies = preselectedSpecies;
    }

    // 2. Load master data
    await loadPets();
    await loadClinicsAndVets();
    await loadAppointments();

    // 3. Initialize species selection
    selectSpecies(selectedSpecies, preselectedPetId);

    // 4. Appointment form submit
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentBooking);
    }
});

// ==================== SPECIES & PET SELECTION ====================

function selectSpecies(species, targetPetId = null) {
    selectedSpecies = species;
    document.getElementById('selected-species-input').value = species;

    // Update species buttons UI
    document.querySelectorAll('.species-select-btn').forEach(btn => {
        const isMatch = btn.getAttribute('data-species') === species;
        btn.classList.toggle('active', isMatch);
        if (isMatch) {
            btn.style.background = 'var(--primary-color)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--primary-color)';
        } else {
            btn.style.background = '#f9f9f9';
            btn.style.color = 'var(--text-dark)';
            btn.style.borderColor = '#ddd';
        }
    });

    // Update label
    const label = document.getElementById('pet-select-label');
    if (label) {
        label.textContent = species === 'Dog' ? 'Select Registered Dog *' : (species === 'Cat' ? 'Select Registered Cat *' : 'Select Pet *');
    }

    // Populate pet dropdown filtered by species
    populatePetSelect(species, targetPetId);

    // Populate quick reason chips
    renderQuickReasons(species);
}

function populatePetSelect(species, targetPetId = null) {
    const petSelect = document.getElementById('pet-select');
    if (!petSelect) return;

    petSelect.innerHTML = '<option value="">-- Choose from your pets or add unregistered --</option>';

    const filteredPets = allUserPets.filter(p => {
        if (species === 'Dog') return p.species === 'Dog';
        if (species === 'Cat') return p.species === 'Cat';
        return p.species !== 'Dog' && p.species !== 'Cat';
    });

    const emoji = species === 'Dog' ? '🐶' : (species === 'Cat' ? '🐱' : '🐾');

    if (filteredPets.length > 0) {
        const userGroup = document.createElement('optgroup');
        userGroup.label = `My Registered ${species}s`;
        filteredPets.forEach(pet => {
            const opt = document.createElement('option');
            opt.value = pet.id;
            opt.textContent = `${emoji} ${pet.name} (${pet.breed || pet.species})`;
            if (targetPetId && String(pet.id) === String(targetPetId)) {
                opt.selected = true;
            }
            userGroup.appendChild(opt);
        });
        petSelect.appendChild(userGroup);
    }

    // Quick option for unregistered dog/cat
    const customGroup = document.createElement('optgroup');
    customGroup.label = 'Unregistered / New Pet';
    const customOpt = document.createElement('option');
    customOpt.value = 'CUSTOM';
    customOpt.textContent = `➕ Enter a new ${species} name directly`;
    customGroup.appendChild(customOpt);
    petSelect.appendChild(customGroup);

    // Auto select first if matching
    if (!targetPetId && filteredPets.length > 0) {
        petSelect.value = filteredPets[0].id;
    } else if (targetPetId) {
        petSelect.value = targetPetId;
    } else {
        petSelect.value = 'CUSTOM';
    }

    handlePetSelectionChange(petSelect.value);
}

function handlePetSelectionChange(val) {
    const customGroup = document.getElementById('custom-pet-name-group');
    const customInput = document.getElementById('custom-pet-name');
    
    if (val === 'CUSTOM' || !val) {
        if (customGroup) customGroup.style.display = 'block';
        if (customInput) customInput.required = true;
    } else {
        if (customGroup) customGroup.style.display = 'none';
        if (customInput) customInput.required = false;
    }
}

function renderQuickReasons(species) {
    const container = document.getElementById('quick-reasons-container');
    if (!container) return;

    const reasons = quickReasonsMap[species] || quickReasonsMap.Other;
    container.innerHTML = reasons.map(r => `
        <button type="button" class="btn btn-secondary btn-small" onclick="setAppointmentReason('${r.text.replace(/'/g, "\\'")}')" style="font-size: 0.8rem; padding: 4px 10px; border-radius: 20px; background: #F5F5F5; border: 1px solid #E0E0E0; cursor: pointer;">
            ${r.label}
        </button>
    `).join('');
}

function setAppointmentReason(reasonText) {
    const reasonInput = document.getElementById('appointment-reason');
    if (reasonInput) {
        reasonInput.value = reasonText;
        reasonInput.focus();
    }
}

// ==================== LOAD MASTER DATA ====================

async function loadPets() {
    try {
        const response = await fetch('/pets', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const data = await response.json();
        if (response.ok && data.pets) {
            allUserPets = data.pets;
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

async function loadClinicsAndVets() {
    try {
        const [clinicsRes, vetsRes] = await Promise.all([
            fetch('/api/clinics'),
            fetch('/api/veterinarians')
        ]);
        const clinicsData = await clinicsRes.json();
        const vetsData = await vetsRes.json();

        allClinics = clinicsData.clinics || [];
        allVets = vetsData.veterinarians || [];

        const clinicSelect = document.getElementById('clinic-select');
        if (clinicSelect && allClinics.length > 0) {
            clinicSelect.innerHTML = '<option value="">-- Choose Clinic --</option>';
            allClinics.forEach(clinic => {
                const opt = document.createElement('option');
                opt.value = clinic.id;
                opt.textContent = `🏥 ${clinic.name} (${clinic.city})${clinic.emergency_services ? ' [24/7]' : ''}`;
                clinicSelect.appendChild(opt);
            });
            clinicSelect.value = allClinics[0].id;
            filterVetsByClinic(allClinics[0].id);
        }
    } catch (error) {
        console.error('Error loading clinics/vets:', error);
    }
}

function filterVetsByClinic(clinicId) {
    const vetSelect = document.getElementById('vet-select');
    if (!vetSelect) return;

    vetSelect.innerHTML = '<option value="">-- Choose Veterinarian --</option>';
    const filtered = clinicId ? allVets.filter(v => v.clinic_id == clinicId) : allVets;

    filtered.forEach(vet => {
        const opt = document.createElement('option');
        opt.value = vet.id;
        opt.textContent = `👨‍⚕️ ${vet.full_name || vet.name} (${vet.specialization || 'General Practice'})`;
        vetSelect.appendChild(opt);
    });

    if (filtered.length > 0) {
        vetSelect.value = filtered[0].id;
    }
}

// ==================== APPOINTMENT BOOKING & LIST ====================

async function handleAppointmentBooking(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const rawData = Object.fromEntries(formData);
    
    let petId = null;
    let petName = '';
    
    if (rawData.pet_id && rawData.pet_id !== 'CUSTOM') {
        petId = parseInt(rawData.pet_id);
    } else {
        petName = rawData.pet_name || `${selectedSpecies} Patient`;
    }

    const payload = {
        pet_id: petId,
        pet_species: selectedSpecies,
        pet_name: petName,
        clinic_id: rawData.clinic_id ? parseInt(rawData.clinic_id) : null,
        veterinarian_id: rawData.veterinarian_id ? parseInt(rawData.veterinarian_id) : null,
        appointment_date: rawData.appointment_date,
        appointment_time: rawData.appointment_time,
        reason: rawData.reason,
        notes: rawData.notes || ''
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Scheduling Visit...';
    
    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert(`🎉 Appointment confirmed for ${data.appointment.pet_species || selectedSpecies} (${data.appointment.pet_name})!\n\nReason: ${data.appointment.reason}\nDate: ${data.appointment.appointment_date} at ${data.appointment.appointment_time || 'Scheduled Time'}`);
            form.reset();
            selectSpecies(selectedSpecies);
            loadAppointments();
        } else {
            alert(data.error || 'Failed to book appointment. Please try again.');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        alert('Error booking appointment. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm & Book Appointment 📅';
    }
}

async function loadAppointments() {
    const container = document.getElementById('appointments-container');
    
    try {
        const response = await fetch('/api/appointments');
        const data = await response.json();
        
        if (response.ok && data.appointments) {
            allAppointments = data.appointments;
            renderAppointmentList();
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">⚠️</div>
                    <p class="empty-text">Error loading appointments</p>
                </div>
            `;
        }
    }
}

function filterAppointmentList(filterType) {
    activeListFilter = filterType;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(filterType) || (filterType === 'ALL' && btn.textContent === 'All'));
    });
    renderAppointmentList();
}

function renderAppointmentList() {
    const container = document.getElementById('appointments-container');
    if (!container) return;

    let filtered = allAppointments;
    if (activeListFilter === 'Dog') {
        filtered = allAppointments.filter(a => (a.pet_species && a.pet_species.toLowerCase() === 'dog'));
    } else if (activeListFilter === 'Cat') {
        filtered = allAppointments.filter(a => (a.pet_species && a.pet_species.toLowerCase() === 'cat'));
    }

    if (filtered.length > 0) {
        const emojiMap = { Dog: '🐶', dog: '🐶', Cat: '🐱', cat: '🐱', Bird: '🐦', Rabbit: '🐰' };

        container.innerHTML = filtered.map(apt => {
            const species = apt.pet_species || 'Other';
            const emoji = emojiMap[species] || '🐾';
            const statusClass = apt.status === 'SCHEDULED' ? 'green' : (apt.status === 'COMPLETED' ? 'brown' : 'red');

            return `
                <div class="record-card" style="background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #eee; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div class="record-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.5rem;">${emoji}</span>
                                <div>
                                    <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-dark);">${apt.pet_name || 'Patient'}</h4>
                                    <span style="font-size: 0.8rem; color: var(--text-light);">${species}</span>
                                </div>
                            </div>
                            <span class="badge ${statusClass}">${apt.status}</span>
                        </div>

                        <div style="background: #FAFAFA; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem; border-left: 3px solid var(--primary-color);">
                            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-dark); margin-bottom: 0.25rem;">${apt.reason}</div>
                            <div style="font-size: 0.85rem; color: var(--text-light);">📅 ${apt.appointment_date} at ${apt.appointment_time || 'TBD'}</div>
                        </div>

                        <p class="record-detail" style="margin: 0.25rem 0; font-size: 0.85rem;">👨‍⚕️ <strong>Doctor:</strong> ${apt.veterinarian_name || 'Assigned Vet'}</p>
                        <p class="record-detail" style="margin: 0.25rem 0; font-size: 0.85rem;">🏢 <strong>Clinic:</strong> ${apt.clinic_name || 'Veterinary Clinic'}</p>
                        ${apt.notes ? `<p class="record-detail" style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-light);">📝 <em>${apt.notes}</em></p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: 16px; border: 2px dashed #e0e0e0;">
                <div class="empty-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">📅</div>
                <h3 style="color: var(--text-dark); margin-bottom: 0.5rem;">No ${activeListFilter === 'ALL' ? '' : activeListFilter + ' '}Appointments Found</h3>
                <p class="empty-subtext" style="color: var(--text-light); max-width: 400px; margin: 0 auto;">
                    Select Dog or Cat above to schedule a new appointment with our verified veterinarians.
                </p>
            </div>
        `;
    }
}

