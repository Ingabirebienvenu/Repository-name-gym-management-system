from flask import Blueprint, request, jsonify
from app.models.progress_model import get_progress, add_progress, delete_progress

progress_bp = Blueprint('progress_bp', __name__, url_prefix='/api/progress')

@progress_bp.route('/member/<int:member_id>', methods=['GET'])
def list_progress(member_id):
    return jsonify(get_progress(member_id)), 200

@progress_bp.route('', methods=['POST'])
def create_progress():
    data = request.get_json()
    if not data.get('member_id') or not data.get('trainer_id'):
        return jsonify({"error": "member_id and trainer_id are required"}), 400
    if not data.get('weight_kg') and not data.get('body_fat_percent') and not data.get('notes'):
        return jsonify({"error": "Provide at least one of weight_kg, body_fat_percent, or notes"}), 400
    new_id = add_progress(data)
    return jsonify({"message": "Progress logged", "progress_id": new_id}), 201

@progress_bp.route('/<int:progress_id>', methods=['DELETE'])
def remove_progress(progress_id):
    affected = delete_progress(progress_id)
    if affected == 0:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify({"message": "Entry deleted"}), 200