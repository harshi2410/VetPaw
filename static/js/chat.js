// VETPAW AI Assistant JavaScript

let currentSelectedPetId = '';
let userPets = [];
let allClinics = [];
let allVets = [];

document.addEventListener('DOMContentLoaded', function() {
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
    
    // Load pets, clinics, and vets
    loadUserPets();
    loadClinicsAndVets();
});

// ==================== PET SELECTOR & CONTEXT ====================

async function loadUserPets() {
    const petCardsContainer = document.getElementById('pet-cards');
    const bookingPetSelect = document.getElementById('booking-pet-select');
    
    try {
        const response = await fetch('/pets', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const data = await response.json();
        
        if (response.ok && data.pets) {
            userPets = data.pets;
            
            // Render mini pet cards
            if (petCardsContainer) {
                let html = `
                    <div class="pet-card-mini selected" data-pet-id="" onclick="selectPet('')">
                        <span class="pet-card-emoji">🌐</span>
                        <div style="display:flex; flex-direction:column;">
                            <span class="pet-card-name">General Question</span>
                            <span class="pet-card-meta">No specific pet</span>
                        </div>
                    </div>
                `;
                
                const emojiMap = { Dog: '🐶', dog: '🐶', Cat: '🐱', cat: '🐱', Bird: '🐦', Rabbit: '🐰' };

                userPets.forEach(pet => {
                    const emoji = emojiMap[pet.species] || '🐾';
                    const ageText = pet.age != null ? `${pet.age} yr` : '';
                    const meta = [pet.breed || pet.species, ageText].filter(Boolean).join(' • ');

                    html += `
                        <div class="pet-card-mini" data-pet-id="${pet.id}" onclick="selectPet('${pet.id}')">
                            <span class="pet-card-emoji">${emoji}</span>
                            <div style="display:flex; flex-direction:column;">
                                <span class="pet-card-name">${pet.name}</span>
                                <span class="pet-card-meta">${meta}</span>
                            </div>
                        </div>
                    `;
                });
                
                petCardsContainer.innerHTML = html;
            }
            
            // Populate booking pet select dropdown
            if (bookingPetSelect) {
                bookingPetSelect.innerHTML = '<option value="">Select pet / species...</option>';
                
                const emojiMap = { Dog: '🐶', dog: '🐶', Cat: '🐱', cat: '🐱', Bird: '🐦', Rabbit: '🐰' };
                
                if (userPets.length > 0) {
                    const userGroup = document.createElement('optgroup');
                    userGroup.label = 'My Pets';
                    userPets.forEach(pet => {
                        const opt = document.createElement('option');
                        opt.value = pet.id;
                        const emoji = emojiMap[pet.species] || '🐾';
                        opt.textContent = `${emoji} ${pet.name} (${pet.breed || pet.species})`;
                        userGroup.appendChild(opt);
                    });
                    bookingPetSelect.appendChild(userGroup);
                }

                // General options
                const genGroup = document.createElement('optgroup');
                genGroup.label = 'General Species';
                const dogOpt = document.createElement('option');
                dogOpt.value = 'dog_general';
                dogOpt.textContent = '🐶 Dog (General)';
                const catOpt = document.createElement('option');
                catOpt.value = 'cat_general';
                catOpt.textContent = '🐱 Cat (General)';
                genGroup.appendChild(dogOpt);
                genGroup.appendChild(catOpt);
                bookingPetSelect.appendChild(genGroup);
            }
        }
    } catch (error) {
        console.error('Error loading user pets:', error);
    }
}

function selectPet(petId) {
    currentSelectedPetId = petId ? String(petId) : '';
    
    // Update selected card styling
    document.querySelectorAll('.pet-card-mini').forEach(card => {
        const id = card.getAttribute('data-pet-id') || '';
        card.classList.toggle('selected', id === currentSelectedPetId);
    });
    
    // Update quick prompts chips dynamically
    updateQuickPrompts();
    
    // Preselect pet in booking form
    const bookingPetSelect = document.getElementById('booking-pet-select');
    if (bookingPetSelect) {
        if (currentSelectedPetId) {
            bookingPetSelect.value = currentSelectedPetId;
        } else {
            bookingPetSelect.selectedIndex = 0;
        }
    }
}

function updateQuickPrompts() {
    const container = document.getElementById('quick-prompts');
    if (!container) return;
    
    if (currentSelectedPetId) {
        const selectedPet = userPets.find(p => String(p.id) === currentSelectedPetId);
        if (selectedPet) {
            const name = selectedPet.name;
            const emoji = selectedPet.species === 'Cat' || selectedPet.species === 'cat' ? '🐱' : '🐶';
            container.innerHTML = `
                <button class="prompt-chip" onclick="sendQuickPrompt('Ask about ${name}')">🔍 Ask about ${name}</button>
                <button class="prompt-chip" onclick="sendQuickPrompt('What should ${name} eat?')">🍖 What should ${name} eat?</button>
                <button class="prompt-chip" onclick="sendQuickPrompt('Is ${name} due for vaccines?')">💉 Is ${name} due for vaccines?</button>
                <button class="prompt-chip" onclick="sendQuickPrompt('${emoji} Care tips for ${selectedPet.breed || name}')">🐾 ${selectedPet.breed || name} care tips</button>
            `;
            return;
        }
    }
    
    // Default general chips
    container.innerHTML = `
        <button class="prompt-chip" onclick="sendQuickPrompt('What can dogs eat?')">🍖 What can dogs eat?</button>
        <button class="prompt-chip" onclick="sendQuickPrompt('Emergency help')">🚨 Emergency help</button>
        <button class="prompt-chip" onclick="sendQuickPrompt('Breed care tips')">🐾 Breed care tips</button>
        <button class="prompt-chip" onclick="sendQuickPrompt('How often should I walk my dog?')">🚶 Walking schedule</button>
    `;
}

function sendQuickPrompt(promptText) {
    const input = document.getElementById('user-input');
    if (input) {
        input.value = promptText;
        sendMessage();
    }
}

// ==================== MESSAGING & CHATBOT ====================

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const message = userInput ? userInput.value.trim() : '';
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    userInput.value = '';
    
    // Disable send button while waiting
    if (sendBtn) {
        sendBtn.disabled = true;
    }
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const payload = {
            message: message,
            pet_id: currentSelectedPetId ? parseInt(currentSelectedPetId) : null
        };
        
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Add bot response
        addMessage(data.response, 'bot', data.severity);
        
        // If severity is high or moderate, show nearby emergency vets recommendation
        if (data.severity === 'high' || data.severity === 'moderate') {
            setTimeout(() => {
                loadNearbyVets();
            }, 800);
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error processing your request. Please try again.', 'bot');
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
        }
    }
}

function showTypingIndicator() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    
    // Remove if already exists
    hideTypingIndicator();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'chat-typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    chatWindow.appendChild(typingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function addMessage(content, sender, severity = null) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    
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

async function loadNearbyVets() {
    try {
        const response = await fetch('/veterinarians?emergency_only=true');
        const data = await response.json();
        
        if (data.veterinarians && data.veterinarians.length > 0) {
            const topVets = data.veterinarians.slice(0, 3);
            const vetList = topVets.map(vet => 
                `• ${vet.name} - ${vet.phone || 'Phone upon request'} (${vet.specialization || 'Vet'})`
            ).join('\n');
            
            addMessage(`🏥 **Recommended Emergency Clinics & Vets:**\n\n${vetList}\n\nYou can book an appointment using the sidebar booking form.`, 'bot');
        }
    } catch (error) {
        console.error('Error loading nearby vets:', error);
    }
}

function clearChat() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    
    const welcomeMessage = chatWindow.querySelector('.message.bot');
    chatWindow.innerHTML = '';
    
    if (welcomeMessage) {
        chatWindow.appendChild(welcomeMessage);
    }
}

// ==================== APPOINTMENT BOOKING ====================

function toggleBookingForm() {
    const form = document.getElementById('booking-form');
    const toggle = document.getElementById('booking-toggle');
    if (!form) return;
    
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'flex';
        if (toggle) toggle.classList.add('open');
    } else {
        form.style.display = 'none';
        if (toggle) toggle.classList.remove('open');
    }
}

function toggleSidePanel() {
    const panel = document.getElementById('chat-side-panel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

async function loadClinicsAndVets() {
    try {
        const [cRes, vRes] = await Promise.all([
            fetch('/api/clinics', { headers: { 'Accept': 'application/json' } }),
            fetch('/api/veterinarians', { headers: { 'Accept': 'application/json' } })
        ]);
        const cData = await cRes.json();
        const vData = await vRes.json();
        allClinics = cData.clinics || [];
        allVets = vData.veterinarians || [];
        
        const clinicSelect = document.getElementById('booking-clinic-select');
        if (clinicSelect) {
            clinicSelect.innerHTML = '<option value="">Select clinic...</option>';
            allClinics.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.name}${c.city ? ' (' + c.city + ')' : ''}`;
                clinicSelect.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Error loading clinics and vets:', error);
    }
}

function loadBookingVets(clinicId) {
    const vetSelect = document.getElementById('booking-vet-select');
    if (!vetSelect) return;
    
    vetSelect.innerHTML = '<option value="">Select vet...</option>';
    const filtered = clinicId ? allVets.filter(v => String(v.clinic_id) === String(clinicId)) : allVets;
    
    filtered.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.name}${v.specialization ? ' — ' + v.specialization : ''}`;
        vetSelect.appendChild(opt);
    });
}

async function bookAppointment() {
    const petVal = document.getElementById('booking-pet-select')?.value;
    const clinicId = document.getElementById('booking-clinic-select')?.value;
    const vetId = document.getElementById('booking-vet-select')?.value;
    const dateVal = document.getElementById('booking-date')?.value;
    const timeVal = document.getElementById('booking-time')?.value;
    const reasonVal = document.getElementById('booking-reason')?.value?.trim();
    const msgContainer = document.getElementById('booking-message');

    if (!dateVal) {
        showBookingFeedback('Please pick an appointment date.', 'error');
        return;
    }

    if (!reasonVal) {
        showBookingFeedback('Please enter the reason for the appointment.', 'error');
        return;
    }

    let appointmentDate = dateVal;
    if (timeVal) {
        appointmentDate += `T${timeVal}`;
    }

    let petId = null;
    if (petVal && !isNaN(parseInt(petVal))) {
        petId = parseInt(petVal);
    } else if (userPets.length > 0) {
        petId = userPets[0].id;
    }

    const payload = {
        pet_id: petId,
        clinic_id: clinicId ? parseInt(clinicId) : null,
        veterinarian_id: vetId ? parseInt(vetId) : null,
        appointment_date: appointmentDate,
        reason: reasonVal,
        notes: petVal === 'dog_general' ? 'Species: Dog' : petVal === 'cat_general' ? 'Species: Cat' : ''
    };

    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showBookingFeedback('🎉 Appointment booked successfully!', 'success');
            showChatToast('Appointment booked successfully! 📅');
            
            // Reset form
            document.getElementById('booking-date').value = '';
            document.getElementById('booking-time').value = '';
            document.getElementById('booking-reason').value = '';
            
            // Notify in chat
            addMessage(`📅 I've booked your appointment on ${dateVal}${timeVal ? ' at ' + timeVal : ''} for "${reasonVal}". You can view and manage it on the Appointments page!`, 'bot');
        } else {
            showBookingFeedback(data.error || 'Failed to book appointment. Please check all fields.', 'error');
        }
    } catch (error) {
        showBookingFeedback('Error booking appointment. Please try again.', 'error');
    }
}

function showBookingFeedback(msg, type) {
    const container = document.getElementById('booking-message');
    if (container) {
        container.textContent = msg;
        container.className = `booking-message ${type}`;
        setTimeout(() => {
            container.textContent = '';
            container.className = 'booking-message';
        }, 5000);
    }
}

function showChatToast(message) {
    const toast = document.getElementById('chat-toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}
