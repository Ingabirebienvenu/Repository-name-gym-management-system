from flask import Blueprint, request, jsonify
from app.models.message_model import (
    get_trainer_members, get_unread_counts_for_trainer,
    get_conversation, send_message, mark_conversation_read
)

message_bp = Blueprint('message_bp', __name__, url_prefix='/api/messages')

@message_bp.route('/trainer/<int:trainer_id>/members', methods=['GET'])
def list_trainer_members(trainer_id):
    members = get_trainer_members(trainer_id)
    unread = get_unread_counts_for_trainer(trainer_id)
    for m in members:
        m['unread_count'] = unread.get(m['member_id'], 0)
    return jsonify(members), 200

@message_bp.route('/conversation/<int:trainer_id>/<int:member_id>', methods=['GET'])
def conversation(trainer_id, member_id):
    messages = get_conversation(trainer_id, member_id)
    return jsonify(messages), 200

@message_bp.route('', methods=['POST'])
def add_message():
    data = request.get_json()
    if not data.get('trainer_id') or not data.get('member_id') or not data.get('message'):
        return jsonify({"error": "trainer_id, member_id, and message are required"}), 400
    if data.get('sender') not in ('trainer', 'member'):
        return jsonify({"error": "sender must be 'trainer' or 'member'"}), 400
    new_id = send_message(data['trainer_id'], data['member_id'], data['sender'], data['message'])
    return jsonify({"message": "Sent", "message_id": new_id}), 201

@message_bp.route('/conversation/<int:trainer_id>/<int:member_id>/read', methods=['PUT'])
def read_conversation(trainer_id, member_id):
    data = request.get_json()
    reader = data.get('reader')
    if reader not in ('trainer', 'member'):
        return jsonify({"error": "reader must be 'trainer' or 'member'"}), 400
    mark_conversation_read(trainer_id, member_id, reader)
    return jsonify({"message": "Marked as read"}), 200