from datetime import datetime, timezone
from models import db

class NGO(db.Model):
    __tablename__ = 'ngos'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    city = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text)
    phone = db.Column(db.String(50))
    email = db.Column(db.String(255))
    website = db.Column(db.String(255))
    services = db.Column(db.Text) # e.g. "Rescue, Shelter, Medical Aid"
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    donations = db.relationship('Donation', backref='ngo', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'organization_name': self.name,
            'description': self.description,
            'city': self.city,
            'state': '',
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'services': self.services,
            'services_offered': self.services,
            'is_verified': self.is_verified,
            'volunteer_opportunities': True,
            'adoption_available': True,
            'donation_accepted': True,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Donation(db.Model):
    __tablename__ = 'donations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    ngo_id = db.Column(db.Integer, db.ForeignKey('ngos.id'), nullable=False)
    amount = db.Column(db.Float)
    status = db.Column(db.String(50), default='PENDING')
    transaction_id = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ngo_id': self.ngo_id,
            'amount': self.amount,
            'status': self.status,
            'transaction_id': self.transaction_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

