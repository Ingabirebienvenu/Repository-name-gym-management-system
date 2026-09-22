from flask import Blueprint, request, jsonify
from app.models.attendance_model import (
    get_all_attendance, get_attendance_by_member,
    check_in, check_out, delete_attendance
)

attendance_bp = Blueprint('attendance_bp', __name__, url_prefix='/api/attendance')

@attendance_bp.route('', methods=['GET'])
def list_attendance():
    records = get_all_attendance()
    return jsonify(records), 200

@attendance_bp.route('/member/<int:member_id>', methods=['GET'])
def get_member_attendance(member_id):
    records = get_attendance_by_member(member_id)
    return jsonify(records), 200

@attendance_bp.route('/check-in', methods=['POST'])
def do_check_in():
    data = request.get_json()
    member_id = data.get('member_id')
    if not member_id:
        return jsonify({"error": "member_id is required"}), 400
    new_id = check_in(member_id)
    return jsonify({"message": "Checked in", "attendance_id": new_id}), 201

@attendance_bp.route('/check-out/<int:attendance_id>', methods=['PUT'])
def do_check_out(attendance_id):
    affected = check_out(attendance_id)
    if affected == 0:
        return jsonify({"error": "Attendance record not found"}), 404
    return jsonify({"message": "Checked out"}), 200

@attendance_bp.route('/<int:attendance_id>', methods=['DELETE'])
def remove_attendance(attendance_id):
    affected = delete_attendance(attendance_id)
    if affected == 0:
        return jsonify({"error": "Attendance record not found"}), 404
    return jsonify({"message": "Attendance record deleted"}), 200