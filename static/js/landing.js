// VETPAW Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize chat
    initChat();
    
    // Initialize tabs
    initTabs();
    
    // Load pets if logged in
    loadPets();
    
    // Feature card animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Stats counter animation
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = target.textContent;
                target.textContent = finalValue;
                statsObserver.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => statsObserver.observe(stat));
});

// Chat functionality
function initChat() {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (!message) return;
    
    const chatWindow = document.getElementById('chat-window');
    
    // Add user message
    addMessage(message, 'user');
    userInput.value = '';
    
    // Send to backend
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Add bot response
        addMessage(data.response, 'bot', data.severity);
    } catch (error) {
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function addMessage(content, sender, severity = null) {
    const chatWindow = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (severity) {
        messageDiv.classList.add(`severity-${severity}`);
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    chatWindow.appendChild(messageDiv);
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Tabs functionality
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show target tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName + '-tab') {
                    content.classList.add('active');
                }
            });
        });
    });
}

// Modal functions
function openHealthTracking() {
    document.getElementById('health-tracking-modal').classList.add('active');
}

function openNGOSection() {
    document.getElementById('ngo-modal').classList.add('active');
}

function openBreedCare() {
    document.getElementById('breed-care-modal').classList.add('active');
}

function openEmergencyChat() {
    // Switch to assistant and activate emergency mode
    const chatWindow = document.getElementById('chat-window');
    addMessage('🚨 EMERGENCY MODE ACTIVATED\n\nPlease describe the emergency situation immediately. I will guide you through first aid and help you find the nearest emergency veterinary clinic.\n\n⚠️ If this is a life-threatening emergency, call your local emergency vet or animal hospital RIGHT NOW.', 'bot', 'high');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showAddPetModal() {
    document.getElementById('add-pet-modal').classList.add('active');
}

// Pets
async function loadPets() {
    try {
        const response = await fetch('/pets');
        const data = await response.json();
        
        if (data.pets && data.pets.length > 0) {
            displayPets(data.pets);
            loadPetHealthData(data.pets[0].id);
        }
    } catch (error) {
        console.log('Not logged in or no pets');
    }
}

async function loadPetHealthData(petId) {
    loadVaccinations(petId);
    loadMedications(petId);
    loadHealthRecords(petId);
    loadReminders();
}

async function loadVaccinations(petId) {
    try {
        const response = await fetch(`/pets/${petId}/vaccinations`);
        const data = await response.json();
        displayVaccinations(data.vaccinations);
    } catch (error) {
        console.error('Error loading vaccinations:', error);
    }
}

function displayVaccinations(vaccinations) {
    const vaccinationList = document.getElementById('vaccination-list');
    vaccinationList.innerHTML = '';
    
    if (!vaccinations || vaccinations.length === 0) {
        vaccinationList.innerHTML = '<p>No vaccination records found.</p>';
        return;
    }
    
    vaccinations.forEach(vac => {
        const vacCard = document.createElement('div');
        vacCard.className = 'vet-card';
        const statusClass = vac.status === 'COMPLETED' ? 'green' : 'brown';
        vacCard.innerHTML = `
            <h3>${vac.vaccine_name}</h3>
            <p class="vet-info">💉 Administered: ${vac.administration_date || 'Not yet'}</p>
            <p class="vet-info">📅 Next Due: ${vac.next_due_date || 'N/A'}</p>
            <span class="badge ${statusClass}">${vac.status}</span>
        `;
        vaccinationList.appendChild(vacCard);
    });
}

async function loadMedications(petId) {
    try {
        const response = await fetch(`/pets/${petId}/medications`);
        const data = await response.json();
        displayMedications(data.medications);
    } catch (error) {
        console.error('Error loading medications:', error);
    }
}

function displayMedications(medications) {
    const medicationList = document.getElementById('medication-list');
    medicationList.innerHTML = '';
    
    if (!medications || medications.length === 0) {
        medicationList.innerHTML = '<p>No medication records found.</p>';
        return;
    }
    
    medications.forEach(med => {
        const medCard = document.createElement('div');
        medCard.className = 'vet-card';
        const statusClass = med.is_active ? 'green' : 'brown';
        medCard.innerHTML = `
            <h3>${med.medication_name}</h3>
            <p class="vet-info">💊 Dosage: ${med.dosage}</p>
            <p class="vet-info">⏰ Frequency: ${med.frequency}</p>
            <span class="badge ${statusClass}">${med.is_active ? 'Active' : 'Completed'}</span>
        `;
        medicationList.appendChild(medCard);
    });
}

async function loadHealthRecords(petId) {
    try {
        const response = await fetch(`/pets/${petId}/health-records`);
        const data = await response.json();
        displayHealthRecords(data.health_records);
    } catch (error) {
        console.error('Error loading health records:', error);
    }
}

function displayHealthRecords(records) {
    const healthRecordsDiv = document.getElementById('health-records');
    healthRecordsDiv.innerHTML = '';
    
    if (!records || records.length === 0) {
        healthRecordsDiv.innerHTML = '<p>No health records found.</p>';
        return;
    }
    
    records.forEach(record => {
        const recordCard = document.createElement('div');
        recordCard.className = 'vet-card';
        recordCard.innerHTML = `
            <h3>${record.record_type}</h3>
            <p class="vet-info">📅 Date: ${record.visit_date}</p>
            <p class="vet-info">📝 Notes: ${record.notes || 'No notes'}</p>
        `;
        healthRecordsDiv.appendChild(recordCard);
    });
}

async function loadReminders() {
    try {
        const response = await fetch('/notifications');
        const data = await response.json();
        displayReminders(data.notifications);
    } catch (error) {
        console.error('Error loading reminders:', error);
    }
}

function displayReminders(notifications) {
    const remindersList = document.getElementById('reminders-list');
    remindersList.innerHTML = '';
    
    if (!notifications || notifications.length === 0) {
        remindersList.innerHTML = '<p>No reminders at the moment.</p>';
        return;
    }
    
    notifications.forEach(notif => {
        const notifCard = document.createElement('div');
        notifCard.className = 'vet-card';
        const urgencyClass = notif.type === 'EMERGENCY' ? 'red' : 'brown';
        notifCard.innerHTML = `
            <h3>${notif.title}</h3>
            <p class="vet-info">📅 Due: ${notif.reminder_date}</p>
            <span class="badge ${urgencyClass}">${notif.type}</span>
        `;
        remindersList.appendChild(notifCard);
    });
}

function displayPets(pets) {
    const petsGrid = document.getElementById('pets-grid');
    
    pets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-card';
        petCard.innerHTML = `
            <h3>${pet.name}</h3>
            <p class="vet-info">🐾 ${pet.species} - ${pet.breed}</p>
            <p class="vet-info">🎂 ${pet.date_of_birth}</p>
            <p class="vet-info">⚖️ ${pet.weight_kg} kg</p>
            <p class="vet-info">🆔 ${pet.vetpaw_id}</p>
        `;
        
        const addPetCard = petsGrid.querySelector('.add-pet-card');
        petsGrid.insertBefore(petCard, addPetCard);
    });
}

// Add pet form
document.getElementById('add-pet-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const petData = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/pets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(petData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('add-pet-modal');
            this.reset();
            loadPets();
            alert('Pet added successfully!');
        } else {
            alert(data.error || 'Failed to add pet');
        }
    } catch (error) {
        alert('Error adding pet. Please try again.');
    }
});

// NGO search
async function searchNGOs() {
    const city = document.getElementById('ngo-city').value;
    
    try {
        const response = await fetch(`/ngos?city=${city}`);
        const data = await response.json();
        displayNGOs(data.ngos);
    } catch (error) {
        console.error('Error searching NGOs:', error);
    }
}

function displayNGOs(ngos) {
    const ngoGrid = document.getElementById('ngo-grid');
    ngoGrid.innerHTML = '';
    
    if (!ngos || ngos.length === 0) {
        ngoGrid.innerHTML = '<p>No NGOs found. Try a different city or add NGOs manually.</p>';
        return;
    }
    
    ngos.forEach(ngo => {
        const ngoCard = document.createElement('div');
        ngoCard.className = 'vet-card';
        ngoCard.innerHTML = `
            <h3>${ngo.organization_name}</h3>
            <p class="vet-info">📍 ${ngo.city}, ${ngo.state}</p>
            <p class="vet-info">📞 ${ngo.phone}</p>
            <p class="vet-info">🎯 ${ngo.services_offered}</p>
        `;
        ngoGrid.appendChild(ngoCard);
    });
}

// Breed care
async function getBreedCare() {
    const species = document.getElementById('pet-species').value;
    const breed = document.getElementById('pet-breed').value;
    
    if (!species || !breed) {
        alert('Please select species and enter breed');
        return;
    }
    
    try {
        const response = await fetch(`/breed-care?species=${species}&breed=${breed}`);
        const data = await response.json();
        displayBreedCare(data.breed_care);
    } catch (error) {
        console.error('Error getting breed care:', error);
    }
}

function displayBreedCare(careInfo) {
    const breedContent = document.getElementById('breed-care-content');
    
    if (!careInfo) {
        breedContent.innerHTML = `
            <div class="breed-placeholder">
                <p>No specific care information found for this breed. Here are some general tips:</p>
                <ul style="text-align: left; margin-top: 1rem;">
                    <li>Provide regular exercise appropriate for your pet's size and energy level</li>
                    <li>Maintain a balanced diet with proper portion control</li>
                    <li>Keep up with regular veterinary check-ups and vaccinations</li>
                    <li>Provide mental stimulation through toys and training</li>
                    <li>Ensure proper grooming based on coat type</li>
                </ul>
            </div>
        `;
        return;
    }
    
    breedContent.innerHTML = `
        <h3>🐾 Care Tips for ${careInfo.breed}</h3>
        <div style="margin-top: 1.5rem;">
            <h4>🥗 Nutrition</h4>
            <p>${careInfo.nutrition || 'Consult your veterinarian for specific dietary recommendations.'}</p>
            
            <h4 style="margin-top: 1rem;">🏃 Exercise</h4>
            <p>${careInfo.exercise || 'Regular exercise is important for overall health.'}</p>
            
            <h4 style="margin-top: 1rem;">✂️ Grooming</h4>
            <p>${careInfo.grooming || 'Grooming needs vary by coat type.'}</p>
            
            <h4 style="margin-top: 1rem;">⚠️ Common Health Issues</h4>
            <p>${careInfo.common_health_issues || 'Regular vet check-ups help prevent health issues.'}</p>
        </div>
    `;
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}
