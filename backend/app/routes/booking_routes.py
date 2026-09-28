from flask import Blueprint, request, jsonify
from app.models.booking_model import (
    get_all_bookings, get_bookings_by_member, get_bookings_by_class,
    create_booking, cancel_booking, mark_attended
)

booking_bp = Blueprint('booking_bp', __name__, url_prefix='/api/bookings')

@booking_bp.route('', methods=['GET'])
def list_bookings():
    records = get_all_bookings()
    return jsonify(records), 200

@booking_bp.route('/member/<int:member_id>', methods=['GET'])
def get_member_bookings(member_id):
    records = get_bookings_by_member(member_id)
    return jsonify(records), 200

@booking_bp.route('/class/<int:class_id>', methods=['GET'])
def get_class_bookings(class_id):
    records = get_bookings_by_class(class_id)
    return jsonify(records), 200

@booking_bp.route('', methods=['POST'])
def add_booking():
    data = request.get_json()
    if not data.get('member_id') or not data.get('class_id'):
        return jsonify({"error": "member_id and class_id are required"}), 400

    result = create_booking(data)
    if not result['success']:
        return jsonify({"error": result['error']}), 400
    return jsonify({"message": "Booking confirmed", "booking_id": result['booking_id']}), 201

@booking_bp.route('/<int:booking_id>/cancel', methods=['PUT'])
def do_cancel_booking(booking_id):
    affected = cancel_booking(booking_id)
    if affected == 0:
        return jsonify({"error": "Booking not found"}), 404
    return jsonify({"message": "Booking cancelled"}), 200

@booking_bp.route('/<int:booking_id>/attend', methods=['PUT'])
def do_mark_attended(booking_id):
    affected = mark_attended(booking_id)
    if affected == 0:
        return jsonify({"error": "Booking not found"}), 404
    return jsonify({"message": "Marked as attended"}), 200