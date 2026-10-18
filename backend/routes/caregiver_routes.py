import json
from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from backend.database.db import get_db

caregiver_bp = Blueprint('caregiver', __name__, url_prefix='/api/caregiver')

@caregiver_bp.route('/relationships', methods=['GET'])
def get_relationships():
    patient_id = request.args.get('patient_id', default=1, type=int)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cr.id, cr.patient_id, cr.caregiver_id, cr.relationship_type,
                   cr.status, cr.permissions, cr.created_at,
                   u.username, u.email
            FROM caregiver_relationships cr
            JOIN users u ON cr.caregiver_id = u.id
            WHERE cr.patient_id = ?
        """, (patient_id,))
        relationships = [dict(r) for r in cursor.fetchall()]
        for r in relationships:
            try:
                r['permissions_list'] = json.loads(r['permissions'])
            except:
                r['permissions_list'] = []
                
        return jsonify({
            "relationships": relationships,
            "active_count": len([r for r in relationships if r['status'] == 'active']),
            "max_allowed": 2
        })

@caregiver_bp.route('/authorize', methods=['POST'])
def authorize_caregiver():
    data = request.get_json() or {}
    patient_id = data.get('patient_id', 1)
    email = data.get('email', '').strip()
    relationship_type = data.get('relationship_type', 'Family Member')
    permissions = data.get('permissions', ["view_schedules", "view_documents", "view_careplan", "view_status"])

    if not email:
        return jsonify({"error": "Caregiver email is required"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Enforce Requirement 10: "Allow a patient to authorize up to two trusted caregivers."
        cursor.execute("SELECT COUNT(*) FROM caregiver_relationships WHERE patient_id = ? AND status = 'active'", (patient_id,))
        active_count = cursor.fetchone()[0]
        if active_count >= 2:
            return jsonify({
                "error": "Maximum of 2 active authorized caregivers reached. Please revoke an existing caregiver first.",
                "error_te": "గరిష్టంగా ఇద్దరు సంరక్షకులను మాత్రమే అనుమతించవచ్చు. కొత్తవారిని చేర్చడానికి ముందున్న వారిని రద్దు చేయండి."
            }), 400

        # Find or create caregiver user account
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        caregiver_user = cursor.fetchone()
        
        if not caregiver_user:
            # Create a caregiver account with temporary hashed password
            import hashlib
            temp_hash = hashlib.sha256("caregiver123".encode('utf-8')).hexdigest()
            username = email.split('@')[0] + "_caregiver"
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, role, language_preference)
                VALUES (?, ?, ?, 'caregiver', 'te')
            """, (username, email, temp_hash))
            caregiver_id = cursor.lastrowid
        else:
            caregiver_id = caregiver_user['id']

        # Insert relationship
        cursor.execute("""
            INSERT INTO caregiver_relationships (patient_id, caregiver_id, relationship_type, status, permissions)
            VALUES (?, ?, ?, 'active', ?)
        """, (patient_id, caregiver_id, relationship_type, json.dumps(permissions)))
        rel_id = cursor.lastrowid

    return jsonify({"message": "Caregiver authorized successfully", "relationship_id": rel_id})

@caregiver_bp.route('/revoke/<int:rel_id>', methods=['POST'])
def revoke_caregiver(rel_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE caregiver_relationships SET status = 'revoked' WHERE id = ?", (rel_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Caregiver relationship not found"}), 404
            
    return jsonify({"message": "Caregiver access revoked successfully"})

@caregiver_bp.route('/patient-status', methods=['GET'])
def get_patient_status_for_caregiver():
    caregiver_id = request.args.get('caregiver_id', type=int)
    patient_id = request.args.get('patient_id', default=1, type=int)

    if not caregiver_id:
        return jsonify({"error": "Caregiver ID is required for verification"}), 401

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verify active authorization on backend
        cursor.execute("""
            SELECT status, permissions FROM caregiver_relationships
            WHERE caregiver_id = ? AND patient_id = ?
        """, (caregiver_id, patient_id))
        rel = cursor.fetchone()
        
        if not rel or rel['status'] != 'active':
            return jsonify({
                "error": "Unauthorized. You do not have active caregiver permissions for this patient.",
                "error_te": "అనుమతి నిరాకరించబడింది. ఈ రోగి వివరాలను చూసే హక్కు మీకు లేదు."
            }), 403

        permissions = json.loads(rel['permissions'])
        
        # Fetch Patient Demographics
        cursor.execute("SELECT full_name, age, emergency_contact, primary_language FROM patient_profiles WHERE user_id = ?", (patient_id,))
        patient = dict(cursor.fetchone() or {})
        
        # Dose Status Today
        doses_today = []
        if "view_status" in permissions:
            from datetime import date
            today_str = date.today().isoformat()
            cursor.execute("""
                SELECT de.*, ms.medicine_name, ms.strength, ms.food_relation
                FROM dose_events de
                JOIN medicine_schedules ms ON de.schedule_id = ms.id
                WHERE de.patient_id = ? AND de.scheduled_time LIKE ?
                ORDER BY de.scheduled_time ASC
            """, (patient_id, f"{today_str}%"))
            doses_today = [dict(r) for r in cursor.fetchall()]

        # Verified Schedules
        schedules = []
        if "view_schedules" in permissions:
            cursor.execute("""
                SELECT * FROM medicine_schedules
                WHERE patient_id = ? AND is_active = 1
                ORDER BY is_verified DESC
            """, (patient_id,))
            schedules = [dict(r) for r in cursor.fetchall()]

        # Care Plan
        care_plan = None
        if "view_careplan" in permissions:
            cursor.execute("""
                SELECT * FROM care_plans
                WHERE patient_id = ?
                ORDER BY id DESC LIMIT 1
            """, (patient_id,))
            cp = cursor.fetchone()
            if cp:
                care_plan = dict(cp)

        # Follow-up Appointments
        cursor.execute("""
            SELECT * FROM follow_up_appointments
            WHERE patient_id = ? AND status = 'scheduled'
            ORDER BY appointment_date ASC LIMIT 1
        """, (patient_id,))
        appt = cursor.fetchone()
        appointment = dict(appt) if appt else None

        return jsonify({
            "patient": patient,
            "permissions": permissions,
            "doses_today": doses_today,
            "schedules": schedules,
            "care_plan": care_plan,
            "appointment": appointment
        })

@caregiver_bp.route('/alerts', methods=['GET'])
def get_caregiver_alerts():
    caregiver_id = request.args.get('caregiver_id', type=int)

    with get_db() as conn:
        cursor = conn.cursor()
        if caregiver_id:
            cursor.execute("""
                SELECT ca.id, ca.patient_id, ca.caregiver_id, ca.schedule_id, ca.alert_type,
                       ca.message_en, ca.message_te, ca.status, ca.grace_minutes, ca.created_at,
                       p.full_name as patient_name,
                       ms.medicine_name, ms.dose, ms.strength, ms.food_relation
                FROM caregiver_alerts ca
                LEFT JOIN patient_profiles p ON ca.patient_id = p.user_id
                LEFT JOIN medicine_schedules ms ON ca.schedule_id = ms.id
                WHERE ca.caregiver_id = ? AND ca.status = 'pending'
                ORDER BY ca.created_at DESC
            """, (caregiver_id,))
        else:
            cursor.execute("""
                SELECT ca.id, ca.patient_id, ca.caregiver_id, ca.schedule_id, ca.alert_type,
                       ca.message_en, ca.message_te, ca.status, ca.grace_minutes, ca.created_at,
                       p.full_name as patient_name,
                       ms.medicine_name, ms.dose, ms.strength, ms.food_relation
                FROM caregiver_alerts ca
                LEFT JOIN patient_profiles p ON ca.patient_id = p.user_id
                LEFT JOIN medicine_schedules ms ON ca.schedule_id = ms.id
                WHERE ca.status = 'pending'
                ORDER BY ca.created_at DESC
            """)

        alerts = [dict(r) for r in cursor.fetchall()]
        return jsonify({
            "alerts": alerts,
            "count": len(alerts)
        })

@caregiver_bp.route('/alerts/dismiss/<int:alert_id>', methods=['POST'])
def dismiss_alert(alert_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE caregiver_alerts SET status = 'dismissed' WHERE id = ?", (alert_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Alert not found"}), 404

    return jsonify({"message": "Alert dismissed", "alert_id": alert_id})

@caregiver_bp.route('/alerts/check-overdue', methods=['POST'])
def check_overdue_alerts():
    data = request.get_json(silent=True) or {}
    global_grace_param = data.get('grace_minutes') or data.get('grace_period')
    try:
        global_grace_param = int(global_grace_param) if global_grace_param is not None else None
    except (ValueError, TypeError):
        global_grace_param = None

    now = datetime.now()
    today_str = date.today().isoformat()
    new_alerts_count = 0

    with get_db() as conn:
        cursor = conn.cursor()

        # Step 1: Ensure today's dose events exist for active verified schedules
        cursor.execute("""
            SELECT id, patient_id, exact_times 
            FROM medicine_schedules 
            WHERE is_active = 1 AND is_verified = 1
        """)
        active_scheds = [dict(r) for r in cursor.fetchall()]
        for s in active_scheds:
            try:
                times = json.loads(s['exact_times'])
            except Exception:
                times = [s['exact_times']] if s['exact_times'] else []
            for t in times:
                sched_time = f"{today_str} {t}"
                cursor.execute("""
                    SELECT id FROM dose_events 
                    WHERE schedule_id = ? AND scheduled_time = ?
                """, (s['id'], sched_time))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO dose_events (schedule_id, patient_id, scheduled_time, status)
                        VALUES (?, ?, ?, 'pending')
                    """, (s['id'], s['patient_id'], sched_time))

        # Step 2: Fetch all pending dose events for active schedules
        cursor.execute("""
            SELECT de.id as dose_id, de.schedule_id, de.patient_id, de.scheduled_time,
                   ms.medicine_name, ms.dose, ms.strength,
                   p.full_name as patient_name
            FROM dose_events de
            JOIN medicine_schedules ms ON de.schedule_id = ms.id
            LEFT JOIN patient_profiles p ON de.patient_id = p.user_id
            WHERE de.status = 'pending' AND ms.is_active = 1
        """)
        pending_doses = [dict(r) for r in cursor.fetchall()]

        # Step 3: Cache notification preferences for grace period
        cursor.execute("SELECT user_id, grace_period_minutes FROM notification_preferences")
        user_prefs = {r['user_id']: r['grace_period_minutes'] for r in cursor.fetchall()}

        for de in pending_doses:
            sched_time_str = de['scheduled_time']
            sched_dt = None
            for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"):
                try:
                    sched_dt = datetime.strptime(sched_time_str, fmt)
                    break
                except ValueError:
                    pass

            if not sched_dt:
                try:
                    time_parts = sched_time_str.strip().split(':')
                    if len(time_parts) >= 2:
                        sched_dt = datetime.strptime(f"{today_str} {time_parts[0]}:{time_parts[1]}", "%Y-%m-%d %H:%M")
                except Exception:
                    continue

            if not sched_dt:
                continue

            # Determine grace period for this patient
            if global_grace_param is not None:
                grace_minutes = global_grace_param
            else:
                grace_minutes = user_prefs.get(de['patient_id'], 15) or 15

            cutoff_time = sched_dt + timedelta(minutes=grace_minutes)

            # If current time is past scheduled_time + grace_period, it's overdue
            if now >= cutoff_time:
                # Find all active caregivers for this patient
                cursor.execute("""
                    SELECT caregiver_id 
                    FROM caregiver_relationships 
                    WHERE patient_id = ? AND status = 'active'
                """, (de['patient_id'],))
                caregivers = cursor.fetchall()

                patient_name = de['patient_name'] or 'Patient'
                med_name = de['medicine_name'] or 'Medicine'
                strength_info = f" ({de['strength']})" if de['strength'] else (f" ({de['dose']})" if de['dose'] else "")
                time_only = sched_dt.strftime("%I:%M %p")

                msg_en = f"{patient_name} has an unconfirmed dose of {med_name}{strength_info} scheduled for {time_only} (overdue by >{grace_minutes}m)."
                msg_te = f"{patient_name} గారు {time_only} సమయానికి తీసుకోవలసిన {med_name}{strength_info} మందును ఇంకా తీసుకోలేదు ({grace_minutes} నిమిషాల గడువు దాటింది)."

                for cg in caregivers:
                    cg_id = cg['caregiver_id']
                    # Check if an alert already exists for this caregiver, schedule, and dose time
                    cursor.execute("""
                        SELECT id FROM caregiver_alerts 
                        WHERE caregiver_id = ? AND schedule_id = ? AND (
                            status = 'pending' OR message_en LIKE ?
                        )
                    """, (cg_id, de['schedule_id'], f"%{time_only}%"))
                    existing_alert = cursor.fetchone()

                    if not existing_alert:
                        cursor.execute("""
                            INSERT INTO caregiver_alerts (
                                patient_id, caregiver_id, schedule_id, alert_type,
                                message_en, message_te, status, grace_minutes
                            ) VALUES (?, ?, ?, 'unconfirmed_dose', ?, ?, 'pending', ?)
                        """, (de['patient_id'], cg_id, de['schedule_id'], msg_en, msg_te, grace_minutes))
                        new_alerts_count += 1

    return jsonify({
        "message": "Overdue dose check completed",
        "alerts_created": new_alerts_count
    })

