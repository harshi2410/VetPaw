// VETPAW Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadPets();
    loadUpcoming();
});

// Load user's pets
async function loadPets() {
    const petsContainer = document.getElementById('pets-container');
    
    try {
        const response = await fetch('/pets');
        const data = await response.json();
        
        if (response.ok && data.pets && data.pets.length > 0) {
            // Display pets
            petsContainer.innerHTML = data.pets.map(pet => `
                <div class="pet-card" onclick="window.location.href='/pets/${pet.id}'">
                    <div class="pet-icon">${pet.species === 'Dog' ? '🐶' : pet.species === 'Cat' ? '🐱' : '🐾'}</div>
                    <h3 class="pet-name">${pet.name}</h3>
                    <p class="pet-breed">${pet.breed || 'Mixed Breed'}</p>
                    <p class="pet-details">${pet.age ? pet.age + ' years old' : ''} • ${pet.weight_kg ? pet.weight_kg + ' kg' : ''}</p>
                    <p class="pet-details">VETPAW ID: ${pet.vetpaw_id}</p>
                </div>
            `).join('');
        } else {
            // Show empty state
            petsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🐾</div>
                    <p class="empty-text">You haven't registered a pet yet</p>
                    <p class="empty-subtext">Create your first pet profile to start tracking their health.</p>
                    <a href="/pets" class="btn btn-primary">Register My Pet</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        petsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p class="empty-text">Error loading pets</p>
                <p class="empty-subtext">Please try again later.</p>
            </div>
        `;
    }
}

// Load upcoming items (appointments, reminders)
async function loadUpcoming() {
    const upcomingContainer = document.getElementById('upcoming-container');
    
    try {
        // For now, show empty state since we need to implement the full upcoming logic
        // This would call appointments API and check for upcoming vaccinations/medications
        upcomingContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <p class="empty-text">No upcoming appointments or reminders</p>
                <p class="empty-subtext">Register a pet and add appointments to see them here.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading upcoming items:', error);
    }
}
