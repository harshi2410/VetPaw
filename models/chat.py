from datetime import datetime, timezone
from models import db

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'))
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    urgency_level = db.Column(db.String(50)) # LOW, MODERATE, EMERGENCY
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'pet_id': self.pet_id,
            'message': self.message,
            'response': self.response,
            'urgency_level': self.urgency_level,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

