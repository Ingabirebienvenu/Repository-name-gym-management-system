from flask import Blueprint, request, jsonify
from app.models.payment_model import (
    get_all_payments, get_payment_by_id, get_payments_by_member, count_pending_payments,
    create_payment, submit_payment, validate_payment, reject_payment, delete_payment
)
from app.models.notification_model import create_notification
from app.utils.email_helper import send_membership_confirmation_email, send_payment_rejected_email

payment_bp = Blueprint('payment_bp', __name__, url_prefix='/api/payments')

@payment_bp.route('', methods=['GET'])
def list_payments():
    payments = get_all_payments()
    return jsonify(payments), 200

@payment_bp.route('/pending-count', methods=['GET'])
def pending_count():
    count = count_pending_payments()
    return jsonify({"count": count}), 200

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
    """Admin recording a payment directly — immediately marked Paid."""
    data = request.get_json()
    if not data.get('member_id') or not data.get('amount'):
        return jsonify({"error": "member_id and amount are required"}), 400
    new_id = create_payment(data, status='Paid')
    return jsonify({"message": "Payment recorded", "payment_id": new_id}), 201

@payment_bp.route('/submit', methods=['POST'])
def member_submit_payment():
    """Member submitting their own payment — goes in as Pending."""
    data = request.get_json()
    if not data.get('member_id') or not data.get('amount'):
        return jsonify({"error": "member_id and amount are required"}), 400
    new_id = submit_payment(data)
    return jsonify({"message": "Payment submitted, awaiting admin validation", "payment_id": new_id}), 201

@payment_bp.route('/<int:payment_id>/validate', methods=['PUT'])
def do_validate_payment(payment_id):
    payment = validate_payment(payment_id)
    if not payment:
        return jsonify({"error": "Payment not found or already processed"}), 404

    create_notification({
        "member_id": payment['member_id'],
        "message": f"Your membership is active from {payment['membership_start_date']} to {payment['membership_end_date']}.",
        "type": "General"
    })

    if payment.get('member_email'):
        send_membership_confirmation_email(
            payment['member_email'],
            payment['member_first_name'],
            payment['membership_start_date'],
            payment['membership_end_date'],
            payment['amount'],
            payment['payment_method']
        )

    return jsonify({"message": "Payment validated", "payment": payment}), 200

@payment_bp.route('/<int:payment_id>/reject', methods=['PUT'])
def do_reject_payment(payment_id):
    payment = reject_payment(payment_id)
    if not payment:
        return jsonify({"error": "Payment not found or already processed"}), 404

    create_notification({
        "member_id": payment['member_id'],
        "message": "Your recent payment could not be verified. Please try again or contact the front desk.",
        "type": "General"
    })

    if payment.get('member_email'):
        send_payment_rejected_email(payment['member_email'], payment['member_first_name'])

    return jsonify({"message": "Payment rejected", "payment": payment}), 200

@payment_bp.route('/<int:payment_id>', methods=['DELETE'])
def remove_payment(payment_id):
    affected = delete_payment(payment_id)
    if affected == 0:
        return jsonify({"error": "Payment not found"}), 404
    return jsonify({"message": "Payment deleted"}), 200