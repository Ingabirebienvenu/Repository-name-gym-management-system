from flask import Blueprint, request, jsonify
from app.models.class_model import (
    get_all_classes, get_class_by_id,
    create_class, update_class, delete_class
)
from app.utils.notifier import notify_members, all_member_ids, booked_member_ids, trainer_name

class_bp = Blueprint('class_bp', __name__, url_prefix='/api/classes')


def _class_rows(data):
    return [
        ("Class", data.get('class_name')),
        ("Day", data.get('schedule_day')),
        ("Time", f"{data.get('start_time')} - {data.get('end_time')}"),
        ("Trainer", trainer_name(data.get('trainer_id')) if data.get('trainer_id') else "To be announced"),
        ("Capacity", data.get('capacity', 20)),
    ]


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

    # Tell every member about the new session (in-app + email)
    notify_members(
        all_member_ids(),
        subject=f"New class: {data.get('class_name')}",
        heading=f"New class: {data.get('class_name')}",
        intro="a new class has just been added to the gym schedule. Log in to book your spot before it fills up.",
        rows=_class_rows(data),
        short_message=f"New class: {data.get('class_name')} on {data.get('schedule_day')} at {data.get('start_time')}. Book it now!",
        notif_type="Class Reminder",
    )
    return jsonify({"message": "Class created", "class_id": new_id}), 201

@class_bp.route('/<int:class_id>', methods=['PUT'])
def edit_class(class_id):
    data = request.get_json()
    affected = update_class(class_id, data)
    if affected == 0:
        return jsonify({"error": "Class not found"}), 404

    # Tell members who already booked this class that it changed
    notify_members(
        booked_member_ids(class_id),
        subject=f"Class updated: {data.get('class_name')}",
        heading=f"Class updated: {data.get('class_name')}",
        intro="a class you booked has been updated. Here are the latest details.",
        rows=_class_rows(data),
        short_message=f"Class updated: {data.get('class_name')} is now {data.get('schedule_day')} at {data.get('start_time')}.",
        notif_type="Class Reminder",
    )
    return jsonify({"message": "Class updated"}), 200

@class_bp.route('/<int:class_id>', methods=['DELETE'])
def remove_class(class_id):
    # Collect the booked members BEFORE deleting (bookings cascade away with the class)
    existing = get_class_by_id(class_id)
    booked = booked_member_ids(class_id)
    affected = delete_class(class_id)
    if affected == 0:
        return jsonify({"error": "Class not found"}), 404

    if existing and booked:
        notify_members(
            booked,
            subject=f"Class cancelled: {existing['class_name']}",
            heading=f"Class cancelled: {existing['class_name']}",
            intro="we're sorry, a class you booked has been cancelled.",
            rows=[("Class", existing['class_name']), ("Day", existing.get('schedule_day'))],
            closing="Please check the schedule for other classes you can book.",
            short_message=f"Class cancelled: {existing['class_name']} ({existing.get('schedule_day')}).",
            notif_type="Class Reminder",
        )
    return jsonify({"message": "Class deleted"}), 200