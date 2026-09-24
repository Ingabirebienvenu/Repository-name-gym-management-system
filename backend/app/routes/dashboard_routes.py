from flask import Blueprint, jsonify
from app.models.dashboard_model import (
    get_revenue_by_month, get_members_by_type,
    get_payments_by_method, get_attendance_last_7_days
)

dashboard_bp = Blueprint('dashboard_bp', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
def stats():
    return jsonify({
        "revenue_by_month": get_revenue_by_month(),
        "members_by_type": get_members_by_type(),
        "payments_by_method": get_payments_by_method(),
        "attendance_last_7_days": get_attendance_last_7_days(),
    }), 200