// VETPAW Vets JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Load all veterinarians on page load
    loadVets();
});

async function searchVets() {
    const city = document.getElementById('vet-city').value;
    const specialization = document.getElementById('vet-specialization').value;
    const emergencyOnly = document.getElementById('emergency-only').checked;
    
    let url = '/api/veterinarians?';
    const params = [];
    
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (specialization) params.push(`specialization=${encodeURIComponent(specialization)}`);
    if (emergencyOnly) params.push('emergency_only=true');
    
    url += params.join('&');
    
    loadVets(url);
}

async function loadVets(url = '/api/veterinarians') {
    const resultsContainer = document.getElementById('vets-results');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok && data.veterinarians && data.veterinarians.length > 0) {
            resultsContainer.innerHTML = data.veterinarians.map(vet => `
                <div class="vet-card">
                    <div class="vet-header">
                        <h3>${vet.full_name}</h3>
                        ${vet.is_verified ? '<span class="badge green">Verified</span>' : ''}
                    </div>
                    <p class="vet-info">🏥 ${vet.clinic_name || 'Independent Practice'}</p>
                    <p class="vet-info">📍 ${vet.city}, ${vet.state || ''}</p>
                    <p class="vet-info">📞 ${vet.phone}</p>
                    <p class="vet-info">📧 ${vet.email || 'N/A'}</p>
                    <p class="vet-info">🩺 Specialization: ${vet.specialization || 'General Practice'}</p>
                    ${vet.emergency_available ? '<p class="vet-info emergency">🚨 Emergency Services Available</p>' : ''}
                    <div class="vet-actions">
                        <a href="tel:${vet.phone}" class="btn btn-primary btn-small">Call</a>
                        <a href="mailto:${vet.email}" class="btn btn-secondary btn-small">Email</a>
                    </div>
                </div>
            `).join('');
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p class="empty-text">No veterinarians found</p>
                    <p class="empty-subtext">Try adjusting your search criteria or check back later.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading veterinarians:', error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p class="empty-text">Error loading veterinarians</p>
                <p class="empty-subtext">Please try again later.</p>
            </div>
        `;
    }
}
