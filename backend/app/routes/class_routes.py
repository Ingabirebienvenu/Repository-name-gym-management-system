from flask import Blueprint, request, jsonify
from app.models.class_model import (
    get_all_classes, get_class_by_id,
    create_class, update_class, delete_class
)

class_bp = Blueprint('class_bp', __name__, url_prefix='/api/classes')

@class_bp.route('', methods=['GET'])
def list_classes():
    classes = get_all_classes()
    return jsonify(classes), 200

@class_bp.route('/<int:class_id>', methods=['GET'])
def get_class(class_id):
    cls = get_class_by_id(class_id)
    if not cls:
        return jsonify({"error": "Class not found"}), 404
    return jsonify(cls), 200

@class_bp.route('', methods=['POST'])
def add_class():
    data = request.get_json()
    if not data.get('class_name') or not data.get('start_time') or not data.get('end_time'):
        return jsonify({"error": "class_name, start_time, and end_time are required"}), 400
    new_id = create_class(data)
    return jsonify({"message": "Class created", "class_id": new_id}), 201

@class_bp.route('/<int:class_id>', methods=['PUT'])
def edit_class(class_id):
    data = request.get_json()
    affected = update_class(class_id, data)
    if affected == 0:
        return jsonify({"error": "Class not found"}), 404
    return jsonify({"message": "Class updated"}), 200

@class_bp.route('/<int:class_id>', methods=['DELETE'])
def remove_class(class_id):
    affected = delete_class(class_id)
    if affected == 0:
        return jsonify({"error": "Class not found"}), 404
    return jsonify({"message": "Class deleted"}), 200