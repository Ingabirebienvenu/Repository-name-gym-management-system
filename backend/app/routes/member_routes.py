from flask import Blueprint, request, jsonify
from app.models.member_model import (
    get_all_members, get_member_by_id,
    create_member, update_member, delete_member
)

member_bp = Blueprint('member_bp', __name__, url_prefix='/api/members')

@member_bp.route('', methods=['GET'])
def list_members():
    members = get_all_members()
    return jsonify(members), 200

@member_bp.route('/<int:member_id>', methods=['GET'])
def get_member(member_id):
    member = get_member_by_id(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404
    return jsonify(member), 200

@member_bp.route('', methods=['POST'])
def add_member():
    data = request.get_json()
    if not data.get('first_name') or not data.get('email'):
        return jsonify({"error": "first_name and email are required"}), 400
    new_id = create_member(data)
    return jsonify({"message": "Member created", "member_id": new_id}), 201

@member_bp.route('/<int:member_id>', methods=['PUT'])
def edit_member(member_id):
    data = request.get_json()
    affected = update_member(member_id, data)
    if affected == 0:
        return jsonify({"error": "Member not found"}), 404
    return jsonify({"message": "Member updated"}), 200

@member_bp.route('/<int:member_id>', methods=['DELETE'])
def remove_member(member_id):
    affected = delete_member(member_id)
    if affected == 0:
        return jsonify({"error": "Member not found"}), 404
    return jsonify({"message": "Member deleted"}), 200