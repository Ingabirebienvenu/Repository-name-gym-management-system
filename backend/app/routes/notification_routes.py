from flask import Blueprint, request, jsonify
from app.models.notification_model import (
    get_all_notifications, get_notifications_by_member,
    create_notification, mark_as_read, delete_notification
)

notification_bp = Blueprint('notification_bp', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
def list_notifications():
    records = get_all_notifications()
    return jsonify(records), 200

@notification_bp.route('/member/<int:member_id>', methods=['GET'])
def get_member_notifications(member_id):
    records = get_notifications_by_member(member_id)
    return jsonify(records), 200

@notification_bp.route('', methods=['POST'])
def add_notification():
    data = request.get_json()
    if not data.get('member_id') or not data.get('message'):
        return jsonify({"error": "member_id and message are required"}), 400
    new_id = create_notification(data)
    return jsonify({"message": "Notification sent", "notification_id": new_id}), 201

@notification_bp.route('/<int:notification_id>/read', methods=['PUT'])
def read_notification(notification_id):
    affected = mark_as_read(notification_id)
    if affected == 0:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Marked as read"}), 200

@notification_bp.route('/<int:notification_id>', methods=['DELETE'])
def remove_notification(notification_id):
    affected = delete_notification(notification_id)
    if affected == 0:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Notification deleted"}), 200