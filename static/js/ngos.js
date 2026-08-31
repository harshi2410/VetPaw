// VETPAW NGOs JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Load all NGOs on page load
    loadNGOs();
});

async function searchNGOs() {
    const city = document.getElementById('ngo-city').value;
    
    let url = '/api/ngos';
    if (city) {
        url += `?city=${encodeURIComponent(city)}`;
    }
    
    loadNGOs(url);
}

async function loadNGOs(url = '/api/ngos') {
    const resultsContainer = document.getElementById('ngos-results');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok && data.ngos && data.ngos.length > 0) {
            resultsContainer.innerHTML = data.ngos.map(ngo => `
                <div class="ngo-card">
                    <div class="ngo-header">
                        <h3>${ngo.organization_name}</h3>
                        ${ngo.is_verified ? '<span class="badge green">Verified</span>' : ''}
                    </div>
                    <p class="ngo-info">📍 ${ngo.city}, ${ngo.state || ''}</p>
                    <p class="ngo-info">📞 ${ngo.phone}</p>
                    <p class="ngo-info">📧 ${ngo.email || 'N/A'}</p>
                    <p class="ngo-info">🎯 ${ngo.services_offered || 'Animal Welfare'}</p>
                    <p class="ngo-info">📝 ${ngo.description || ''}</p>
                    <div class="ngo-badges">
                        ${ngo.volunteer_opportunities ? '<span class="badge brown">Volunteers Needed</span>' : ''}
                        ${ngo.adoption_available ? '<span class="badge green">Adoption Available</span>' : ''}
                        ${ngo.donation_accepted ? '<span class="badge brown">Donations Accepted</span>' : ''}
                    </div>
                    <div class="ngo-actions">
                        <a href="tel:${ngo.phone}" class="btn btn-primary btn-small">Call</a>
                        <a href="mailto:${ngo.email}" class="btn btn-secondary btn-small">Email</a>
                    </div>
                </div>
            `).join('');
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p class="empty-text">No NGOs found</p>
                    <p class="empty-subtext">Try adjusting your search or check back later for more organizations.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading NGOs:', error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p class="empty-text">Error loading NGOs</p>
                <p class="empty-subtext">Please try again later.</p>
            </div>
        `;
    }
}
