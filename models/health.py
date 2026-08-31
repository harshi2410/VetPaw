from datetime import datetime, timezone
from models import db

class HealthRecord(db.Model):
    __tablename__ = 'health_records'
    
    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    record_type = db.Column(db.String(100), nullable=False)  # checkup, emergency, lab_result, etc.
    visit_date = db.Column(db.Date, nullable=False)
    veterinarian_name = db.Column(db.String(100))
    clinic_name = db.Column(db.String(100))
    notes = db.Column(db.Text)
    diagnosis = db.Column(db.Text)
    treatment = db.Column(db.Text)
    follow_up_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'record_type': self.record_type,
            'visit_date': self.visit_date.isoformat() if self.visit_date else None,
            'veterinarian_name': self.veterinarian_name,
            'clinic_name': self.clinic_name,
            'notes': self.notes,
            'diagnosis': self.diagnosis,
            'treatment': self.treatment,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Vaccination(db.Model):
    __tablename__ = 'vaccinations'
    
    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    vaccine_name = db.Column(db.String(200), nullable=False)
    administration_date = db.Column(db.Date)
    next_due_date = db.Column(db.Date)
    veterinarian_name = db.Column(db.String(100))
    clinic_name = db.Column(db.String(100))
    batch_number = db.Column(db.String(50))
    notes = db.Column(db.Text)
    status = db.Column(db.String(50), default='SCHEDULED')  # SCHEDULED, COMPLETED, OVERDUE
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'vaccine_name': self.vaccine_name,
            'administration_date': self.administration_date.isoformat() if self.administration_date else None,
            'next_due_date': self.next_due_date.isoformat() if self.next_due_date else None,
            'veterinarian_name': self.veterinarian_name,
            'clinic_name': self.clinic_name,
            'batch_number': self.batch_number,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Medication(db.Model):
    __tablename__ = 'medications'
    
    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    medication_name = db.Column(db.String(200), nullable=False)
    dosage = db.Column(db.String(100), nullable=False)
    frequency = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    prescribing_vet = db.Column(db.String(100))
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'medication_name': self.medication_name,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'prescribing_vet': self.prescribing_vet,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class WeightRecord(db.Model):
    __tablename__ = 'weight_records'
    
    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    weight_kg = db.Column(db.Float, nullable=False)
    recorded_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'weight_kg': self.weight_kg,
            'recorded_date': self.recorded_date.isoformat() if self.recorded_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

