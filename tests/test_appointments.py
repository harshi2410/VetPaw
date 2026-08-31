import unittest
import uuid
from app import app, db
from models import User, Pet, Appointment, Clinic, Veterinarian

class TestAppointments(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret'
        self.client = app.test_client()

        with app.app_context():
            uid = uuid.uuid4().hex[:8]
            self.test_email = f'user_{uid}@test.com'
            user = User(email=self.test_email, full_name='Test User', role='PET_OWNER', is_active=True)
            user.set_password('pass123')
            db.session.add(user)
            db.session.commit()

            pet = Pet(owner_id=user.id, vetpaw_id=f'VP-CAT-{uid.upper()}', name='Milo', species='Cat', breed='Siamese')
            clinic = Clinic(name=f'Test Clinic {uid}', address='123 Test St', city='Mumbai', phone='123456')
            db.session.add_all([pet, clinic])
            db.session.commit()

            vet = Veterinarian(name=f'Dr. Test {uid}', clinic_id=clinic.id, specialization='General')
            db.session.add(vet)
            db.session.commit()

            self.user_id = user.id
            self.pet_id = pet.id
            self.clinic_id = clinic.id
            self.vet_id = vet.id

    def tearDown(self):
        with app.app_context():
            user = db.session.get(User, self.user_id)
            if user:
                db.session.delete(user)
            clinic = db.session.get(Clinic, self.clinic_id)
            if clinic:
                db.session.delete(clinic)
            db.session.commit()
            db.session.remove()

    def login(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.user_id
            sess['user_email'] = self.test_email
            sess['user_name'] = 'Test User'
            sess['user_role'] = 'PET_OWNER'


    def test_create_and_get_appointment(self):
        self.login()
        payload = {
            'pet_id': self.pet_id,
            'clinic_id': self.clinic_id,
            'veterinarian_id': self.vet_id,
            'appointment_date': '2026-09-10T14:30',
            'reason': 'Annual vaccinations',
            'notes': 'Please check ears'
        }
        res = self.client.post('/api/appointments', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['appointment']['reason'], 'Annual vaccinations')
        self.assertEqual(data['appointment']['pet_species'], 'Cat')

        # List appointments
        get_res = self.client.get('/api/appointments')
        self.assertEqual(get_res.status_code, 200)
        get_data = get_res.get_json()
        self.assertEqual(len(get_data['appointments']), 1)

    def test_create_dog_appointment_with_species_selection(self):
        self.login()
        payload = {
            'pet_species': 'Dog',
            'pet_name': 'Bruno',
            'clinic_id': self.clinic_id,
            'veterinarian_id': self.vet_id,
            'appointment_date': '2026-09-15',
            'appointment_time': '10:00',
            'reason': 'Canine Rabies & DHPP Booster',
            'notes': 'First time visit'
        }
        res = self.client.post('/api/appointments', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['appointment']['pet_species'], 'Dog')
        self.assertEqual(data['appointment']['pet_name'], 'Bruno')
        self.assertEqual(data['appointment']['reason'], 'Canine Rabies & DHPP Booster')

if __name__ == '__main__':
    unittest.main()

