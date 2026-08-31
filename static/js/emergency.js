// VETPAW Emergency JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadEmergencyContacts();
});

function showPoisonControl() {
    const section = document.getElementById('poison-control-section');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
    section.scrollIntoView({ behavior: 'smooth' });
}

function showRescueContacts() {
    const section = document.getElementById('rescue-contacts-section');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
    section.scrollIntoView({ behavior: 'smooth' });
    
    loadRescueContacts();
}

async function loadRescueContacts() {
    const container = document.getElementById('rescue-contacts-container');
    
    try {
        const response = await fetch('/emergency-contacts?contact_type=RESCUE');
        const data = await response.json();
        
        if (response.ok && data.emergency_contacts && data.emergency_contacts.length > 0) {
            container.innerHTML = data.emergency_contacts.map(contact => `
                <div class="info-card">
                    <h3>${contact.name}</h3>
                    <p class="info-detail">🏢 ${contact.organization || 'N/A'}</p>
                    <p class="info-detail">📞 ${contact.phone}</p>
                    <p class="info-detail">📍 ${contact.city}, ${contact.state || ''}</p>
                    <p class="info-detail">📝 ${contact.description || ''}</p>
                    ${contact.is_24_7 ? '<span class="badge green">24/7 Available</span>' : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p class="empty-text">No rescue contacts found</p>
                    <p class="empty-subtext">Check back later for updated rescue service information.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading rescue contacts:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p class="empty-text">Error loading rescue contacts</p>
                <p class="empty-subtext">Please try again later.</p>
            </div>
        `;
    }
}

async function loadEmergencyContacts() {
    const container = document.getElementById('emergency-contacts-container');
    
    try {
        const response = await fetch('/emergency-contacts');
        const data = await response.json();
        
        if (response.ok && data.emergency_contacts && data.emergency_contacts.length > 0) {
            container.innerHTML = data.emergency_contacts.map(contact => `
                <div class="info-card">
                    <h3>${contact.name}</h3>
                    <p class="info-detail">🏢 ${contact.organization || 'N/A'}</p>
                    <p class="info-detail">📞 ${contact.phone}</p>
                    <p class="info-detail">📍 ${contact.city}, ${contact.state || ''}</p>
                    <p class="info-detail">📝 ${contact.description || ''}</p>
                    ${contact.is_24_7 ? '<span class="badge green">24/7 Available</span>' : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📞</div>
                    <p class="empty-text">No emergency contacts available</p>
                    <p class="empty-subtext">Emergency contact information will be displayed here.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading emergency contacts:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p class="empty-text">Error loading emergency contacts</p>
                <p class="empty-subtext">Please try again later.</p>
            </div>
        `;
    }
}
