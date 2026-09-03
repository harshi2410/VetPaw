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

def is_minor_bleeding_context(text_lower):
    """Return True for localized bleeding with no signs of major trauma."""
    nail_injury = "nail" in text_lower and any(term in text_lower for term in (
        "broken", "broke", "split", "torn", "cracked", "bleeding", "blood"
    ))
    minor_injury = nail_injury or any(term in text_lower for term in (
        "small cut", "minor cut", "small scratch", "minor scratch",
    ))
    controlled_bleeding = any(term in text_lower for term in (
        "stopped bleeding", "bleeding stopped", "small amount", "little blood",
        "small amount of blood", "only the nail", "just the nail",
    ))
    severe_bleeding = any(term in text_lower for term in (
        "won't stop", "wont stop", "doesn't stop", "doesnt stop",
        "cannot stop", "can't control", "uncontrolled", "profuse",
        "a lot of blood",
    ))
    return (minor_injury or controlled_bleeding) and not severe_bleeding

def is_emergency(user_text, extracted_symptoms=None):
    """
    Checks if the user's text or extracted symptoms indicate an emergency.
    """
    text_lower = user_text.lower()
    
    # Check against known emergency keywords
    for keyword in EMERGENCY_KEYWORDS:
        if keyword in ("bleeding", "blood") and is_minor_bleeding_context(text_lower):
            continue
        if keyword in text_lower:
            return True, f"Emergency keyword detected: {keyword}"
            
    # Check if any extracted symptom is marked as 'high' severity
    if extracted_symptoms:
        for s in extracted_symptoms:
            if s['symptom'] == 'bleeding' and is_minor_bleeding_context(text_lower):
                continue
            if s['severity'] == 'high':
                return True, f"High severity symptom detected: {s['symptom']}"
                
    return False, ""
