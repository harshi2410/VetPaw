from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from models import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    city = db.Column(db.String(100))
    role = db.Column(db.String(50), default='PET_OWNER')  # PET_OWNER, ADMIN, VET
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    pets = db.relationship('Pet', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    chat_messages = db.relationship('ChatMessage', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    donations = db.relationship('Donation', backref='donor', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password using Werkzeug."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password using Werkzeug."""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'city': self.city,
            'role': self.role,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

