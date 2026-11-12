// Used Codex to help add the Canvas calendar import form.
// Prompt: Add a calendar upload form that lets me choose a class and import tasks.
import React, { useState } from 'react';
import { FileUp, X } from 'lucide-react';

export default function CalendarImportDialog({ classes, busy, error, onImport, onClose }) {
  const [classId, setClassId] = useState('');
  const [file, setFile] = useState(null);

  function submit(event) {
    event.preventDefault();
    if (!busy && file && classId) onImport(file, Number(classId));
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}>
      <section className="assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-import-title">
        <div className="dialog-heading">
          <h2 id="calendar-import-title">Import class schedule</h2>
          <button className="icon-button quiet" type="button" disabled={busy} onClick={onClose} aria-label="Close import"><X size={20} /></button>
        </div>
        <p className="notice">Upload a Canvas calendar (.ics). All tasks go into the class you choose, with 30-minute estimates and medium priority. You can edit them afterward.</p>
        {classes.length === 0 && <p className="notice">Add a class using Add a task before importing.</p>}
        {error && <p className="notice" role="alert">{error}</p>}
        <form className="assignment-form" onSubmit={submit}>
          <label className="field full-field">Class
            <select autoFocus required disabled={busy} value={classId} onChange={(event) => setClassId(event.target.value)}>
              <option value="">Select a class</option>
              {classes.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </label>
          <label className="field full-field">Calendar file
            <input required type="file" accept=".ics,text/calendar" disabled={busy} onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <div className="dialog-actions full-field">
            <button className="button secondary-button" type="button" disabled={busy} onClick={onClose}>Cancel</button>
            <button className="button primary-button" type="submit" disabled={busy || !file || !classId}>
              <FileUp size={17} /> {busy ? 'Importing…' : 'Import tasks'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
