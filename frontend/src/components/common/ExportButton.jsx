import { useState } from 'react';
import { downloadReport } from '../../services/api';
import '../members/MemberForm.css';
import './ExportButton.css';

/**
 * Props
 *  report        'members' | 'trainers' | 'classes' | 'payments' | 'attendance' | 'bookings' | 'full'
 *  label         name shown in the modal title, e.g. "Payments"
 *  buttonText    text on the button (default "Export")
 *  statusOptions optional list of statuses to filter by
 *  hasDateRange  show From / To date pickers
 *  dateLabel     what the dates refer to, e.g. "Payment date"
 */
function ExportButton({
  report,
  label,
  buttonText = 'Export',
  statusOptions,
  hasDateRange = false,
  dateLabel = 'Date range',
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  function close() {
    if (busy) return;
    setOpen(false);
    setError('');
  }

  async function handleDownload(format) {
    setError('');

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError('The "From" date must be before the "To" date.');
      return;
    }

    setBusy(format);
    try {
      const params = {};
      if (status) params.status = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await downloadReport(report, format, params);

      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      const today = new Date().toISOString().slice(0, 10);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `gym_${report}_report_${today}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Could not generate the report. Please try again.');
    } finally {
      setBusy('');
    }
  }

  const isFull = report === 'full';

  return (
    <>
      <button className="btn-export" onClick={() => setOpen(true)}>
        {buttonText}
      </button>

      {open && (
        <div className="modal-overlay">
          <div className="modal export-modal">
            <h2>Export {label}</h2>
            <p className="export-subtitle">
              {isFull
                ? 'A complete snapshot of every record in the system, one section per area.'
                : 'Choose what to include, then download the report.'}
            </p>

            {error && <p className="form-error">{error}</p>}

            {statusOptions && (
              <div className="form-row">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {hasDateRange && (
              <div className="form-row">
                <label>{dateLabel}</label>
                <div className="export-dates">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  <span>to</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <small className="export-hint">Leave empty to include everything.</small>
              </div>
            )}

            <div className="export-actions">
              <button
                className="btn-pdf"
                onClick={() => handleDownload('pdf')}
                disabled={Boolean(busy)}
              >
                {busy === 'pdf' ? 'Preparing PDF...' : 'Download PDF'}
              </button>
              <button
                className="btn-excel"
                onClick={() => handleDownload('excel')}
                disabled={Boolean(busy)}
              >
                {busy === 'excel' ? 'Preparing Excel...' : 'Download Excel'}
              </button>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={close} disabled={Boolean(busy)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExportButton;