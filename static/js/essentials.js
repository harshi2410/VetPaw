// VETPAW Essentials JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadEssentials();
});

async function filterEssentials() {
    const category = document.getElementById('essential-category').value;
    const species = document.getElementById('essential-species').value;
    
    let url = '/api/pet-essentials?';
    const params = [];
    
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (species) params.push(`species=${encodeURIComponent(species)}`);
    
    url += params.join('&');
    
    loadEssentials(url);
}

async function loadEssentials(url = '/api/pet-essentials') {
    const container = document.getElementById('essentials-container');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok && data.essentials && data.essentials.length > 0) {
            container.innerHTML = data.essentials.map(essential => `
                <div class="essential-card">
                    <div class="essential-header">
                        <span class="essential-category">${essential.category}</span>
                        <span class="badge ${essential.importance === 'Essential' ? 'green' : 'brown'}">${essential.importance}</span>
                    </div>
                    <h3 class="essential-name">${essential.item_name}</h3>
                    <p class="essential-description">${essential.description || ''}</p>
                    <div class="essential-meta">
                        <span class="essential-species">${essential.species || 'All Species'}</span>
                        <span class="essential-breed">${essential.breed || 'All Breeds'}</span>
                    </div>
                    <div class="essential-details">
                        ${essential.age_group ? `<span class="essential-detail">🎂 ${essential.age_group}</span>` : ''}
                        ${essential.size_category ? `<span class="essential-detail">📏 ${essential.size_category}</span>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p class="empty-text">No essentials found</p>
                    <p class="empty-subtext">Try adjusting your filters or check back later.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading essentials:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p class="empty-text">Error loading essentials</p>
                <p class="empty-subtext">Please try again later.</p>
            </div>
        `;
    }
}
