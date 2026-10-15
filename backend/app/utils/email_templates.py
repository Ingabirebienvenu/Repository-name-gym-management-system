"""Shared HTML layout for every email the system sends."""
from html import escape


def build_email(heading, intro, rows=None, closing=None):
    """
    heading : big title line, e.g. "New class: Yoga"
    intro   : one short paragraph
    rows    : optional list of (label, value) pairs shown as a table
    closing : optional last line before the signature
    All values are HTML-escaped, so user text can never break the layout.
    """
    table = ""
    if rows:
        cells = "".join(
            f'<tr><td style="padding:6px 0;color:#64748b;">{escape(str(k))}</td>'
            f'<td style="padding:6px 0;font-weight:bold;">{escape(str(v))}</td></tr>'
            for k, v in rows if v not in (None, "")
        )
        table = f'<table style="width:100%;border-collapse:collapse;margin:1.2rem 0;">{cells}</table>'

    closing_html = f"<p>{escape(closing)}</p>" if closing else ""
    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#1e293b;">{escape(heading)}</h2>
        <p>{escape(intro)}</p>
        {table}
        {closing_html}
        <p style="color:#94a3b8;font-size:0.85rem;">— Gym Manager Team</p>
    </div>
    """