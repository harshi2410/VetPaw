import re
from triage.symptom_checker import SymptomChecker
from triage.emergency_rules import is_emergency
from triage.severity_classifier import classify_severity

class VetChatbot:
    def __init__(self):
        self.symptom_checker = SymptomChecker()
        self.conversation_state = {}  # Track conversation state for follow-up questions
        self.pet_info = {}  # Store pet information during conversation
        self.current_pet_info = {}

    def _parse_pet_context(self, user_input):
        """Extracts pet context and true user message if present."""
        pet_info = {}
        user_message = user_input
        if user_input.startswith("Pet Context:"):
            parts = user_input.split("\nUser Message:", 1)
            context_part = parts[0]
            if len(parts) > 1:
                user_message = parts[1].strip()
            else:
                user_message = ""
            
            raw = context_part.replace("Pet Context:", "").strip()
            items = re.findall(r'([A-Za-z\s]+):\s*([^,]+(?:\([^)]+\))?[^,]*)', raw)
            for k, v in items:
                pet_info[k.strip().lower()] = v.strip().rstrip('.')
        
        return pet_info, user_message

    def process_message(self, user_input):
        self.current_pet_info, clean_input = self._parse_pet_context(user_input)
        clean_lower = clean_input.lower()
        pet_name = self.current_pet_info.get('name', '').lower()

        # 1. Check if user is asking specifically about vaccines for their pet
        if self.current_pet_info and any(w in clean_lower for w in ['vaccine', 'vaccines', 'vaccination', 'shots', 'due for vaccines']):
            return self.handle_pet_vaccine_query()

        # 2. Check if asking "Ask about [PetName]" or general summary of the pet
        if self.current_pet_info and (
            clean_lower.startswith('ask about') or 
            clean_lower.startswith('tell me about') or 
            (pet_name and (clean_lower == f"ask about {pet_name}" or clean_lower == f"tell me about {pet_name}" or clean_lower == pet_name))
        ):
            return self.handle_pet_overview()

        # 3. Check if this is a breed care request
        if "breed" in clean_lower or "care tips" in clean_lower:
            return self.handle_breed_care_request(clean_input)
        
        # 4. Check if this is an emergency help request
        if "emergency" in clean_lower or "help" in clean_lower:
            return self.handle_emergency_request()
        
        # 5. Check if this is a general question (diet, breed, exercise, grooming)
        if any(word in clean_lower for word in ['eat', 'food', 'diet', 'nutrition', 'feed', 'exercise', 'walk', 'run', 'play', 'groom', 'brush', 'bath', 'clean', 'shed', 'golden retriever', 'labrador', 'german shepherd', 'poodle', 'bulldog', 'persian', 'siamese']):
            return self.handle_general_question(clean_input)
        
        # 6. Extract symptoms
        extracted_symptoms = self.symptom_checker.extract_symptoms(clean_input)
        
        # 7. Check for emergencies
        emergency, reason = is_emergency(clean_input, extracted_symptoms)
        
        if emergency:
            return {
                "response": f"🚨 EMERGENCY ALERT: {reason}. Please take your pet to the nearest emergency veterinary clinic IMMEDIATELY.\n\n⚠️ Do not wait. Your pet's life may be at risk.\n\n📞 Emergency Helpline: 1-800-PET-HELP\n🏥 Use the 'Emergency' section to locate nearest emergency clinics.",
                "severity": "high"
            }
            
        # 8. Classify severity
        severity = classify_severity(extracted_symptoms)
        
        # 9. Formulate response with suggestions
        response = self.generate_response(clean_input, extracted_symptoms, severity)
        
        # 10. Add follow-up question if needed
        if severity == "moderate" or not extracted_symptoms:
            response += self.generate_follow_up_question(clean_input, extracted_symptoms)
            
        return {
            "response": response,
            "severity": severity,
            "extracted_symptoms": [s['symptom'] for s in extracted_symptoms]
        }

    def handle_pet_vaccine_query(self):
        name = self.current_pet_info.get('name', 'your pet')
        vac_status = self.current_pet_info.get('vaccination status', '')
        if 'OVERDUE' in vac_status:
            return {
                "response": f"💉 **Vaccination Status for {name}:**\n\n⚠️ **{vac_status}**\n\nWe recommend booking a veterinary appointment soon to bring {name}'s vaccinations up to date.",
                "severity": "moderate"
            }
        else:
            return {
                "response": f"💉 **Vaccination Status for {name}:**\n\n✅ {name}'s vaccinations are currently up to date! Keep up the great care! 🐾",
                "severity": "low"
            }

    def handle_pet_overview(self):
        p = self.current_pet_info
        name = p.get('name', 'your pet')
        species = p.get('species', 'Pet')
        breed = p.get('breed', 'Mixed Breed')
        age = p.get('age', 'Unknown age')
        meds = p.get('active medications', 'None')
        records = p.get('last health record', 'None')
        vacs = p.get('vaccination status', 'Up-to-date')

        emoji = "🐶" if "dog" in species.lower() else "🐱" if "cat" in species.lower() else "🐾"

        resp = f"{emoji} **Profile & Health Overview for {name}:**\n\n"
        resp += f"• **Species & Breed:** {species} ({breed})\n"
        resp += f"• **Age:** {age}\n"
        resp += f"• **Active Medications:** {meds}\n"
        resp += f"• **Last Health Record:** {records}\n"
        resp += f"• **Vaccinations:** {vacs}\n\n"
        resp += f"How can I assist you with {name} today? You can ask about diet, vaccines, grooming, or report any symptoms."
        return {
            "response": resp,
            "severity": "low"
        }

    def generate_response(self, user_input, symptoms, severity):
        """Generate a helpful response based on symptoms and severity."""
        suggestions = self.get_symptom_suggestions(symptoms)
        
        prefix = ""
        if self.current_pet_info:
            pet_name = self.current_pet_info.get('name', 'your pet')
            prefix = f"Regarding {pet_name}:\n\n"

        if severity == "high":
            response = f"{prefix}🚨 Based on the symptoms described, this appears serious. Please take your pet to a veterinarian as soon as possible.\n\n"
            response += suggestions
            response += "\n\n📞 Emergency Helpline: 1-800-PET-HELP\n🏥 Use 'Find Vet' to locate nearest emergency clinics."
            
        elif severity == "moderate":
            response = f"{prefix}⚠️ These symptoms should be evaluated by a veterinarian. I recommend scheduling an appointment soon.\n\n"
            response += suggestions
            response += "\n\n💡 Keep monitoring your pet closely. If symptoms worsen, seek immediate veterinary care."
            
        elif severity == "low":
            response = f"{prefix}✅ This doesn't appear to be an emergency, but it's good that you're being attentive.\n\n"
            response += suggestions
            response += "\n\n💡 Continue monitoring your pet. If symptoms persist for more than 24 hours or worsen, consult a vet."
            
        else:
            if self.current_pet_info:
                pet_name = self.current_pet_info.get('name', 'your pet')
                response = f"I'd like to help you with {pet_name}. Could you tell me more about what's happening?\n\n"
            else:
                response = "I'd like to help you better. Could you tell me more about what's happening with your pet?\n\n"
            response += "Please describe:\n"
            response += "• What symptoms are you observing?\n"
            response += "• How long have these symptoms been present?\n"
            response += "• Any changes in behavior, appetite, or energy level?"
            
        return response

    def get_symptom_suggestions(self, symptoms):
        """Get specific suggestions based on symptoms."""
        if not symptoms:
            return "Please describe the symptoms your pet is experiencing so I can provide better guidance."
        
        symptom_names = [s['symptom'].lower() for s in symptoms]
        suggestions = []
        
        if any('vomit' in s or 'throw' in s for s in symptom_names):
            suggestions.append("• Withhold food for 12-24 hours to let the stomach rest")
            suggestions.append("• Offer small amounts of water frequently")
            suggestions.append("• Watch for signs of dehydration")
            
        if any('diarrhea' in s or 'loose stool' in s for s in symptom_names):
            suggestions.append("• Ensure access to fresh water")
            suggestions.append("• Offer bland diet (boiled rice and chicken)")
            suggestions.append("• Monitor for dehydration")
            
        if any('cough' in s for s in symptom_names):
            suggestions.append("• Keep your pet calm and rested")
            suggestions.append("• Avoid exposure to smoke or strong odors")
            suggestions.append("• Monitor breathing rate")
            
        if any('lethargy' in s or 'tired' in s or 'weak' in s for s in symptom_names):
            suggestions.append("• Ensure your pet is resting comfortably")
            suggestions.append("• Monitor food and water intake")
            suggestions.append("• Check for any pain or discomfort")
            
        if any('not eating' in s or 'appetite' in s for s in symptom_names):
            suggestions.append("• Try offering different foods")
            suggestions.append("• Check for dental issues or mouth pain")
            suggestions.append("• Monitor for other symptoms")
            
        if any('limping' in s or 'pain' in s for s in symptom_names):
            suggestions.append("• Restrict activity and rest the affected area")
            suggestions.append("• Check for visible injuries or swelling")
            suggestions.append("• Do not give human pain medication")
            
        if suggestions:
            return "Here's what you can do right now:\n" + "\n".join(suggestions)
        
        return "• Keep your pet comfortable and calm\n• Monitor for any changes in symptoms\n• Ensure access to fresh water\n• Contact a vet if you're unsure"

    def generate_follow_up_question(self, user_input, symptoms):
        """Generate relevant follow-up questions."""
        questions = []
        
        if not symptoms:
            return "\n\n❓ To help me better understand, could you tell me:\n• What symptoms are you seeing?\n• When did these symptoms start?"
        
        symptom_names = [s['symptom'].lower() for s in symptoms]
        
        if any('vomit' in s or 'diarrhea' in s for s in symptom_names):
            questions.append("How long has this been going on?")
            questions.append("Have they eaten anything unusual recently?")
            
        if any('cough' in s for s in symptom_names):
            questions.append("Is the cough dry or productive?")
            questions.append("Does it happen more at certain times (exercise, night)?")
            
        if any('lethargy' in s for s in symptom_names):
            questions.append("How is their appetite?")
            questions.append("Are they drinking water normally?")
            
        if questions:
            return "\n\n❓ A few more questions to help me better assist you:\n" + "\n".join(f"• {q}" for q in questions[:2])
        
        return ""

    def handle_breed_care_request(self, user_input):
        """Handle requests for breed-specific care information."""
        user_input_lower = user_input.lower()
        # Check if a known breed is mentioned
        for breed_key in ['golden retriever', 'labrador', 'german shepherd', 'poodle', 'bulldog', 'persian', 'siamese']:
            if breed_key in user_input_lower:
                return self.handle_breed_question(user_input)

        response = "I'd be happy to help with breed-specific care tips!\n\n"
        response += "🐾 To get personalized recommendations:\n"
        response += "1. Go to the 'Breed Care' section in the navigation\n"
        response += "2. Select your pet's species (Dog/Cat)\n"
        response += "3. Enter the breed name\n\n"
        response += "I'll provide you with:\n"
        response += "• Nutrition guidelines\n"
        response += "• Exercise requirements\n"
        response += "• Grooming needs\n"
        response += "• Common health considerations\n"
        response += "• Preventive care recommendations"
        
        return {
            "response": response,
            "severity": "low"
        }

    def handle_emergency_request(self):
        """Handle emergency help requests."""
        response = "🚨 EMERGENCY HELP ACTIVATED\n\n"
        response += "If this is a life-threatening emergency:\n"
        response += "• Call your local emergency vet immediately\n"
        response += "• Do not wait - every minute counts\n\n"
        response += "📞 Emergency Numbers:\n"
        response += "• Animal Poison Control: 1-800-213-6680\n"
        response += "• Pet Emergency Helpline: 1-800-PET-HELP\n\n"
        response += "🏥 Use the 'Emergency' section to:\n"
        response += "• Find nearest 24/7 emergency clinics\n"
        response += "• Contact animal rescue organizations\n"
        response += "• Get poison control information"
        
        return {
            "response": response,
            "severity": "high"
        }

    def handle_general_question(self, user_input):
        """Handle general pet questions about diet, breed info, etc."""
        user_input_lower = user_input.lower()
        
        # Diet and nutrition questions
        if any(word in user_input_lower for word in ['eat', 'food', 'diet', 'nutrition', 'feed']):
            return self.handle_diet_question(user_input)
        
        # Breed-specific questions
        if any(word in user_input_lower for word in ['breed', 'golden retriever', 'labrador', 'german shepherd', 'poodle', 'bulldog', 'cat', 'persian', 'siamese']):
            return self.handle_breed_question(user_input)
        
        # Exercise questions
        if any(word in user_input_lower for word in ['exercise', 'walk', 'run', 'play', 'activity']):
            return self.handle_exercise_question(user_input)
        
        # Grooming questions
        if any(word in user_input_lower for word in ['groom', 'brush', 'bath', 'clean', 'shed']):
            return self.handle_grooming_question(user_input)
        
        return {
            "response": "I can help with general pet care questions! Try asking about:\n\n• Diet and nutrition (e.g., 'Can dogs eat fish?')\n• Breed-specific information (e.g., 'Tell me about Golden Retrievers')\n• Exercise needs (e.g., 'How much exercise does a Labrador need?')\n• Grooming tips (e.g., 'How often should I brush my cat?')\n\nFor health concerns or symptoms, please describe what you're observing so I can provide appropriate guidance.",
            "severity": "low"
        }

    def handle_diet_question(self, user_input):
        """Handle diet and nutrition questions."""
        user_input_lower = user_input.lower()
        
        food_responses = {
            'fish': "Yes, most dogs can eat fish! 🐟\n\nFish is a great source of protein and omega-3 fatty acids. However:\n• Always cook the fish thoroughly (no raw fish)\n• Remove all bones carefully\n• Avoid seasoned or fried fish\n• Some fish like salmon can have parasites if not cooked properly\n• Introduce gradually to check for allergies\n\nFor cats, fish can be part of a balanced diet but shouldn't be the only food source.",
            
            'chocolate': "❌ NO! Chocolate is toxic to both dogs and cats!\n\nChocolate contains theobromine which can be fatal:\n• Dark chocolate is most dangerous\n• Even small amounts can cause vomiting, diarrhea, seizures\n• Large amounts can be fatal\n• Keep all chocolate out of reach\n\nIf your pet has eaten chocolate, contact your vet or poison control immediately!",
            
            'grapes': "❌ NO! Grapes and raisins are toxic to dogs!\n\nGrapes can cause kidney failure in dogs:\n• Even small amounts can be dangerous\n• Symptoms include vomiting, lethargy, decreased appetite\n• Some dogs are more sensitive than others\n• Keep grapes and raisins completely away from dogs\n\nCats are less affected, but it's still best to avoid.",
            
            'onion': "❌ NO! Onions are toxic to both dogs and cats!\n\nOnions contain compounds that damage red blood cells:\n• Can cause anemia\n• All forms are dangerous (raw, cooked, powdered)\n• Symptoms may take days to appear\n• Keep all onion products away from pets",
            
            'milk': "⚠️ Use caution with milk!\n\nMost adult dogs and cats are lactose intolerant:\n• Can cause digestive upset, diarrhea, gas\n• Puppies/kittens can handle milk better\n• Small amounts may be fine for some pets\n• Consider lactose-free alternatives\n• Cheese in small amounts is usually okay",
            
            'chicken': "✅ Yes, plain cooked chicken is great!\n\nChicken is an excellent protein source:\n• Must be fully cooked (no raw chicken)\n• Remove all bones\n• No seasoning or spices\n• Great for upset stomachs (plain boiled chicken and rice)\n• Avoid fried or breaded chicken",
            
            'bread': "⚠️ Small amounts are usually okay\n\nPlain bread in small quantities is generally safe:\n• No nutritional benefit\n• Can cause weight gain\n• Avoid bread with raisins, nuts, or toxic ingredients\n• Some pets may be allergic to wheat\n• Never give raw dough (can expand in stomach)",
            
            'apple': "✅ Yes, apples are safe!\n\nApples are healthy treats:\n• Remove all seeds (contain cyanide)\n• Remove the core\n• Cut into small pieces\n• Good source of vitamins and fiber\n• Avoid apple seeds and core completely"
        }
        
        for food, resp_text in food_responses.items():
            if food in user_input_lower:
                prefix = ""
                if self.current_pet_info:
                    pet_name = self.current_pet_info.get('name', 'your pet')
                    species = self.current_pet_info.get('species', 'pet')
                    prefix = f"🍖 **Diet advice for {pet_name} ({species}):**\n\n"
                return {"response": f"{prefix}{resp_text}", "severity": "low"}
        
        prefix = ""
        if self.current_pet_info:
            pet_name = self.current_pet_info.get('name', 'your pet')
            species = self.current_pet_info.get('species', 'dog/cat')
            prefix = f"🍖 **General Diet Advice for {pet_name} ({species}):**\n\n"

        return {
            "response": f"{prefix}For diet and nutrition questions, it's best to be specific about the food item. Here are some common foods:\n\n✅ Safe: Chicken (cooked, no bones), apples (no seeds), carrots, plain rice\n❌ Toxic: Chocolate, grapes, onions, garlic, xylitol\n⚠️ Use caution: Milk, bread, dairy products\n\nFor specific questions about a food, just ask 'Can dogs eat [food name]?'",
            "severity": "low"
        }

    def handle_breed_question(self, user_input):
        """Handle breed-specific questions."""
        user_input_lower = user_input.lower()
        
        breed_info = {
            'golden retriever': {
                'name': 'Golden Retriever',
                'temperament': 'Friendly, intelligent, eager to please',
                'exercise': 'High - needs 1-2 hours of exercise daily',
                'grooming': 'Regular brushing needed, sheds moderately',
                'health': 'Prone to hip dysplasia, cancer, heart conditions',
                'lifespan': '10-12 years',
                'good_with_kids': 'Excellent',
                'diet': 'High-quality protein, watch weight gain'
            },
            'labrador': {
                'name': 'Labrador Retriever',
                'temperament': 'Friendly, outgoing, active',
                'exercise': 'Very high - needs lots of physical activity',
                'grooming': 'Low maintenance, sheds heavily',
                'health': 'Prone to hip/elbow dysplasia, obesity, eye problems',
                'lifespan': '10-14 years',
                'good_with_kids': 'Excellent',
                'diet': 'Watch portions carefully, prone to overeating'
            },
            'german shepherd': {
                'name': 'German Shepherd',
                'temperament': 'Loyal, confident, courageous',
                'exercise': 'Very high - needs mental and physical stimulation',
                'grooming': 'Regular brushing, sheds heavily',
                'health': 'Prone to hip dysplasia, bloat, degenerative myelopathy',
                'lifespan': '9-13 years',
                'good_with_kids': 'Good with proper socialization',
                'diet': 'High-quality protein for muscle maintenance'
            },
            'poodle': {
                'name': 'Poodle',
                'temperament': 'Intelligent, active, elegant',
                'exercise': 'Moderate to high depending on size',
                'grooming': 'High maintenance - professional grooming needed',
                'health': 'Generally healthy, watch for eye issues, hip dysplasia',
                'lifespan': '12-15 years',
                'good_with_kids': 'Excellent',
                'diet': 'Quality food, watch weight'
            },
            'bulldog': {
                'name': 'Bulldog',
                'temperament': 'Calm, courageous, friendly',
                'exercise': 'Low - short walks due to breathing issues',
                'grooming': 'Low maintenance, clean facial wrinkles regularly',
                'health': 'Prone to breathing problems, hip issues, skin infections',
                'lifespan': '8-10 years',
                'good_with_kids': 'Good',
                'diet': 'Watch weight, avoid foods that cause gas'
            },
            'persian': {
                'name': 'Persian Cat',
                'temperament': 'Gentle, quiet, sweet',
                'exercise': 'Low - prefers indoor life',
                'grooming': 'Very high - daily brushing needed',
                'health': 'Prone to breathing issues, eye problems, kidney disease',
                'lifespan': '10-17 years',
                'good_with_kids': 'Good with calm children',
                'diet': 'Quality cat food, watch weight'
            },
            'siamese': {
                'name': 'Siamese Cat',
                'temperament': 'Vocal, intelligent, social',
                'exercise': 'Moderate - enjoys interactive play',
                'grooming': 'Low maintenance',
                'health': 'Generally healthy, watch for dental issues',
                'lifespan': '15-20 years',
                'good_with_kids': 'Good',
                'diet': 'Quality cat food, can be picky eaters'
            }
        }
        
        # Check if pet has a breed in context if no breed specified in input
        matched_breed = None
        for breed_key, info in breed_info.items():
            if breed_key in user_input_lower:
                matched_breed = info
                break
        
        if not matched_breed and self.current_pet_info:
            pet_breed = self.current_pet_info.get('breed', '').lower()
            for breed_key, info in breed_info.items():
                if breed_key in pet_breed:
                    matched_breed = info
                    break

        if matched_breed:
            response = f"🐾 {matched_breed['name']}\n\n"
            response += f"**Temperament:** {matched_breed['temperament']}\n"
            response += f"**Exercise Needs:** {matched_breed['exercise']}\n"
            response += f"**Grooming:** {matched_breed['grooming']}\n"
            response += f"**Common Health Issues:** {matched_breed['health']}\n"
            response += f"**Lifespan:** {matched_breed['lifespan']}\n"
            response += f"**Good with Kids:** {matched_breed['good_with_kids']}\n"
            response += f"**Diet Notes:** {matched_breed['diet']}\n\n"
            response += "For detailed breed-specific care tips, use the 'Breed Care' section in the navigation!"
            return {"response": response, "severity": "low"}
        
        return {
            "response": "I can provide breed-specific information! Ask about popular breeds like:\n\n• Golden Retriever\n• Labrador\n• German Shepherd\n• Poodle\n• Bulldog\n• Persian Cat\n• Siamese Cat\n\nFor example: 'Tell me about Golden Retrievers' or 'What should I know about Labradors?'",
            "severity": "low"
        }

    def handle_exercise_question(self, user_input):
        """Handle exercise-related questions."""
        prefix = ""
        if self.current_pet_info:
            name = self.current_pet_info.get('name', 'your pet')
            species = self.current_pet_info.get('species', 'pet')
            prefix = f"🏃 **Exercise Advice for {name} ({species}):**\n\n"

        return {
            "response": f"{prefix}Exercise needs vary by breed, age, and health status:\n\n**General Guidelines:**\n• Dogs: 30 minutes to 2+ hours daily depending on breed\n• Cats: 15-30 minutes of interactive play daily\n• Puppies/Kittens: Shorter, more frequent sessions\n• Senior pets: Gentle, consistent exercise\n\n**Tips:**\n• Start slow and build up gradually\n• Watch for signs of fatigue (panting, lagging)\n• Adjust for weather (avoid extreme heat/cold)\n• Mix physical and mental stimulation\n• Consult your vet for pets with health conditions",
            "severity": "low"
        }

    def handle_grooming_question(self, user_input):
        """Handle grooming-related questions."""
        prefix = ""
        if self.current_pet_info:
            name = self.current_pet_info.get('name', 'your pet')
            species = self.current_pet_info.get('species', 'pet')
            prefix = f"✨ **Grooming Advice for {name} ({species}):**\n\n"

        return {
            "response": f"{prefix}Grooming needs vary significantly by breed and coat type:\n\n**General Guidelines:**\n• Dogs: Brush 1-3 times per week (daily for long-haired breeds)\n• Cats: Brush 1-2 times per week (daily for long-haired cats)\n• Bath: Dogs every 1-3 months, cats rarely need baths\n• Nail trimming: Every 2-4 weeks\n• Dental care: Daily brushing recommended\n\n**Specific Needs:**\n• Double-coated breeds: More frequent brushing\n• Short-haired breeds: Less frequent but still regular brushing\n• Cats: Self-groom but benefit from regular brushing",
            "severity": "low"
        }
