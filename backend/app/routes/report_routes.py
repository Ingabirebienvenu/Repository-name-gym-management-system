from datetime import datetime

from flask import Blueprint, request, jsonify, send_file

from app.utils.report_builder import (
    REPORTS, FULL_ORDER, collect_sections, build_excel, build_pdf
)

report_bp = Blueprint('report_bp', __name__, url_prefix='/api/reports')

EXCEL_MIMETYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


def _valid_date(value):
    try:
        datetime.strptime(value, '%Y-%m-%d')
        return True
    except (TypeError, ValueError):
        return False


@report_bp.route('/<report>/<fmt>', methods=['GET'])
def export_report(report, fmt):
    """
    GET /api/reports/<report>/<pdf|excel>
      report: members | trainers | classes | payments | attendance | bookings | full
      optional query params: status, date_from, date_to (YYYY-MM-DD)
    """
    if fmt not in ('pdf', 'excel'):
        return jsonify({"error": "Format must be 'pdf' or 'excel'"}), 400
    if report != 'full' and report not in REPORTS:
        return jsonify({"error": f"Unknown report '{report}'"}), 404

    is_full = report == 'full'

    # The full-system report is always a complete snapshot, so filters are ignored.
    filters = {}
    if not is_full:
        filters = {
            'status': request.args.get('status') or None,
            'date_from': request.args.get('date_from') or None,
            'date_to': request.args.get('date_to') or None,
        }
        for key in ('date_from', 'date_to'):
            if filters[key] and not _valid_date(filters[key]):
                return jsonify({"error": f"{key} must be in YYYY-MM-DD format"}), 400
        if filters['date_from'] and filters['date_to'] and filters['date_from'] > filters['date_to']:
            return jsonify({"error": "date_from must not be after date_to"}), 400

    keys = FULL_ORDER if is_full else [report]
    sections = collect_sections(keys, filters)

    stamp = datetime.now().strftime('%Y%m%d')
    if fmt == 'excel':
        buffer = build_excel(sections, filters, full=is_full)
        mimetype = EXCEL_MIMETYPE
        filename = f"gym_{report}_report_{stamp}.xlsx"
    else:
        buffer = build_pdf(sections, filters, full=is_full)
        mimetype = 'application/pdf'
        filename = f"gym_{report}_report_{stamp}.pdf"

    return send_file(buffer, mimetype=mimetype, as_attachment=True, download_name=filename)