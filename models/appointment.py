from datetime import datetime, timezone
from models import db

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=True)
    pet_species = db.Column(db.String(50))  # 'Dog', 'Cat', 'Bird', etc.
    pet_name = db.Column(db.String(100))
    veterinarian_id = db.Column(db.Integer, db.ForeignKey('veterinarians.id'))
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id'))
    appointment_date = db.Column(db.DateTime, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='SCHEDULED') # SCHEDULED, COMPLETED, CANCELLED
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        from models.pet import Pet
        from models.vet import Veterinarian, Clinic
        pet = db.session.get(Pet, self.pet_id) if self.pet_id else None
        vet = db.session.get(Veterinarian, self.veterinarian_id) if self.veterinarian_id else None
        clinic = db.session.get(Clinic, self.clinic_id) if self.clinic_id else None

        display_name = pet.name if pet else (self.pet_name or 'N/A')
        display_species = pet.species if pet else (self.pet_species or 'Other')

        return {
            'id': self.id,
            'user_id': self.user_id,
            'pet_id': self.pet_id,
            'pet_name': display_name,
            'pet_species': display_species,
            'veterinarian_id': self.veterinarian_id,
            'veterinarian_name': vet.name if vet else 'N/A',
            'clinic_id': self.clinic_id,
            'clinic_name': clinic.name if clinic else 'N/A',
            'appointment_date': self.appointment_date.strftime('%Y-%m-%d') if self.appointment_date else None,
            'appointment_time': self.appointment_date.strftime('%H:%M') if self.appointment_date else None,
            'reason': self.reason,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


