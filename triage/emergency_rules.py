import json
import os

def load_emergency_keywords(data_path="data/emergency_symptoms.json"):
    if not os.path.exists(data_path):
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), data_path)
        
    if os.path.exists(data_path):
        with open(data_path, 'r') as f:
            data = json.load(f)
            return data.get("emergency_keywords", [])
    return []

EMERGENCY_KEYWORDS = load_emergency_keywords()

def is_emergency(user_text, extracted_symptoms=None):
    """
    Checks if the user's text or extracted symptoms indicate an emergency.
    """
    text_lower = user_text.lower()
    
    # Check against known emergency keywords
    for keyword in EMERGENCY_KEYWORDS:
        if keyword in text_lower:
            return True, f"Emergency keyword detected: {keyword}"
            
    # Check if any extracted symptom is marked as 'high' severity
    if extracted_symptoms:
        for s in extracted_symptoms:
            if s['severity'] == 'high':
                return True, f"High severity symptom detected: {s['symptom']}"
                
    return False, ""
