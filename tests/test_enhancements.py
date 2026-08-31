import unittest
import uuid
from app import app, db
from models import User, Pet, Medication, HealthRecord, Vaccination, WeightRecord, Appointment
from chatbot.chatbot import VetChatbot

class VetPawEnhancementTests(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret'
        self.client = app.test_client()
        
        with app.app_context():
            uid = uuid.uuid4().hex[:8]
            self.test_email = f'owner_{uid}@test.com'
            # Create user
            self.user = User(
                email=self.test_email,
                full_name='Test Owner',
                role='PET_OWNER',
                is_active=True
            )
            self.user.set_password('password123')
            db.session.add(self.user)
            db.session.commit()
            
            # Create pet
            self.pet = Pet(
                owner_id=self.user.id,
                vetpaw_id=f'VP-DOG-{uid.upper()}',
                name='Max',
                species='Dog',
                breed='Golden Retriever',
                gender='Male',
                weight_kg=25.0
            )
            db.session.add(self.pet)
            db.session.commit()
            
            self.user_id = self.user.id
            self.pet_id = self.pet.id

    def tearDown(self):
        with app.app_context():
            # Clean up user and associated records
            user = db.session.get(User, self.user_id)
            if user:
                db.session.delete(user)
                db.session.commit()
            db.session.remove()

    def login(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.user_id
            sess['user_email'] = self.test_email
            sess['user_name'] = 'Test Owner'
            sess['user_role'] = 'PET_OWNER'


    def test_medication_toggle_endpoint(self):
        self.login()
        with app.app_context():
            med = Medication(
                pet_id=self.pet_id,
                medication_name='Apoquel',
                dosage='5mg',
                frequency='Daily',
                is_active=True
            )
            db.session.add(med)
            db.session.commit()
            med_id = med.id

        # Toggle to false
        response = self.client.put(
            f'/pets/{self.pet_id}/medications/{med_id}',
            json={'is_active': False}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertFalse(data['medication']['is_active'])

        # Toggle back to true
        response2 = self.client.put(
            f'/pets/{self.pet_id}/medications/{med_id}',
            json={'is_active': True}
        )
        self.assertEqual(response2.status_code, 200)
        data2 = response2.get_json()
        self.assertTrue(data2['medication']['is_active'])

    def test_chatbot_pet_context_and_overview(self):
        self.login()
        bot = VetChatbot()
        
        # Test direct prompt with context
        prompt = (
            "Pet Context: Name: Max, Species: Dog, Breed: Golden Retriever, Age: 3 years, "
            "Active Medications: Apoquel (5mg Daily), Last Health Record: Routine checkup, "
            "Vaccination Status: All vaccinations are up-to-date.\n"
            "User Message: Ask about Max"
        )
        res = bot.process_message(prompt)
        self.assertIn("Max", res['response'])
        self.assertIn("Golden Retriever", res['response'])

    def test_chatbot_pet_vaccine_query(self):
        self.login()
        bot = VetChatbot()
        
        # Overdue vaccine scenario
        prompt = (
            "Pet Context: Name: Max, Species: Dog, Breed: Golden Retriever, Age: 3 years, "
            "Active Medications: None, Last Health Record: None, "
            "Vaccination Status: OVERDUE vaccines: Rabies.\n"
            "User Message: Is Max due for vaccines?"
        )
        res = bot.process_message(prompt)
        self.assertIn("OVERDUE", res['response'])
        self.assertIn("Rabies", res['response'])

    def test_chatbot_diet_with_pet_context(self):
        self.login()
        bot = VetChatbot()
        
        prompt = (
            "Pet Context: Name: Max, Species: Dog, Breed: Golden Retriever, Age: 3 years, "
            "Active Medications: None, Last Health Record: None, "
            "Vaccination Status: All vaccinations are up-to-date.\n"
            "User Message: Can he eat chicken?"
        )
        res = bot.process_message(prompt)
        self.assertIn("chicken", res['response'].lower())
        self.assertIn("Max", res['response'])

    def test_pet_complete_details_registration_and_persistence(self):
        self.login()
        pet_data = {
            'name': 'Bella',
            'species': 'Dog',
            'breed': 'Labrador',
            'gender': 'Female (Spayed)',
            'date_of_birth': '2022-05-15',
            'weight_kg': 28.5,
            'color': 'Yellow / Cream',
            'is_neutered': True,
            'allergies': 'Chicken protein, Flea bites',
            'medical_conditions': 'Mild hip stiffness in winter',
            'dietary_needs': 'Grain-free lamb kibble 2 cups daily',
            'blood_type': 'DEA 1.1+',
            'activity_level': 'High',
            'microchip_id': '985141009988776',
            'registration_id': 'REG-2024-9988',
            'insurance_provider': 'PetPlan India',
            'insurance_policy_number': 'POL-998811',
            'emergency_contact_name': 'Sarah Smith',
            'emergency_contact_phone': '+91 9876543210',
            'notes': 'Loves swimming, afraid of thunderstorms'
        }

        # 1. Register pet
        response = self.client.post('/pets', json=pet_data)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        new_pet_id = data['pet']['id']
        self.assertEqual(data['pet']['name'], 'Bella')
        self.assertEqual(data['pet']['allergies'], 'Chicken protein, Flea bites')
        self.assertEqual(data['pet']['medical_conditions'], 'Mild hip stiffness in winter')
        self.assertEqual(data['pet']['dietary_needs'], 'Grain-free lamb kibble 2 cups daily')
        self.assertTrue(data['pet']['is_neutered'])
        self.assertEqual(data['pet']['insurance_provider'], 'PetPlan India')

        # 2. Query pet detail to ensure memory/persistence
        get_res = self.client.get(f'/pets/{new_pet_id}', headers={'Accept': 'application/json'})
        self.assertEqual(get_res.status_code, 200)
        pet_detail = get_res.get_json()['pet']
        self.assertEqual(pet_detail['allergies'], 'Chicken protein, Flea bites')
        self.assertEqual(pet_detail['insurance_policy_number'], 'POL-998811')
        self.assertEqual(pet_detail['activity_level'], 'High')
        self.assertEqual(pet_detail['emergency_contact_name'], 'Sarah Smith')

        # 3. Update pet details
        update_data = {
            'allergies': 'Chicken protein, Flea bites, Dairy',
            'weight_kg': 29.0,
            'notes': 'Loves swimming, loves tennis balls'
        }
        put_res = self.client.put(f'/pets/{new_pet_id}', json=update_data)
        self.assertEqual(put_res.status_code, 200)
        updated_pet = put_res.get_json()['pet']
        self.assertEqual(updated_pet['allergies'], 'Chicken protein, Flea bites, Dairy')
        self.assertEqual(updated_pet['weight_kg'], 29.0)
        self.assertEqual(updated_pet['notes'], 'Loves swimming, loves tennis balls')

if __name__ == '__main__':
    unittest.main()

