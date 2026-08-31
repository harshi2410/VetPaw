from datetime import datetime, timezone
from models import db

class PetEssential(db.Model):
    __tablename__ = 'pet_essentials'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False) # e.g. Feeding, Grooming
    item_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    species = db.Column(db.String(100))
    breed = db.Column(db.String(100))
    age_group = db.Column(db.String(100)) # e.g. Puppy, Adult, Senior
    size_category = db.Column(db.String(100)) # e.g. Small, Medium, Large
    importance = db.Column(db.String(50)) # e.g. REQUIRED, RECOMMENDED, OPTIONAL
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'item_name': self.item_name,
            'description': self.description,
            'species': self.species,
            'breed': self.breed,
            'age_group': self.age_group,
            'size_category': self.size_category,
            'importance': self.importance,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

