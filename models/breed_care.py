from datetime import datetime, timezone
from models import db

class BreedCareInfo(db.Model):
    __tablename__ = 'breed_care_info'
    
    id = db.Column(db.Integer, primary_key=True)
    species = db.Column(db.String(100), nullable=False)
    breed = db.Column(db.String(100), nullable=False)
    nutrition = db.Column(db.Text)
    exercise = db.Column(db.Text)
    grooming = db.Column(db.Text)
    common_health_issues = db.Column(db.Text)
    preventive_care = db.Column(db.Text)
    life_expectancy = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'species': self.species,
            'breed': self.breed,
            'nutrition': self.nutrition,
            'exercise': self.exercise,
            'grooming': self.grooming,
            'common_health_issues': self.common_health_issues,
            'preventive_care': self.preventive_care,
            'life_expectancy': self.life_expectancy,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

