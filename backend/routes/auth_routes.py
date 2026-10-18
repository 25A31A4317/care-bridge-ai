import hashlib
import random
import re
from flask import Blueprint, request, jsonify, session
from backend.database.db import get_db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode('utf-8')).hexdigest()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
        
    pw_hash = hash_pw(password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND password_hash = ?", (username, pw_hash))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "Invalid username or password"}), 401
            
        user_dict = dict(user)
        # Fetch profile if patient
        profile = None
        if user_dict['role'] == 'patient':
            cursor.execute("SELECT * FROM patient_profiles WHERE user_id = ?", (user_dict['id'],))
            p = cursor.fetchone()
            if p:
                profile = dict(p)
                
        user_dict.pop('password_hash', None)
        return jsonify({
            "message": "Login successful",
            "user": user_dict,
            "profile": profile
        })

@auth_bp.route('/switch_demo_user', methods=['POST'])
def switch_demo_user():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user_dict = dict(user)
        profile = None
        if user_dict['role'] == 'patient':
            cursor.execute("SELECT * FROM patient_profiles WHERE user_id = ?", (user_dict['id'],))
            p = cursor.fetchone()
            if p:
                profile = dict(p)
                
        user_dict.pop('password_hash', None)
        return jsonify({
            "message": "Switched demo user",
            "user": user_dict,
            "profile": profile
        })

@auth_bp.route('/demo_users', methods=['GET'])
def get_demo_users():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.role, u.language_preference,
                   p.full_name, p.age, p.emergency_contact, p.medical_notes
            FROM users u
            LEFT JOIN patient_profiles p ON u.id = p.user_id
        """)
        users = [dict(r) for r in cursor.fetchall()]
        return jsonify({"users": users})

@auth_bp.route('/language', methods=['POST'])
def set_language():
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)
    lang = data.get('language', 'te')
    
    if lang not in ['te', 'en']:
        return jsonify({"error": "Supported languages are 'te' and 'en'"}), 400
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET language_preference = ? WHERE id = ?", (lang, user_id))
        
    return jsonify({"message": "Language updated", "language": lang})

@auth_bp.route('/register', methods=['POST'])
def register_patient():
    data = request.get_json() or {}
    
    full_name = data.get('full_name', '').strip()
    age = data.get('age')
    language_pref = data.get('language_preference', 'te')
    if language_pref not in ['te', 'en']:
        language_pref = 'te'
        
    gender = data.get('gender')
    mobile = data.get('mobile')
    date_of_birth = data.get('date_of_birth')
    email = (data.get('email') or '').strip()
    emergency_contact = data.get('emergency_contact')
    medical_notes = data.get('medical_notes')
    
    # Validates: full_name required, age required (must be number)
    if not full_name:
        return jsonify({"error": "Full name is required"}), 400
        
    if age is None or age == '':
        return jsonify({"error": "Age is required"}), 400
    try:
        age_int = int(age)
        if age_int <= 0 or age_int > 130:
            return jsonify({"error": "Age must be a valid positive number"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Age must be a valid number"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Auto-generates username from full_name (lowercase, no spaces + random 3 digits)
        clean_name = re.sub(r'[^a-zA-Z0-9]', '', full_name.lower())
        if not clean_name:
            clean_name = "patient"
            
        username = None
        for _ in range(50):
            cand_username = f"{clean_name}{random.randint(100, 999)}"
            cursor.execute("SELECT id FROM users WHERE username = ?", (cand_username,))
            if not cursor.fetchone():
                username = cand_username
                break
                
        if not username:
            username = f"user{random.randint(10000, 99999)}"
            
        # Password = username + '123' (simple for demo)
        password = f"{username}123"
        pw_hash = hash_pw(password)
        
        # Email resolution & check
        if not email:
            email = f"{username}@patient.carebridge.ai"
        else:
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                return jsonify({"error": "A user with this email address already exists"}), 400

        # Creates a new user with role='patient'
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, role, language_preference)
            VALUES (?, ?, ?, 'patient', ?)
        """, (username, email, pw_hash, language_pref))
        user_id = cursor.lastrowid
        
        # Creates patient_profiles entry with is_demo=0
        cursor.execute("""
            INSERT INTO patient_profiles (
                user_id, full_name, age, primary_language, gender, mobile, date_of_birth,
                emergency_contact, medical_notes, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (user_id, full_name, age_int, language_pref, gender, mobile, date_of_birth,
              emergency_contact, medical_notes))
        profile_id = cursor.lastrowid

        # Return the new user object with profile
        cursor.execute("SELECT id, username, email, role, language_preference, created_at FROM users WHERE id = ?", (user_id,))
        user_dict = dict(cursor.fetchone())
        
        cursor.execute("SELECT * FROM patient_profiles WHERE id = ?", (profile_id,))
        profile_dict = dict(cursor.fetchone())

        return jsonify({
            "message": "Patient registered successfully",
            "user": user_dict,
            "profile": profile_dict,
            "demo_password": password
        }), 201

@auth_bp.route('/profile/<int:user_id>', methods=['PUT'])
def update_profile(user_id: int):
    data = request.get_json() or {}
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM patient_profiles WHERE user_id = ?", (user_id,))
        profile = cursor.fetchone()
        if not profile:
            return jsonify({"error": "Patient profile not found"}), 404

        updatable_fields = [
            'full_name', 'age', 'gender', 'mobile',
            'emergency_contact', 'medical_notes', 'date_of_birth', 'primary_language'
        ]
        
        updates = []
        params = []
        for field in updatable_fields:
            if field in data:
                val = data[field]
                if field == 'age' and val is not None and val != '':
                    try:
                        val = int(val)
                    except (ValueError, TypeError):
                        return jsonify({"error": "Age must be a valid number"}), 400
                updates.append(f"{field} = ?")
                params.append(val)
                
        if updates:
            params.append(user_id)
            cursor.execute(f"UPDATE patient_profiles SET {', '.join(updates)} WHERE user_id = ?", params)
            
        cursor.execute("SELECT * FROM patient_profiles WHERE user_id = ?", (user_id,))
        updated_profile = dict(cursor.fetchone())
        
        return jsonify({
            "message": "Profile updated successfully",
            "profile": updated_profile
        })

@auth_bp.route('/patients', methods=['GET'])
def get_patients():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.role, u.language_preference, u.created_at,
                   p.id as profile_id, p.full_name, p.age, p.primary_language, p.gender,
                   p.mobile, p.date_of_birth, p.emergency_contact, p.medical_notes,
                   COALESCE(p.is_demo, 0) as is_demo
            FROM users u
            JOIN patient_profiles p ON u.id = p.user_id
            WHERE u.role = 'patient'
            ORDER BY p.is_demo DESC, u.id ASC
        """)
        patients = [dict(r) for r in cursor.fetchall()]
        return jsonify({"patients": patients})

