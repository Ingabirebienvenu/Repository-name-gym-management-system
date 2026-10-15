from flask import Blueprint, request, jsonify
from app.models.supplement_model import get_suggestions, add_suggestion, delete_suggestion
from app.utils.notifier import notify_member, trainer_name

supplement_bp = Blueprint('supplement_bp', __name__, url_prefix='/api/supplements')

@supplement_bp.route('/member/<int:member_id>', methods=['GET'])
def list_suggestions(member_id):
    return jsonify(get_suggestions(member_id)), 200

@supplement_bp.route('', methods=['POST'])
def create_suggestion():
    data = request.get_json()
    if not data.get('member_id') or not data.get('trainer_id') or not data.get('supplement_name'):
        return jsonify({"error": "member_id, trainer_id, and supplement_name are required"}), 400
    new_id = add_suggestion(data)

    name = trainer_name(data.get('trainer_id'))
    notify_member(
        data['member_id'],
        subject="Your trainer suggested a supplement",
        heading="New supplement suggestion",
        intro=f"{name} has a supplement suggestion for you.",
        rows=[
            ("Supplement", data.get('supplement_name')),
            ("Dosage", data.get('dosage')),
            ("Notes", data.get('notes')),
        ],
        closing="This is a suggestion only. Check with a doctor if you have a medical condition.",
        short_message=f"{name} suggested: {data.get('supplement_name')}.",
    )
    return jsonify({"message": "Suggestion added", "suggestion_id": new_id}), 201

@supplement_bp.route('/<int:suggestion_id>', methods=['DELETE'])
def remove_suggestion(suggestion_id):
    affected = delete_suggestion(suggestion_id)
    if affected == 0:
        return jsonify({"error": "Suggestion not found"}), 404
    return jsonify({"message": "Suggestion deleted"}), 200