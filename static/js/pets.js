// VETPAW Pets & Health Tracker JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadPets();
    
    // Pet registration form
    const petForm = document.getElementById('pet-registration-form');
    if (petForm) {
        petForm.addEventListener('submit', handlePetRegistration);
    }
});

function handleSpeciesChange(species) {
    const breedInput = document.querySelector('input[name="breed"]');
    if (breedInput && !breedInput.value) {
        if (species === 'Dog') breedInput.placeholder = 'e.g., Golden Retriever, Labrador, Indie';
        else if (species === 'Cat') breedInput.placeholder = 'e.g., Persian, Siamese, Domestic Shorthair';
        else if (species === 'Bird') breedInput.placeholder = 'e.g., Parakeet, Cockatiel';
        else if (species === 'Rabbit') breedInput.placeholder = 'e.g., Holland Lop, Netherland Dwarf';
        else breedInput.placeholder = 'e.g., Breed / Variety';
    }
}

// Show add pet form
function showAddPetForm() {
    const formContainer = document.getElementById('add-pet-form');
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

// Hide add pet form
function hideAddPetForm() {
    document.getElementById('add-pet-form').style.display = 'none';
    document.getElementById('pet-registration-form').reset();
}

// Load user's pets with rich health tracker cards
async function loadPets() {
    const petsContainer = document.getElementById('pets-container');
    
    try {
        const response = await fetch('/pets', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const data = await response.json();
        
        if (response.ok && data.pets && data.pets.length > 0) {
            const emojiMap = {
                Dog: '🐶', dog: '🐶',
                Cat: '🐱', cat: '🐱',
                Bird: '🐦', bird: '🐦',
                Rabbit: '🐰', rabbit: '🐰',
                Hamster: '🐹', hamster: '🐹',
                Fish: '🐠', fish: '🐠'
            };

            petsContainer.innerHTML = data.pets.map(pet => {
                const emoji = emojiMap[pet.species] || '🐾';
                const ageStr = pet.age != null ? `${pet.age} yr${pet.age === 1 ? '' : 's'}` : 'Age unknown';
                const weightStr = pet.weight_kg ? `${pet.weight_kg} kg` : 'Weight unrecorded';
                const neuteredBadge = pet.is_neutered ? '<span style="background: rgba(46,125,50,0.12); color: #2E7D32; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600;">✓ Neutered</span>' : '';
                
                // Allergies pill
                const allergyPill = pet.allergies ? `<div style="font-size: 0.8rem; color: #D32F2F; background: #FFEBEE; padding: 3px 8px; border-radius: 6px; margin-top: 0.35rem; display: flex; align-items: center; gap: 4px;">⚠️ Allergies: <strong>${pet.allergies}</strong></div>` : '';
                
                // Medical notes / conditions pill
                const medicalPill = pet.medical_conditions ? `<div style="font-size: 0.8rem; color: #5D4037; background: #EFEBE9; padding: 3px 8px; border-radius: 6px; margin-top: 0.35rem;">🩺 History: <strong>${pet.medical_conditions}</strong></div>` : '';

                // Dietary info
                const dietPill = pet.dietary_needs ? `<div style="font-size: 0.8rem; color: #0277BD; background: #E1F5FE; padding: 3px 8px; border-radius: 6px; margin-top: 0.35rem;">🥣 Diet: <strong>${pet.dietary_needs}</strong></div>` : '';

                return `
                    <div class="pet-card" style="background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #eee; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, box-shadow 0.2s; position: relative;">
                        <div>
                            <!-- Header Row -->
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div class="pet-icon" style="font-size: 2.2rem; background: #F5F5F5; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        ${emoji}
                                    </div>
                                    <div>
                                        <h3 style="margin: 0; font-size: 1.3rem; color: var(--text-dark);">${pet.name}</h3>
                                        <p style="margin: 2px 0 0 0; color: var(--text-light); font-size: 0.85rem; font-weight: 500;">
                                            ${pet.species} • ${pet.breed || 'Mixed Breed'}
                                        </p>
                                    </div>
                                </div>
                                <span style="background: #E8F5E9; color: #2E7D32; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 8px;">
                                    ${pet.vetpaw_id}
                                </span>
                            </div>

                            <!-- Vitals Badges -->
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 0.75rem 0; font-size: 0.85rem;">
                                <span style="background: #FAFAFA; border: 1px solid #E0E0E0; padding: 3px 8px; border-radius: 8px;">🎂 ${ageStr}</span>
                                <span style="background: #FAFAFA; border: 1px solid #E0E0E0; padding: 3px 8px; border-radius: 8px;">⚖️ ${weightStr}</span>
                                <span style="background: #FAFAFA; border: 1px solid #E0E0E0; padding: 3px 8px; border-radius: 8px;">⚧ ${pet.gender || 'Unknown'}</span>
                                ${neuteredBadge}
                            </div>

                            <!-- Health Tracker Insights -->
                            <div style="margin: 0.5rem 0 1rem 0;">
                                ${allergyPill}
                                ${medicalPill}
                                ${dietPill}
                            </div>
                        </div>

                        <!-- Card Action Buttons -->
                        <div style="border-top: 1px solid #F0F0F0; padding-top: 1rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
                            <a href="/pets/${pet.id}" class="btn btn-primary" style="text-align: center; font-size: 0.9rem; padding: 0.6rem 1rem; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <span>🩺</span> Open Health Tracker & Records
                            </a>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                <a href="/appointments?pet_id=${pet.id}&species=${encodeURIComponent(pet.species)}" class="btn btn-secondary" style="text-align: center; font-size: 0.8rem; padding: 0.45rem 0.5rem; border-radius: 8px;">
                                    📅 Book Visit
                                </a>
                                <a href="/chat?pet_id=${pet.id}" class="btn btn-secondary" style="text-align: center; font-size: 0.8rem; padding: 0.45rem 0.5rem; border-radius: 8px;">
                                    💬 AI Advice
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // Show empty state
            petsContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: 16px; border: 2px dashed #e0e0e0;">
                    <div class="empty-icon" style="font-size: 3rem; margin-bottom: 1rem;">🐾</div>
                    <h3 style="color: var(--text-dark); margin-bottom: 0.5rem;">No Pets Registered Yet</h3>
                    <p class="empty-subtext" style="color: var(--text-light); max-width: 450px; margin: 0 auto 1.5rem auto;">
                        Register your dog, cat, or other pet to unlock the automated health tracker, vaccination schedules, and tailored medical AI advice.
                    </p>
                    <button class="btn btn-primary" onclick="showAddPetForm()" style="padding: 0.75rem 1.75rem; font-size: 1rem;">
                        + Register My First Pet
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        petsContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⚠️</div>
                <p class="empty-text">Error loading pets</p>
                <p class="empty-subtext">Please try again later.</p>
            </div>
        `;
    }
}

// Handle pet registration
async function handlePetRegistration(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const petData = Object.fromEntries(formData);
    
    // Parse weight and boolean
    if (petData.weight_kg) petData.weight_kg = parseFloat(petData.weight_kg);
    if (petData.is_neutered) petData.is_neutered = petData.is_neutered === 'true';
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Profile & Initializing Health Tracker...';
    
    try {
        const response = await fetch('/pets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(petData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            hideAddPetForm();
            loadPets();
            alert(`🎉 ${data.pet.name} (${data.pet.species}) registered successfully!\n\nVETPAW ID: ${data.pet.vetpaw_id}\nHealth Tracker has been initialized.`);
        } else {
            // Error
            alert(data.error || 'Failed to register pet. Please try again.');
        }
    } catch (error) {
        console.error('Error registering pet:', error);
        alert('Error registering pet. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save & Start Health Tracking 🐾';
    }
}

