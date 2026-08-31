from datetime import datetime, timezone
from models import db

class Veterinarian(db.Model):
    __tablename__ = 'veterinarians'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id'))
    specialization = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(255))
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    appointments = db.relationship('Appointment', backref='veterinarian', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'full_name': self.name,
            'clinic_id': self.clinic_id,
            'clinic_name': self.clinic.name if self.clinic else None,
            'city': self.clinic.city if self.clinic else None,
            'state': '',
            'specialization': self.specialization,
            'phone': self.phone,
            'email': self.email,
            'is_verified': self.is_verified,
            'emergency_available': self.clinic.emergency_services if self.clinic else False,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Clinic(db.Model):
    __tablename__ = 'clinics'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(50))
    emergency_services = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    veterinarians = db.relationship('Veterinarian', backref='clinic', lazy='dynamic')
    appointments = db.relationship('Appointment', backref='clinic', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'phone': self.phone,
            'emergency_services': self.emergency_services,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

