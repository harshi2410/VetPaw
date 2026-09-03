import unittest
from chatbot.chatbot import VetChatbot

class TestChatbot(unittest.TestCase):
    def setUp(self):
        self.bot = VetChatbot()

    def test_emergency_response(self):
        res = self.bot.process_message("emergency help")
        self.assertEqual(res['severity'], 'high')
        self.assertIn("EMERGENCY HELP", res['response'])

    def test_breed_care_response(self):
        res = self.bot.process_message("Tell me about Golden Retriever breed care")
        self.assertEqual(res['severity'], 'low')
        self.assertIn("Golden Retriever", res['response'])

    def test_diet_response(self):
        res = self.bot.process_message("Can dogs eat fish?")
        self.assertEqual(res['severity'], 'low')
        self.assertIn("fish", res['response'].lower())

    def test_toxic_food_response(self):
        res = self.bot.process_message("Can dogs eat chocolate?")
        self.assertEqual(res['severity'], 'low')
        self.assertIn("NO!", res['response'])

    def test_symptom_triage(self):
        res = self.bot.process_message("My dog is coughing and has lethargy")
        self.assertIn(res['severity'], ['moderate', 'high'])
        self.assertIn("cough", str(res['extracted_symptoms']))

    def test_minor_broken_nail_guidance(self):
        res = self.bot.process_message("My cat broke just the nail and it is bleeding a little")
        self.assertNotEqual(res['severity'], 'high')
        self.assertIn("firm, steady pressure", res['response'])
        self.assertIn("does not stop", res['response'])

    def test_flea_question_gets_specific_guidance(self):
        res = self.bot.process_message("How can I tell if my dog has fleas?")
        self.assertEqual(res['severity'], 'low')
        self.assertIn("flea comb", res['response'])
        self.assertIn("Never use a dog flea product on a cat", res['response'])

    def test_pet_context_parsing(self):
        prompt = (
            "Pet Context: Name: Luna, Species: Cat, Breed: Persian, Age: 2 years, "
            "Active Medications: None, Last Health Record: None, "
            "Vaccination Status: All vaccinations are up-to-date.\n"
            "User Message: Tell me about Luna"
        )
        res = self.bot.process_message(prompt)
        self.assertIn("Luna", res['response'])
        self.assertIn("Persian", res['response'])

if __name__ == '__main__':
    unittest.main()
