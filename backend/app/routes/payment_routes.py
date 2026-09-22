from flask import Blueprint, request, jsonify
from app.models.payment_model import (
    get_all_payments, get_payment_by_id, get_payments_by_member,
    create_payment, update_payment, delete_payment
)

payment_bp = Blueprint('payment_bp', __name__, url_prefix='/api/payments')

@payment_bp.route('', methods=['GET'])
def list_payments():
    payments = get_all_payments()
    return jsonify(payments), 200

@payment_bp.route('/<int:payment_id>', methods=['GET'])
def get_payment(payment_id):
    payment = get_payment_by_id(payment_id)
    if not payment:
        return jsonify({"error": "Payment not found"}), 404
    return jsonify(payment), 200

@payment_bp.route('/member/<int:member_id>', methods=['GET'])
def get_member_payments(member_id):
    payments = get_payments_by_member(member_id)
    return jsonify(payments), 200

@payment_bp.route('', methods=['POST'])
def add_payment():
    data = request.get_json()
    if not data.get('member_id') or not data.get('amount'):
        return jsonify({"error": "member_id and amount are required"}), 400
    new_id = create_payment(data)
    return jsonify({"message": "Payment recorded", "payment_id": new_id}), 201

@payment_bp.route('/<int:payment_id>', methods=['PUT'])
def edit_payment(payment_id):
    data = request.get_json()
    affected = update_payment(payment_id, data)
    if affected == 0:
        return jsonify({"error": "Payment not found"}), 404
    return jsonify({"message": "Payment updated"}), 200

@payment_bp.route('/<int:payment_id>', methods=['DELETE'])
def remove_payment(payment_id):
    affected = delete_payment(payment_id)
    if affected == 0:
        return jsonify({"error": "Payment not found"}), 404
    return jsonify({"message": "Payment deleted"}), 200