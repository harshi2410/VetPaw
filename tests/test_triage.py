import unittest
from triage.emergency_rules import is_emergency
from triage.symptom_checker import SymptomChecker

class TestTriage(unittest.TestCase):
    def setUp(self):
        self.checker = SymptomChecker()

    def test_emergency_keyword(self):
        text = "My dog had a seizure"
        is_em, reason = is_emergency(text)
        self.assertTrue(is_em)
        self.assertIn("seizure", reason)

    def test_no_emergency(self):
        text = "My cat is vomiting a little"
        is_em, reason = is_emergency(text)
        # vomiting is moderate based on symptoms.csv, not an emergency keyword
        self.assertFalse(is_em)

    def test_symptom_extraction(self):
        text = "He is vomiting and has diarrhea"
        symptoms = self.checker.extract_symptoms(text)
        symptom_names = [s['symptom'] for s in symptoms]
        self.assertIn('vomiting', symptom_names)
        self.assertIn('diarrhea', symptom_names)

if __name__ == '__main__':
    unittest.main()
