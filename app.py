from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from chatbot.chatbot import VetChatbot
from models import db, User, Pet, HealthRecord, Vaccination, Medication, WeightRecord, Appointment, ChatMessage, Veterinarian, Clinic, NGO, EmergencyContact, Notification, BreedCareInfo, PetEssential
import config

app = Flask(__name__)
app.config.from_object(config)
db.init_app(app)

with app.app_context():
    db.create_all()
    # Safe auto-migration for PostgreSQL & SQLite newly added columns
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            pet_columns = [
                ("allergies", "TEXT"),
                ("medical_conditions", "TEXT"),
                ("dietary_needs", "TEXT"),
                ("blood_type", "VARCHAR(50)"),
                ("is_neutered", "BOOLEAN DEFAULT FALSE"),
                ("activity_level", "VARCHAR(50)"),
                ("insurance_provider", "VARCHAR(100)"),
                ("insurance_policy_number", "VARCHAR(100)"),
                ("pedigree_id", "VARCHAR(100)"),
                ("notes", "TEXT")
            ]
            for col_name, col_type in pet_columns:
                try:
                    conn.execute(text(f"ALTER TABLE pets ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                    conn.commit()
                except Exception:
                    pass

            appt_columns = [
                ("pet_species", "VARCHAR(50)"),
                ("pet_name", "VARCHAR(100)")
            ]
            for col_name, col_type in appt_columns:
                try:
                    conn.execute(text(f"ALTER TABLE appointments ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                    conn.commit()
                except Exception:
                    pass

            try:
                conn.execute(text("ALTER TABLE appointments ALTER COLUMN pet_id DROP NOT NULL;"))
                conn.commit()
            except Exception:
                pass
    except Exception:
        pass

chatbot = VetChatbot()


# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json or request.headers.get('Accept') == 'application/json' or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('login', next=request.path))
        return f(*args, **kwargs)
    return decorated_function

# ==================== AUTHENTICATION ROUTES ====================

@app.route("/")
def index():
    """Landing page."""
    return render_template("landing.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.get_json()
        email = data.get("email", "")
        password = data.get("password", "")
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 400
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 400
        
        # Create session
        session['user_id'] = user.id
        session['user_email'] = user.email
        session['user_name'] = user.full_name
        session['user_role'] = user.role
        session['is_verified'] = user.is_verified
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'redirect': request.args.get('next') or '/dashboard'
        })
    
    return render_template("login.html")

@app.route("/auth/login", methods=["GET", "POST"])
def auth_login_alias():
    if request.method == "POST":
        return login()
    return redirect(url_for('login', **request.args))

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        data = request.get_json()
        email = data.get("email", "")
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")
        full_name = data.get("full_name", "")
        phone = data.get("phone", "")
        city = data.get("city", "")
        
        # Validation
        if not email or not password or not full_name:
            return jsonify({'error': 'All required fields must be filled'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        if password != confirm_password:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Check if email exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        user = User(
            email=email,
            full_name=full_name,
            phone=phone,
            city=city,
            role='PET_OWNER',
            is_verified=False,
            is_active=True
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Create session
        session['user_id'] = user.id
        session['user_email'] = user.email
        session['user_name'] = user.full_name
        session['user_role'] = user.role
        session['is_verified'] = user.is_verified
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': f'Welcome to VETPAW, {full_name}! 🐾',
            'redirect': '/dashboard'
        })
    
    return render_template("register.html")

@app.route("/auth/register", methods=["GET", "POST"])
def auth_register_alias():
    if request.method == "POST":
        return register()
    return redirect(url_for('register', **request.args))

@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    if request.is_json or request.headers.get('Accept') == 'application/json':
        return jsonify({'success': True, 'redirect': '/login'})
    return redirect(url_for('login'))

@app.route("/api/user/current")
def get_current_user():
    if 'user_id' not in session:
        return jsonify({"user": None})
    
    user = db.session.get(User, session['user_id'])
    if user:
        return jsonify({"user": user.to_dict()})
    return jsonify({"user": None})

# ==================== DASHBOARD ROUTES ====================

@app.route("/dashboard")
@login_required
def dashboard():
    """User dashboard."""
    return render_template("dashboard.html")

# ==================== PET MANAGEMENT ROUTES ====================

@app.route("/pets", methods=["GET", "POST"])
@login_required
def manage_pets():
    if request.method == "POST":
        data = request.get_json() or {}
        
        # Generate unique VETPAW ID
        vetpaw_id = Pet.generate_vetpaw_id(data.get('species', ''), data.get('name', ''))
        
        # Ensure uniqueness
        while Pet.query.filter_by(vetpaw_id=vetpaw_id).first():
            vetpaw_id = Pet.generate_vetpaw_id(data.get('species', ''), data.get('name', ''))
        
        dob_val = None
        if data.get('date_of_birth'):
            from datetime import datetime, date
            try:
                dob_val = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except Exception:
                dob_val = None

        pet = Pet(
            owner_id=session['user_id'],
            vetpaw_id=vetpaw_id,
            name=data.get('name', 'Unnamed Pet'),
            species=data.get('species', 'Dog'),
            breed=data.get('breed', 'Mixed Breed'),
            gender=data.get('gender', 'Unknown'),
            date_of_birth=dob_val,
            weight_kg=float(data.get('weight_kg') or data.get('weight') or 0.0) if (data.get('weight_kg') or data.get('weight')) else None,
            color=data.get('color', ''),
            microchip_id=data.get('microchip_id') or None,
            registration_id=data.get('registration_id') or None,
            profile_photo=data.get('profile_photo'),
            allergies=data.get('allergies', ''),
            medical_conditions=data.get('medical_conditions', ''),
            dietary_needs=data.get('dietary_needs', ''),
            blood_type=data.get('blood_type', ''),
            is_neutered=bool(data.get('is_neutered', False)),
            activity_level=data.get('activity_level', 'Moderate'),
            insurance_provider=data.get('insurance_provider', ''),
            insurance_policy_number=data.get('insurance_policy_number', ''),
            pedigree_id=data.get('pedigree_id', ''),
            notes=data.get('notes', ''),
            emergency_contact_name=data.get('emergency_contact_name', ''),
            emergency_contact_phone=data.get('emergency_contact_phone', ''),
            primary_vet_id=int(data['primary_vet_id']) if data.get('primary_vet_id') else None
        )
        
        db.session.add(pet)
        db.session.commit()
        
        # If weight is provided, automatically record initial weight in WeightRecord
        if pet.weight_kg:
            from datetime import date
            initial_weight = WeightRecord(
                pet_id=pet.id,
                weight_kg=pet.weight_kg,
                recorded_date=date.today(),
                notes="Initial weight on registration"
            )
            db.session.add(initial_weight)
            db.session.commit()
        
        return jsonify({'success': True, 'pet': pet.to_dict()})
    
    # GET - check if browser navigation
    if not (request.is_json or request.headers.get('Accept') == 'application/json' or request.headers.get('X-Requested-With') == 'XMLHttpRequest'):
        return render_template("pets.html")
    
    # GET - list user's pets
    pets = Pet.query.filter_by(owner_id=session['user_id']).all()
    return jsonify({"pets": [pet.to_dict() for pet in pets]})

@app.route("/api/pets", methods=["GET", "POST"])
@login_required
def api_manage_pets():
    return manage_pets()

@app.route("/pets/<int:pet_id>", methods=["GET", "PUT"])
@login_required
def pet_detail(pet_id):
    pet = db.get_or_404(Pet, pet_id)
    
    # Check ownership
    if pet.owner_id != session['user_id']:
        if not (request.is_json or request.headers.get('Accept') == 'application/json'):
            return render_template("pets.html"), 403
        return jsonify({"error": "Access denied"}), 403
    
    if request.method == "PUT":
        data = request.get_json() or {}
        
        for key, value in data.items():
            if hasattr(pet, key) and key not in ('id', 'owner_id', 'vetpaw_id', 'created_at'):
                if key == 'date_of_birth' and isinstance(value, str) and value:
                    from datetime import datetime
                    try:
                        value = datetime.strptime(value, '%Y-%m-%d').date()
                    except Exception:
                        continue
                if key == 'is_neutered':
                    value = bool(value)
                if key == 'weight_kg' and value is not None and value != '':
                    value = float(value)
                setattr(pet, key, value)
        
        db.session.commit()
        return jsonify({'success': True, 'pet': pet.to_dict()})
    
    # GET - check if browser navigation
    if not (request.is_json or request.headers.get('Accept') == 'application/json' or request.headers.get('X-Requested-With') == 'XMLHttpRequest'):
        return render_template("pet_profile.html")
    
    return jsonify({"pet": pet.to_dict()})

@app.route("/api/pets/<int:pet_id>", methods=["GET", "PUT"])
@login_required
def api_pet_detail(pet_id):
    return pet_detail(pet_id)


# ==================== HEALTH RECORDS ROUTES ====================

@app.route("/pets/<int:pet_id>/health-records", methods=["GET", "POST"])
@login_required
def pet_health_records(pet_id):
    pet = db.get_or_404(Pet, pet_id)
    
    # Check ownership
    if pet.owner_id != session['user_id']:
        return jsonify({"error": "Access denied"}), 403
    
    if request.method == "POST":
        data = request.get_json()
        
        record = HealthRecord(
            pet_id=pet_id,
            record_type=data.get('record_type'),
            visit_date=data.get('visit_date'),
            veterinarian_name=data.get('veterinarian_name'),
            clinic_name=data.get('clinic_name'),
            notes=data.get('notes'),
            diagnosis=data.get('diagnosis'),
            treatment=data.get('treatment'),
            follow_up_date=data.get('follow_up_date')
        )
        
        db.session.add(record)
        db.session.commit()
        
        return jsonify({'success': True, 'health_record': record.to_dict()})
    
    records = HealthRecord.query.filter_by(pet_id=pet_id).order_by(HealthRecord.visit_date.desc()).all()
    return jsonify({"health_records": [record.to_dict() for record in records]})

# ==================== VACCINATION ROUTES ====================

@app.route("/pets/<int:pet_id>/vaccinations", methods=["GET", "POST"])
@login_required
def pet_vaccinations(pet_id):
    pet = db.get_or_404(Pet, pet_id)
    
    # Check ownership
    if pet.owner_id != session['user_id']:
        return jsonify({"error": "Access denied"}), 403
    
    if request.method == "POST":
        data = request.get_json()
        
        vaccination = Vaccination(
            pet_id=pet_id,
            vaccine_name=data.get('vaccine_name'),
            administration_date=data.get('administration_date'),
            next_due_date=data.get('next_due_date'),
            veterinarian_name=data.get('veterinarian_name'),
            clinic_name=data.get('clinic_name'),
            batch_number=data.get('batch_number'),
            notes=data.get('notes'),
            status=data.get('status', 'SCHEDULED')
        )
        
        db.session.add(vaccination)
        db.session.commit()
        
        return jsonify({'success': True, 'vaccination': vaccination.to_dict()})
    
    vaccinations = Vaccination.query.filter_by(pet_id=pet_id).order_by(Vaccination.administration_date.desc()).all()
    
    # Calculate status
    completed = sum(1 for v in vaccinations if v.status == 'COMPLETED')
    overdue = sum(1 for v in vaccinations if v.status == 'OVERDUE')
    
    return jsonify({
        "vaccinations": [v.to_dict() for v in vaccinations],
        "status": {
            "completed": completed,
            "overdue": overdue,
            "total": len(vaccinations)
        }
    })

# ==================== MEDICATION ROUTES ====================

@app.route("/pets/<int:pet_id>/medications", methods=["GET", "POST"])
@login_required
def pet_medications(pet_id):
    pet = db.get_or_404(Pet, pet_id)
    
    # Check ownership
    if pet.owner_id != session['user_id']:
        return jsonify({"error": "Access denied"}), 403
    
    if request.method == "POST":
        data = request.get_json()
        
        medication = Medication(
            pet_id=pet_id,
            medication_name=data.get('medication_name'),
            dosage=data.get('dosage'),
            frequency=data.get('frequency'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            prescribing_vet=data.get('prescribing_vet'),
            notes=data.get('notes'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(medication)
        db.session.commit()
        
        return jsonify({'success': True, 'medication': medication.to_dict()})
    
    active_only = request.args.get('active_only', 'false').lower() == 'true'
    query = Medication.query.filter_by(pet_id=pet_id)
    
    if active_only:
        query = query.filter_by(is_active=True)
    
    medications = query.order_by(Medication.created_at.desc()).all()
    return jsonify({"medications": [m.to_dict() for m in medications]})

@app.route("/pets/<int:pet_id>/medications/<int:medication_id>", methods=["PUT"])
@login_required
def update_medication(pet_id, medication_id):
    pet = db.get_or_404(Pet, pet_id)
    if pet.owner_id != session['user_id']:
        return jsonify({"error": "Access denied"}), 403
    medication = Medication.query.filter_by(id=medication_id, pet_id=pet_id).first_or_404()
    data = request.get_json() or {}
    if 'is_active' in data:
        medication.is_active = bool(data['is_active'])
    for key, value in data.items():
        if hasattr(medication, key) and key not in ('id', 'pet_id', 'created_at'):
            setattr(medication, key, value)
    db.session.commit()
    return jsonify({'success': True, 'medication': medication.to_dict()})

# ==================== WEIGHT TRACKING ROUTES ====================

@app.route("/pets/<int:pet_id>/weight", methods=["GET", "POST"])
@login_required
def pet_weight(pet_id):
    pet = db.get_or_404(Pet, pet_id)
    
    # Check ownership
    if pet.owner_id != session['user_id']:
        return jsonify({"error": "Access denied"}), 403
    
    if request.method == "POST":
        data = request.get_json()
        
        record = WeightRecord(
            pet_id=pet_id,
            weight_kg=data.get('weight_kg'),
            recorded_date=data.get('recorded_date'),
            notes=data.get('notes')
        )
        
        db.session.add(record)
        db.session.commit()
        
        return jsonify({'success': True, 'weight_record': record.to_dict()})
    
    history = WeightRecord.query.filter_by(pet_id=pet_id).order_by(WeightRecord.recorded_date.desc()).all()
    return jsonify({"weight_history": [r.to_dict() for r in history]})

# ==================== CHATBOT ROUTES ====================

@app.route("/chat", methods=["GET"])
def chat_page():
    """Chat page."""
    return render_template("chat.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "")
    pet_id = data.get("pet_id")
    
    # Load pet context if pet_id is provided
    prompt = message
    if pet_id:
        try:
            pet = db.session.get(Pet, int(pet_id))
            if pet and ('user_id' not in session or pet.owner_id == session.get('user_id')):
                # Active medications
                medications = Medication.query.filter_by(pet_id=pet.id, is_active=True).all()
                med_list = [f"{m.medication_name} ({m.dosage} {m.frequency})" for m in medications]
                meds_str = ", ".join(med_list) if med_list else "None"
                
                # Last health record
                last_record = HealthRecord.query.filter_by(pet_id=pet.id).order_by(HealthRecord.visit_date.desc()).first()
                if last_record:
                    diag = last_record.diagnosis or "Routine checkup"
                    treat = f", Treatment: {last_record.treatment}" if last_record.treatment else ""
                    last_rec_str = f"{last_record.record_type} on {last_record.visit_date.isoformat()} (Diagnosis: {diag}{treat})"
                else:
                    last_rec_str = "None"
                
                # Vaccinations
                from datetime import date
                today = date.today()
                vacs = Vaccination.query.filter_by(pet_id=pet.id).all()
                overdue = [v.vaccine_name for v in vacs if v.status == 'OVERDUE' or (v.next_due_date and v.next_due_date < today and v.status != 'COMPLETED')]
                if overdue:
                    vac_status_str = f"OVERDUE vaccines: {', '.join(overdue)}"
                else:
                    vac_status_str = "All vaccinations are up-to-date"
                
                age_val = pet.get_age()
                age_str = f"{age_val} years" if age_val is not None else "Unknown age"
                
                context_paragraph = (
                    f"Pet Context: Name: {pet.name}, Species: {pet.species}, Breed: {pet.breed or 'Mixed'}, "
                    f"Age: {age_str}, Active Medications: {meds_str}, Last Health Record: {last_rec_str}, "
                    f"Vaccination Status: {vac_status_str}."
                )
                prompt = f"{context_paragraph}\nUser Message: {message}"
        except Exception as e:
            app.logger.error(f"Error loading pet context: {e}")
    
    # Process message with chatbot
    result = chatbot.process_message(prompt)
    
    # Save chat history if user is logged in
    if 'user_id' in session:
        chat_message = ChatMessage(
            user_id=session['user_id'],
            pet_id=int(pet_id) if pet_id else None,
            message=message,
            response=result.get('response', ''),
            urgency_level=result.get('severity', 'LOW')
        )
        db.session.add(chat_message)
        db.session.commit()
    
    return jsonify(result)

@app.route("/chat/history", methods=["GET"])
@login_required
def chat_history():
    pet_id = request.args.get('pet_id')
    
    query = ChatMessage.query.filter_by(user_id=session['user_id'])
    
    if pet_id:
        query = query.filter_by(pet_id=pet_id)
    
    messages = query.order_by(ChatMessage.timestamp.desc()).limit(50).all()
    return jsonify({"chat_history": [m.to_dict() for m in messages]})

# ==================== VETERINARIAN ROUTES ====================

@app.route("/vets", methods=["GET"])
def vets_page():
    """Veterinarians page."""
    return render_template("vets.html")

@app.route("/veterinarians", methods=["GET", "POST"])
@app.route("/api/veterinarians", methods=["GET", "POST"])
def manage_veterinarians():
    if request.method == "POST":
        data = request.get_json()
        
        vet = Veterinarian(
            name=data.get('name'),
            clinic_id=data.get('clinic_id'),
            specialization=data.get('specialization'),
            phone=data.get('phone'),
            email=data.get('email'),
            is_verified=data.get('is_verified', False)
        )
        
        db.session.add(vet)
        db.session.commit()
        
        return jsonify({'success': True, 'veterinarian': vet.to_dict()})
    
    # Search veterinarians
    city = request.args.get('city')
    specialization = request.args.get('specialization')
    emergency_only = request.args.get('emergency_only', 'false').lower() == 'true'
    
    query = Veterinarian.query
    
    if city:
        query = query.join(Clinic).filter(Clinic.city.ilike(f'%{city}%'))
    
    if specialization:
        query = query.filter(Veterinarian.specialization.ilike(f'%{specialization}%'))
    
    if emergency_only:
        query = query.join(Clinic).filter(Clinic.emergency_services == True)
    
    vets = query.all()
    return jsonify({"veterinarians": [v.to_dict() for v in vets]})

# ==================== NGO ROUTES ====================

@app.route("/ngos", methods=["GET"])
def ngos_page():
    """NGOs page."""
    return render_template("ngos.html")

@app.route("/api/ngos", methods=["GET", "POST"])
def manage_ngos():
    if request.method == "POST":
        data = request.get_json()
        
        ngo = NGO(
            name=data.get('name'),
            description=data.get('description'),
            city=data.get('city'),
            address=data.get('address'),
            phone=data.get('phone'),
            email=data.get('email'),
            website=data.get('website'),
            services=data.get('services'),
            is_verified=data.get('is_verified', False)
        )
        
        db.session.add(ngo)
        db.session.commit()
        
        return jsonify({'success': True, 'ngo': ngo.to_dict()})
    
    # Search NGOs
    city = request.args.get('city')
    services_needed = request.args.get('services_needed')
    
    query = NGO.query
    
    if city:
        query = query.filter(NGO.city.ilike(f'%{city}%'))
    
    if services_needed:
        query = query.filter(NGO.services.ilike(f'%{services_needed}%'))
    
    ngos = query.filter_by(is_verified=True).all()
    return jsonify({"ngos": [n.to_dict() for n in ngos]})

# ==================== EMERGENCY ROUTES ====================

@app.route("/emergency", methods=["GET"])
def emergency_page():
    """Emergency page."""
    return render_template("emergency.html")

@app.route("/emergency-contacts", methods=["GET"])
@app.route("/api/emergency-contacts", methods=["GET"])
def emergency_contacts():
    city = request.args.get('city')
    contact_type = request.args.get('contact_type')
    
    query = EmergencyContact.query.filter_by(is_verified=True)
    
    if city:
        query = query.filter(EmergencyContact.city.ilike(f'%{city}%'))
    
    if contact_type:
        query = query.filter(EmergencyContact.contact_type.ilike(f'%{contact_type}%'))
    
    contacts = query.all()
    return jsonify({"emergency_contacts": [c.to_dict() for c in contacts]})

# ==================== APPOINTMENT ROUTES ====================

@app.route("/appointments", methods=["GET"])
@login_required
def appointments_page():
    """Appointments page."""
    return render_template("appointments.html")

@app.route("/api/appointments", methods=["GET", "POST"])
@login_required
def manage_appointments():
    if request.method == "POST":
        data = request.get_json() or {}
        
        pet_id_raw = data.get('pet_id')
        pet_id_int = int(pet_id_raw) if pet_id_raw and str(pet_id_raw).isdigit() else None
        pet = db.session.get(Pet, pet_id_int) if pet_id_int else None
        
        pet_species = data.get('pet_species') or (pet.species if pet else 'Dog')
        pet_name = data.get('pet_name') or (pet.name if pet else ('Dog' if pet_species == 'Dog' else 'Cat'))
        
        appt_date_raw = data.get('appointment_date', '')
        appt_time_raw = data.get('appointment_time', '')
        
        from datetime import datetime
        appt_dt = None
        if appt_date_raw:
            try:
                if 'T' in str(appt_date_raw):
                    appt_dt = datetime.fromisoformat(str(appt_date_raw))
                elif appt_time_raw:
                    appt_dt = datetime.strptime(f"{appt_date_raw} {appt_time_raw}", '%Y-%m-%d %H:%M')
                else:
                    appt_dt = datetime.strptime(str(appt_date_raw), '%Y-%m-%d')
            except Exception:
                appt_dt = datetime.now()
        else:
            appt_dt = datetime.now()
        
        vet_id = int(data['veterinarian_id']) if data.get('veterinarian_id') else None
        clinic_id = int(data['clinic_id']) if data.get('clinic_id') else None

        appointment = Appointment(
            user_id=session['user_id'],
            pet_id=pet_id_int,
            pet_species=pet_species,
            pet_name=pet_name,
            veterinarian_id=vet_id,
            clinic_id=clinic_id,
            appointment_date=appt_dt,
            reason=data.get('reason', 'Veterinary Consultation'),
            status='SCHEDULED',
            notes=data.get('notes', '')
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({'success': True, 'appointment': appointment.to_dict()})
    
    # GET - list user's appointments
    appointments = Appointment.query.filter_by(user_id=session['user_id']).order_by(Appointment.appointment_date.desc()).all()
    return jsonify({"appointments": [a.to_dict() for a in appointments]})


@app.route("/pets/<int:pet_id>/appointments", methods=["GET"])
@login_required
def get_appointments(pet_id):
    pet = db.get_or_404(Pet, pet_id)
    
    # Check ownership
    if pet.owner_id != session['user_id']:
        return jsonify({"error": "Access denied"}), 403
    
    appointments = Appointment.query.filter_by(pet_id=pet_id).order_by(Appointment.appointment_date.desc()).all()
    return jsonify({"appointments": [a.to_dict() for a in appointments]})

# ==================== BREED CARE ROUTES ====================

@app.route("/breed-care", methods=["GET"])
def breed_care_page():
    """Breed care page."""
    return render_template("breed_care.html")

@app.route("/api/breed-care", methods=["GET", "POST"])
def breed_care():
    if request.method == "POST":
        data = request.get_json()
        
        care_info = BreedCareInfo(
            species=data.get('species'),
            breed=data.get('breed'),
            nutrition=data.get('nutrition'),
            exercise=data.get('exercise'),
            grooming=data.get('grooming'),
            common_health_issues=data.get('common_health_issues'),
            preventive_care=data.get('preventive_care'),
            life_expectancy=data.get('life_expectancy')
        )
        
        db.session.add(care_info)
        db.session.commit()
        
        return jsonify({'success': True, 'breed_care': care_info.to_dict()})
    
    species = request.args.get('species')
    breed = request.args.get('breed')
    
    if species and breed:
        care_info = BreedCareInfo.query.filter(
            BreedCareInfo.species.ilike(species),
            BreedCareInfo.breed.ilike(f"%{breed}%")
        ).first()
        if care_info:
            return jsonify({"breed_care": care_info.to_dict()})
    
    return jsonify({"error": "Breed care information not found"}), 404

# ==================== PET ESSENTIALS ROUTES ====================

@app.route("/essentials", methods=["GET"])
def essentials_page():
    """Pet essentials page."""
    return render_template("essentials.html")

@app.route("/api/pet-essentials", methods=["GET", "POST"])
def pet_essentials():
    if request.method == "POST":
        data = request.get_json()
        
        essential = PetEssential(
            category=data.get('category'),
            item_name=data.get('item_name'),
            description=data.get('description'),
            species=data.get('species'),
            breed=data.get('breed'),
            age_group=data.get('age_group'),
            size_category=data.get('size_category'),
            importance=data.get('importance', 'Essential')
        )
        
        db.session.add(essential)
        db.session.commit()
        
        return jsonify({'success': True, 'essential': essential.to_dict()})
    
    # Search essentials
    category = request.args.get('category')
    species = request.args.get('species')
    
    query = PetEssential.query
    
    if category:
        query = query.filter(PetEssential.category == category)
    
    if species:
        query = query.filter(PetEssential.species == species)
    
    essentials = query.all()
    return jsonify({"essentials": [e.to_dict() for e in essentials]})

# ==================== NOTIFICATIONS ROUTES ====================

@app.route("/notifications", methods=["GET"])
@app.route("/api/notifications", methods=["GET"])
@login_required
def get_notifications():
    query = Notification.query.filter_by(user_id=session['user_id'])
    if request.args.get('unread_only') == 'true':
        query = query.filter_by(is_read=False)
        
    notifications = query.order_by(Notification.created_at.desc()).all()
    return jsonify({"notifications": [n.to_dict() for n in notifications]})

# ==================== CLINICS ROUTE ====================

@app.route("/api/clinics", methods=["GET"])
def clinics():
    """Get all clinics."""
    clinics = Clinic.query.all()
    return jsonify({"clinics": [c.to_dict() for c in clinics]})

if __name__ == "__main__":
    app.run(debug=True)

