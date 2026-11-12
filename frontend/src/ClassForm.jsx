import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

export default function ClassForm({ onCreate, onCancel }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await onCreate(name.trim());
    } catch (error) {
      setError(error.message || 'Could not create the class.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className="folder-form" onSubmit={submit}>
        <input aria-label="Class name" autoFocus maxLength={150} required disabled={saving} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Biology 101" />
        <button className="icon-button small-icon-button" type="submit" disabled={saving} aria-label="Create class"><Check size={17} /></button>
        <button className="icon-button small-icon-button" type="button" disabled={saving} onClick={onCancel} aria-label="Cancel class creation"><X size={17} /></button>
      </form>
      {saving && <p role="status">Saving class…</p>}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
