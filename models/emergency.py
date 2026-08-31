from datetime import datetime, timezone
from models import db

class EmergencyContact(db.Model):
    __tablename__ = 'emergency_contacts'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    contact_type = db.Column(db.String(100), nullable=False) # e.g., HELPLINE, RESCUE, HOSPITAL
    phone = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(100))
    description = db.Column(db.Text)
    is_verified = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'organization': self.name,
            'contact_type': self.contact_type,
            'phone': self.phone,
            'city': self.city,
            'state': '',
            'description': self.description,
            'is_verified': self.is_verified,
            'is_24_7': True,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

