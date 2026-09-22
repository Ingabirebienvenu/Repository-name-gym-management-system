from flask import Blueprint, request, jsonify
from app.models.trainer_model import (
    get_all_trainers, get_trainer_by_id,
    create_trainer, update_trainer, delete_trainer
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
    if not data.get('first_name') or not data.get('email'):
        return jsonify({"error": "first_name and email are required"}), 400
    new_id = create_trainer(data)
    return jsonify({"message": "Trainer created", "trainer_id": new_id}), 201

@trainer_bp.route('/<int:trainer_id>', methods=['PUT'])
def edit_trainer(trainer_id):
    data = request.get_json()
    affected = update_trainer(trainer_id, data)
    if affected == 0:
        return jsonify({"error": "Trainer not found"}), 404
    return jsonify({"message": "Trainer updated"}), 200

@trainer_bp.route('/<int:trainer_id>', methods=['DELETE'])
def remove_trainer(trainer_id):
    affected = delete_trainer(trainer_id)
    if affected == 0:
        return jsonify({"error": "Trainer not found"}), 404
    return jsonify({"message": "Trainer deleted"}), 200