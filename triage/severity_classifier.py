def classify_severity(extracted_symptoms):
    """
    Classifies the overall severity based on the highest severity symptom.
    Returns: 'low', 'moderate', or 'high'
    """
    if not extracted_symptoms:
        return "unknown"
        
    severity_levels = [s['severity'] for s in extracted_symptoms]
    
    if 'high' in severity_levels:
        return 'high'
    elif 'moderate' in severity_levels:
        return 'moderate'
    elif 'low' in severity_levels:
        return 'low'
        
    return "unknown"
