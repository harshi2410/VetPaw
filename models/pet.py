from datetime import datetime, timezone
import random
import string
from models import db

class Pet(db.Model):
    __tablename__ = 'pets'
    
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vetpaw_id = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    species = db.Column(db.String(50), nullable=False)  # Dog, Cat, Bird, Rabbit, etc.
    breed = db.Column(db.String(100))
    gender = db.Column(db.String(50))  # Male, Female, Male (Neutered), Female (Spayed)
    date_of_birth = db.Column(db.Date)
    weight_kg = db.Column(db.Float)
    color = db.Column(db.String(100))
    microchip_id = db.Column(db.String(50), unique=True)
    registration_id = db.Column(db.String(50))
    profile_photo = db.Column(db.String(255))
    
    # Medical & Health Details
    allergies = db.Column(db.Text)
    medical_conditions = db.Column(db.Text)
    dietary_needs = db.Column(db.Text)
    blood_type = db.Column(db.String(50))
    is_neutered = db.Column(db.Boolean, default=False)
    activity_level = db.Column(db.String(50))  # Low, Moderate, High, Athletic
    
    # Identification & Insurance
    insurance_provider = db.Column(db.String(100))
    insurance_policy_number = db.Column(db.String(100))
    pedigree_id = db.Column(db.String(100))
    notes = db.Column(db.Text)
    
    # Emergency Contacts & Vet
    emergency_contact_name = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(50))
    primary_vet_id = db.Column(db.Integer, db.ForeignKey('veterinarians.id'))
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    health_records = db.relationship('HealthRecord', backref='pet', lazy='dynamic', cascade='all, delete-orphan')
    vaccinations = db.relationship('Vaccination', backref='pet', lazy='dynamic', cascade='all, delete-orphan')
    medications = db.relationship('Medication', backref='pet', lazy='dynamic', cascade='all, delete-orphan')
    weight_records = db.relationship('WeightRecord', backref='pet', lazy='dynamic', cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', backref='pet', lazy='dynamic', cascade='all, delete-orphan')
    chat_messages = db.relationship('ChatMessage', backref='pet', lazy='dynamic', cascade='all, delete-orphan')
    primary_vet = db.relationship('Veterinarian', backref='primary_pets')
    
    @staticmethod
    def generate_vetpaw_id(species, name):
        """Generate unique VETPAW pet ID."""
        species_code = species.upper()[:3] if species else 'UNK'
        random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"VP-{species_code}-{random_chars}"
    
    def get_age(self):
        """Calculate pet age from date of birth."""
        if not self.date_of_birth:
            return None
        today = datetime.now(timezone.utc).date()
        years = today.year - self.date_of_birth.year
        if today.month < self.date_of_birth.month or (today.month == self.date_of_birth.month and today.day < self.date_of_birth.day):
            years -= 1
        return max(0, years)
    
    def to_dict(self):
        """Convert pet to dictionary with all health tracker fields."""
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'vetpaw_id': self.vetpaw_id,
            'name': self.name,
            'species': self.species,
            'breed': self.breed,
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'weight_kg': self.weight_kg,
            'color': self.color,
            'microchip_id': self.microchip_id,
            'registration_id': self.registration_id,
            'profile_photo': self.profile_photo,
            'allergies': self.allergies or '',
            'medical_conditions': self.medical_conditions or '',
            'dietary_needs': self.dietary_needs or '',
            'blood_type': self.blood_type or '',
            'is_neutered': bool(self.is_neutered),
            'activity_level': self.activity_level or 'Moderate',
            'insurance_provider': self.insurance_provider or '',
            'insurance_policy_number': self.insurance_policy_number or '',
            'pedigree_id': self.pedigree_id or '',
            'notes': self.notes or '',
            'emergency_contact_name': self.emergency_contact_name or '',
            'emergency_contact_phone': self.emergency_contact_phone or '',
            'primary_vet_id': self.primary_vet_id,
            'age': self.get_age(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


