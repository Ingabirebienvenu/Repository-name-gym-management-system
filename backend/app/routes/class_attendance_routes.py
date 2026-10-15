from datetime import date, datetime
from flask import Blueprint, request, jsonify
from app.models.class_attendance_model import (
    VALID_STATUSES, get_class_basic, get_session_roster, save_session_attendance,
    get_member_attendance, get_class_attendance
)

class_attendance_bp = Blueprint('class_attendance_bp', __name__, url_prefix='/api/class-attendance')


def _parse_date(value):
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return None


@class_attendance_bp.route('/roster', methods=['GET'])
def roster():
    """Trainer: who is booked into this class, and what is already marked for the date."""
    class_id = request.args.get('class_id', type=int)
    session_date = _parse_date(request.args.get('date'))
    if not class_id or not session_date:
        return jsonify({"error": "class_id and date (YYYY-MM-DD) are required"}), 400
    if not get_class_basic(class_id):
        return jsonify({"error": "Class not found"}), 404
    return jsonify(get_session_roster(class_id, session_date)), 200


@class_attendance_bp.route('', methods=['POST'])
def save():
    """Trainer: record attendance for one class session."""
    data = request.get_json() or {}
    class_id = data.get('class_id')
    trainer_id = data.get('trainer_id')
    session_date = _parse_date(data.get('session_date'))
    records = data.get('records') or []

    if not class_id or not trainer_id or not session_date:
        return jsonify({"error": "class_id, trainer_id and session_date are required"}), 400
    if session_date > date.today():
        return jsonify({"error": "You can't record attendance for a future date"}), 400
    if not records:
        return jsonify({"error": "Mark at least one member"}), 400
    for r in records:
        if not r.get('member_id') or r.get('status') not in VALID_STATUSES:
            return jsonify({"error": "Each record needs member_id and a status of Present, Late or Absent"}), 400

    cls = get_class_basic(class_id)
    if not cls:
        return jsonify({"error": "Class not found"}), 404
    if cls['trainer_id'] != int(trainer_id):
        return jsonify({"error": "This class is not assigned to you"}), 403

    saved = save_session_attendance(class_id, session_date, trainer_id, records)
    return jsonify({"message": "Attendance saved", "saved": saved}), 201


@class_attendance_bp.route('/member/<int:member_id>', methods=['GET'])
def member_attendance(member_id):
    return jsonify(get_member_attendance(member_id)), 200


@class_attendance_bp.route('', methods=['GET'])
def all_attendance():
    """Admin: all class attendance, optional filters."""
    rows = get_class_attendance(
        class_id=request.args.get('class_id', type=int),
        date_from=request.args.get('date_from'),
        date_to=request.args.get('date_to'),
        status=request.args.get('status'),
    )
    return jsonify(rows), 200