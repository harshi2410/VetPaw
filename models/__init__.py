from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask import Flask

class BaseModel(DeclarativeBase):
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

db = SQLAlchemy(model_class=BaseModel)


def init_db(app: Flask):
    """Initialize database with Flask app."""
    db.init_app(app)
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")


from .user import User
from .pet import Pet
from .health import HealthRecord, Vaccination, Medication, WeightRecord
from .appointment import Appointment
from .chat import ChatMessage
from .vet import Veterinarian, Clinic
from .ngo import NGO, Donation
from .emergency import EmergencyContact
from .notification import Notification
from .breed_care import BreedCareInfo
from .pet_essential import PetEssential

__all__ = [
    'db', 'init_db',
    'User',
    'Pet',
    'HealthRecord', 'Vaccination', 'Medication', 'WeightRecord',
    'Appointment',
    'ChatMessage',
    'Veterinarian', 'Clinic',
    'NGO', 'Donation',
    'EmergencyContact',
    'Notification',
    'BreedCareInfo',
    'PetEssential'
]
