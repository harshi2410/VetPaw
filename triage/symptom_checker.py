import csv
import os

class SymptomChecker:
    def __init__(self, data_path="data/symptoms.csv"):
        self.known_symptoms = {}
        self._load_symptoms(data_path)

    def _load_symptoms(self, data_path):
        if not os.path.exists(data_path):
            # Fallback if running from a different directory
            data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), data_path)
            
        if os.path.exists(data_path):
            with open(data_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    symptom = row['symptom'].lower()
                    self.known_symptoms[symptom] = {
                        'category': row['category'],
                        'severity': row['severity']
                    }

    def extract_symptoms(self, user_text):
        """Extracts known symptoms from the user's natural language input."""
        user_text = user_text.lower()
        extracted = []
        for symptom, details in self.known_symptoms.items():
            if symptom in user_text:
                extracted.append({
                    'symptom': symptom,
                    'severity': details['severity']
                })
        return extracted
