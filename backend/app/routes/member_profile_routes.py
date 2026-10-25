import re
from datetime import date, datetime
from flask import Blueprint, request, jsonify
from app.models.member_profile_model import (
    get_profile, email_in_use, update_profile, change_password
)

member_profile_bp = Blueprint('member_profile_bp', __name__, url_prefix='/api/member-profile')

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
PHONE_RE = re.compile(r'^[0-9+\-\s()]{6,20}$')


@member_profile_bp.route('/<int:member_id>', methods=['GET'])
def read_profile(member_id):
    profile = get_profile(member_id)
    if not profile:
        return jsonify({"error": "Member not found"}), 404
    return jsonify(profile), 200


@member_profile_bp.route('/<int:member_id>', methods=['PUT'])
def save_profile(member_id):
    if not get_profile(member_id):
        return jsonify({"error": "Member not found"}), 404

    data = request.get_json() or {}
    clean = {
        'first_name': (data.get('first_name') or '').strip(),
        'last_name': (data.get('last_name') or '').strip(),
        'email': (data.get('email') or '').strip().lower(),
        'phone': (data.get('phone') or '').strip(),
        'date_of_birth': (data.get('date_of_birth') or '').strip(),
    }

    if not clean['first_name'] or not clean['last_name']:
        return jsonify({"error": "First name and last name are required"}), 400
    if len(clean['first_name']) > 50 or len(clean['last_name']) > 50:
        return jsonify({"error": "Names must be 50 characters or fewer"}), 400
    if not EMAIL_RE.match(clean['email']) or len(clean['email']) > 100:
        return jsonify({"error": "Enter a valid email address"}), 400
    if clean['phone'] and not PHONE_RE.match(clean['phone']):
        return jsonify({"error": "Enter a valid phone number (digits, +, - and spaces only)"}), 400
    if clean['date_of_birth']:
        try:
            dob = datetime.strptime(clean['date_of_birth'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Date of birth must look like YYYY-MM-DD"}), 400
        if dob >= date.today():
            return jsonify({"error": "Date of birth must be in the past"}), 400

    if email_in_use(clean['email'], member_id):
        return jsonify({"error": "That email is already used by another account"}), 400

    update_profile(member_id, clean)
    return jsonify({"message": "Profile updated", "profile": get_profile(member_id)}), 200


@member_profile_bp.route('/<int:member_id>/password', methods=['PUT'])
def save_password(member_id):
    if not get_profile(member_id):
        return jsonify({"error": "Member not found"}), 404

    data = request.get_json() or {}
    current = data.get('current_password') or ''
    new = data.get('new_password') or ''

    if not current or not new:
        return jsonify({"error": "Enter your current and new password"}), 400
    if len(new) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400
    if new == current:
        return jsonify({"error": "New password must be different from the current one"}), 400

    if not change_password(member_id, current, new):
        return jsonify({"error": "Current password is incorrect"}), 400
    return jsonify({"message": "Password changed"}), 200