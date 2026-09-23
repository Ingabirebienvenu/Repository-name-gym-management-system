from flask import Blueprint, request, jsonify
from app.models.trainer_model import (
    get_all_trainers, get_trainer_by_id,
    create_trainer, update_trainer, update_trainer_password, delete_trainer
)

trainer_bp = Blueprint('trainer_bp', __name__, url_prefix='/api/trainers')

@trainer_bp.route('', methods=['GET'])
def list_trainers():
    trainers = get_all_trainers()
    return jsonify(trainers), 200

@trainer_bp.route('/<int:trainer_id>', methods=['GET'])
def get_trainer(trainer_id):
    trainer = get_trainer_by_id(trainer_id)
    if not trainer:
        return jsonify({"error": "Trainer not found"}), 404
    return jsonify(trainer), 200

@trainer_bp.route('', methods=['POST'])
def add_trainer():
    data = request.get_json()
    required = ['first_name', 'last_name', 'email', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    result = create_trainer(data)
    if not result['success']:
        return jsonify({"error": result['error']}), 400
    return jsonify({"message": "Trainer created", "trainer_id": result['trainer_id']}), 201

@trainer_bp.route('/<int:trainer_id>', methods=['PUT'])
def edit_trainer(trainer_id):
    data = request.get_json()
    affected = update_trainer(trainer_id, data)
    if affected == 0:
        return jsonify({"error": "Trainer not found"}), 404
    return jsonify({"message": "Trainer updated"}), 200

@trainer_bp.route('/<int:trainer_id>/password', methods=['PUT'])
def reset_trainer_password(trainer_id):
    data = request.get_json()
    new_password = data.get('password')
    if not new_password:
        return jsonify({"error": "password is required"}), 400
    affected = update_trainer_password(trainer_id, new_password)
    if affected == 0:
        return jsonify({"error": "Trainer not found"}), 404
    return jsonify({"message": "Password updated"}), 200

@trainer_bp.route('/<int:trainer_id>', methods=['DELETE'])
def remove_trainer(trainer_id):
    affected = delete_trainer(trainer_id)
    if affected == 0:
        return jsonify({"error": "Trainer not found"}), 404
    return jsonify({"message": "Trainer deleted"}), 200