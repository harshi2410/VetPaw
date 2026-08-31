import os
from flask import Flask
from models import db, init_db, User
import config

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)
    
    # In case DATABASE_URL is somehow missing, fall back for testing
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///vetpaw.db')
        
    db.init_app(app)
    return app

def create_default_admin():
    """Create default admin user if not exists."""
    admin = User.query.filter_by(email='admin@vetpaw.com').first()
    if not admin:
        admin = User(
            email='admin@vetpaw.com',
            full_name='VETPAW Admin',
            role='ADMIN',
            is_verified=True,
            is_active=True
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Default admin user created: admin@vetpaw.com / admin123")
    else:
        print("Admin user already exists.")

def seed_data():
    from models import Clinic, Veterinarian, NGO, EmergencyContact, BreedCareInfo, PetEssential
    
    # 1. Seed Clinics
    if Clinic.query.count() == 0:
        c1 = Clinic(name="Happy Tails Animal Clinic", address="101 Pet Lane", city="Mumbai", phone="+91 22 1234 5678", emergency_services=True, is_verified=True)
        c2 = Clinic(name="Paw Print Vet Hospital", address="202 Bark Avenue", city="Mumbai", phone="+91 22 8765 4321", emergency_services=False, is_verified=True)
        c3 = Clinic(name="MaxiCare Veterinary Center", address="303 Whisker Way", city="Delhi", phone="+91 11 9876 5432", emergency_services=True, is_verified=True)
        db.session.add_all([c1, c2, c3])
        db.session.commit()
        print("Clinics seeded!")

    # 2. Seed Veterinarians
    if Veterinarian.query.count() == 0:
        c1 = Clinic.query.filter_by(name="Happy Tails Animal Clinic").first()
        c2 = Clinic.query.filter_by(name="Paw Print Vet Hospital").first()
        c3 = Clinic.query.filter_by(name="MaxiCare Veterinary Center").first()
        
        v1 = Veterinarian(name="Dr. Amit Sharma", clinic_id=c1.id, specialization="General Practice", phone="+91 98191 23456", email="amit.sharma@happytails.com", is_verified=True)
        v2 = Veterinarian(name="Dr. Priya Nair", clinic_id=c1.id, specialization="Surgery", phone="+91 98191 87654", email="priya.nair@happytails.com", is_verified=True)
        v3 = Veterinarian(name="Dr. Rohan Das", clinic_id=c2.id, specialization="Dermatology", phone="+91 98202 12345", email="rohan.das@pawprint.com", is_verified=True)
        v4 = Veterinarian(name="Dr. Sneha Kapoor", clinic_id=c3.id, specialization="Emergency", phone="+91 99111 22233", email="sneha.kapoor@maxicare.com", is_verified=True)
        db.session.add_all([v1, v2, v3, v4])
        db.session.commit()
        print("Veterinarians seeded!")

    # 3. Seed NGOs
    if NGO.query.count() == 0:
        ngo1 = NGO(name="Paws & Claws Animal Shelter", description="Dedicated to rescuing and rehoming abandoned pets.", city="Mumbai", address="A-50 Bandra West", phone="+91 22 2222 3333", email="info@pawsclaws.org", website="www.pawsclaws.org", services="Rescue, Adoption, Shelter", is_verified=True)
        ngo2 = NGO(name="Friendicoes", description="Providing medical assistance, rescue, and shelter for street animals.", city="Delhi", address="Under Defence Colony Flyover", phone="+91 11 2432 0541", email="contact@friendicoes.org", website="www.friendicoes.org", services="Ambulance, Rescue, Shelter, Medical Aid", is_verified=True)
        db.session.add_all([ngo1, ngo2])
        db.session.commit()
        print("NGOs seeded!")

    # 4. Seed Emergency Contacts
    if EmergencyContact.query.count() == 0:
        e1 = EmergencyContact(name="Mumbai Pet Ambulance", contact_type="RESCUE", phone="+91 98200 12345", city="Mumbai", description="24/7 Animal rescue and ambulance service in Mumbai.")
        e2 = EmergencyContact(name="National Pet Poison Helpline", contact_type="HELPLINE", phone="1800 213 6680", city="All Cities", description="Toll-free poison information helpline.")
        e3 = EmergencyContact(name="Delhi Animal Emergency Hospital", contact_type="HOSPITAL", phone="+91 11 9999 8888", city="Delhi", description="24/7 Emergency trauma center for small animals.")
        db.session.add_all([e1, e2, e3])
        db.session.commit()
        print("Emergency contacts seeded!")

    # 5. Seed Breed Care Info
    if BreedCareInfo.query.count() == 0:
        b1 = BreedCareInfo(
            species="Dog", breed="Golden Retriever",
            nutrition="Needs high-quality protein diet balanced with fiber to support healthy joints. Prone to obesity, so avoid overfeeding.",
            exercise="Requires at least 1-2 hours of daily physical activity, including fetch, jogging, and swimming.",
            grooming="Double coat needs daily brushing to remove loose hair. Bathe monthly and trim nails regularly.",
            common_health_issues="Hip dysplasia, elbow dysplasia, cataracts, cancer, and heart issues.",
            preventive_care="Regular joint check-ups, cardiac screenings, flea/tick preventative, and routine vaccinations.",
            life_expectancy="10-12 years"
        )
        b2 = BreedCareInfo(
            species="Dog", breed="Labrador Retriever",
            nutrition="Active retrievers require a balanced protein-rich diet. Prone to rapid eating, so slow-feeder bowls are recommended.",
            exercise="Needs daily high-intensity exercise. Loves swimming, retrieve games, and long hikes.",
            grooming="Short, water-resistant double coat sheds heavily. Weekly brushing and occasional baths are sufficient.",
            common_health_issues="Obesity, hip and elbow dysplasia, progressive retinal atrophy (PRA), and ear infections.",
            preventive_care="Ear cleaning after swimming, joint supplements, weight management check-ups, and dental cleanings.",
            life_expectancy="10-12 years"
        )
        b3 = BreedCareInfo(
            species="Cat", breed="Persian Cat",
            nutrition="Should be fed high-protein wet food to maintain kidney health. Easy-to-chew kibbles for flat faces.",
            exercise="Low energy. Enjoys brief play sessions with feather wands or laser pointers, followed by long naps.",
            grooming="Long coat demands daily combing to prevent matting. Regular eye wiping for tear-staining is essential.",
            common_health_issues="Polycystic kidney disease (PKD), breathing difficulties due to flat face, eye tearing, and skin conditions.",
            preventive_care="Annual kidney function tests, eye care, professional dental scaling, and strictly indoor lifestyle.",
            life_expectancy="12-15 years"
        )
        db.session.add_all([b1, b2, b3])
        db.session.commit()
        print("Breed care info seeded!")

    # 6. Seed Pet Essentials
    if PetEssential.query.count() == 0:
        es1 = PetEssential(category="Food", item_name="Premium Puppy Kibble", description="Formulated for healthy growth, brain development, and digestion.", species="Dog", breed="All Breeds", age_group="Puppy", size_category="All Sizes", importance="Essential")
        es2 = PetEssential(category="Grooming", item_name="Shedding Undercoat Rake", description="Removes loose hair and minimizes shedding for double-coated breeds.", species="Dog", breed="Golden Retriever", age_group="All Ages", size_category="Large", importance="Recommended")
        es3 = PetEssential(category="Health", item_name="Hairball Control Paste", description="Helps pass swallowed hairs easily and prevents digestive blocks.", species="Cat", breed="Persian Cat", age_group="Adult", size_category="Small", importance="Essential")
        es4 = PetEssential(category="Toys", item_name="Interactive Laser Pointer", description="Provides mental stimulation and exercise for indoor cats.", species="Cat", breed="All Breeds", age_group="All Ages", size_category="Small", importance="Recommended")
        db.session.add_all([es1, es2, es3, es4])
        db.session.commit()
        print("Pet essentials seeded!")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        print(f"Creating tables in database: {app.config['SQLALCHEMY_DATABASE_URI']}")
        db.create_all()
        print("Database tables created successfully!")
        create_default_admin()
        seed_data()
        print("Database seeding completed!")

