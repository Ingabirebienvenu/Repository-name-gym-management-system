from flask import Blueprint, request, jsonify
from app.models.auth_model import register_member, authenticate
from app.utils.jwt_helper import generate_token

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    required = ['first_name', 'last_name', 'email', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    result = register_member(data)
    if not result['success']:
        return jsonify({"error": result['error']}), 400

    token = generate_token(result['member_id'], 'member')
    return jsonify({
        "message": "Registration successful",
        "token": token,
        "role": "member",
        "user_id": result['member_id']
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    result = authenticate(email, password)
    if not result['success']:
        return jsonify({"error": result['error']}), 401

    token = generate_token(result['user']['id'], result['role'])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "role": result['role'],
        "user": result['user']
    }), 200