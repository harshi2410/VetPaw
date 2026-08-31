// VETPAW Breed Care JavaScript

async function getBreedCare() {
    const species = document.getElementById('pet-species').value;
    const breed = document.getElementById('pet-breed').value;
    
    if (!species || !breed) {
        alert('Please select species and enter breed');
        return;
    }
    
    const contentContainer = document.getElementById('breed-care-content');
    contentContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p class="empty-text">Loading breed care information...</p></div>';
    
    try {
        const response = await fetch(`/api/breed-care?species=${encodeURIComponent(species)}&breed=${encodeURIComponent(breed)}`);
        const data = await response.json();
        
        if (response.ok && data.breed_care) {
            displayBreedCare(data.breed_care);
        } else {
            displayGeneralTips();
        }
    } catch (error) {
        console.error('Error getting breed care:', error);
        displayGeneralTips();
    }
}

function displayBreedCare(careInfo) {
    const contentContainer = document.getElementById('breed-care-content');
    
    contentContainer.innerHTML = `
        <div class="breed-care-details">
            <h2>🐾 Care Tips for ${careInfo.breed}</h2>
            <div class="care-section">
                <h3>🥗 Nutrition</h3>
                <p>${careInfo.nutrition || 'Consult your veterinarian for specific dietary recommendations.'}</p>
            </div>
            <div class="care-section">
                <h3>🏃 Exercise</h3>
                <p>${careInfo.exercise || 'Regular exercise is important for overall health.'}</p>
            </div>
            <div class="care-section">
                <h3>✂️ Grooming</h3>
                <p>${careInfo.grooming || 'Grooming needs vary by coat type.'}</p>
            </div>
            <div class="care-section">
                <h3>⚠️ Common Health Issues</h3>
                <p>${careInfo.common_health_issues || 'Regular vet check-ups help prevent health issues.'}</p>
            </div>
            <div class="care-section">
                <h3>💉 Preventive Care</h3>
                <p>${careInfo.preventive_care || 'Keep up with vaccinations and regular check-ups.'}</p>
            </div>
            <div class="care-section">
                <h3>⏱️ Life Expectancy</h3>
                <p>${careInfo.life_expectancy || 'Varies by breed and individual health.'}</p>
            </div>
        </div>
    `;
}

function displayGeneralTips() {
    const contentContainer = document.getElementById('breed-care-content');
    
    contentContainer.innerHTML = `
        <div class="breed-care-details">
            <h2>🐾 General Pet Care Tips</h2>
            <p class="care-note">No specific care information found for this breed. Here are some general tips:</p>
            <div class="care-section">
                <h3>🥗 Nutrition</h3>
                <p>Provide a balanced diet appropriate for your pet's age, size, and activity level. Consult your veterinarian for specific dietary recommendations.</p>
            </div>
            <div class="care-section">
                <h3>🏃 Exercise</h3>
                <p>Provide regular exercise appropriate for your pet's size and energy level. Daily walks and playtime are essential for physical and mental health.</p>
            </div>
            <div class="care-section">
                <h3>✂️ Grooming</h3>
                <p>Maintain regular grooming based on your pet's coat type. This includes brushing, bathing, nail trimming, and dental care.</p>
            </div>
            <div class="care-section">
                <h3>⚠️ Common Health Issues</h3>
                <p>Regular vet check-ups help prevent and detect health issues early. Watch for changes in behavior, appetite, or activity levels.</p>
            </div>
            <div class="care-section">
                <h3>💉 Preventive Care</h3>
                <p>Keep up with vaccinations, parasite prevention, and regular health screenings. Spaying/neutering can also prevent certain health issues.</p>
            </div>
            <div class="care-section">
                <h3>⏱️ Life Expectancy</h3>
                <p>Life expectancy varies by breed and individual health. With proper care, many pets live long, healthy lives.</p>
            </div>
        </div>
    `;
}
