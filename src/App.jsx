import React, { useEffect, useState } from 'react';
import {
  AlarmClock,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileUp,
  Mic,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  SquarePen,
  X,
} from 'lucide-react';
import { parseCanvasCalendar } from './canvasCalendar.js';
import { parseVoiceAssignment } from './voiceCommands.js';
import StudyWorkspace from './StudyWorkspace.jsx';

const STORAGE_KEY = 'assignitdone.assignments.v1';

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createSamples() {
  return [
    { id: 'sample-1', title: 'Project proposal', course: 'Human Computer Interaction', dueDate: dateOffset(1), minutes: 45, priority: 'High', completed: false, details: 'Draft the problem statement and outline the study goals.' },
    { id: 'sample-2', title: 'Team formation reply', course: 'Computer Science Seminar', dueDate: dateOffset(2), minutes: 20, priority: 'Medium', completed: false, details: 'Send the response to the team discussion.' },
    { id: 'sample-3', title: 'Chapter 3 reading', course: 'Cognitive Psychology', dueDate: dateOffset(4), minutes: 60, priority: 'Low', completed: false, details: 'Read the chapter and capture a few notes.' },
    { id: 'sample-4', title: 'Usability reflection', course: 'Human Computer Interaction', dueDate: dateOffset(6), minutes: 30, priority: 'Medium', completed: false, details: 'Write a short reflection on this week’s activity.' },
  ];
}

function readAssignments() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : createSamples();
  } catch {
    return createSamples();
  }
}

function formatDueDate(value) {
  if (!value) return 'No due date';
  const due = new Date(`${value}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (due.toDateString() === today.toDateString()) return 'Due today';
  if (due.toDateString() === tomorrow.toDateString()) return 'Due tomorrow';
  return `Due ${new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(due)}`;
}

function formatLongDate() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function AssignmentDialog({ assignment, onClose, onSave, voiceTranscript }) {
  const isEditing = Boolean(assignment?.id);
  const [form, setForm] = useState(() => assignment || {
    title: '', course: '', dueDate: dateOffset(3), minutes: 30, priority: 'Medium', details: '',
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave({ ...form, minutes: Math.max(5, Number(form.minutes) || 5) });
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">YOUR COURSEWORK</span>
            <h2 id="dialog-title">{isEditing ? 'Edit assignment' : 'Add an assignment'}</h2>
          </div>
          <button className="icon-button quiet" type="button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
        </div>
        {voiceTranscript && <div className="voice-review"><Mic size={17} /><p><strong>I heard:</strong> {voiceTranscript}<br />Review the details before saving.</p></div>}
        <form onSubmit={submit} className="assignment-form">
          <label className="field full-field">Assignment name
            <input autoFocus required maxLength={80} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Research proposal" />
          </label>
          <label className="field full-field">Course
            <input required maxLength={60} value={form.course} onChange={(event) => update('course', event.target.value)} placeholder="e.g. Human Computer Interaction" />
          </label>
          <label className="field">Due date
            <input required type="date" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
          </label>
          <label className="field">Time estimate
            <span className="input-with-suffix"><input required min="5" max="999" type="number" value={form.minutes} onChange={(event) => update('minutes', event.target.value)} /><span>min</span></span>
          </label>
          <label className="field full-field">Priority
            <select value={form.priority} onChange={(event) => update('priority', event.target.value)}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </label>
          <label className="field full-field">Notes <span className="optional-label">Optional</span>
            <textarea rows="3" maxLength={240} value={form.details || ''} onChange={(event) => update('details', event.target.value)} placeholder="Add a helpful reminder" />
          </label>
          <div className="dialog-actions full-field">
            <button className="button secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary-button" type="submit"><Check size={17} /> Save assignment</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AssignmentRow({ assignment, onEdit, onToggle }) {
  return (
    <article className={`assignment-row ${assignment.completed ? 'is-complete' : ''}`}>
      <button className="completion-button" type="button" onClick={() => onToggle(assignment.id)} aria-label={`${assignment.completed ? 'Reopen' : 'Mark'} ${assignment.title} ${assignment.completed ? 'incomplete' : 'complete'}`}>
        {assignment.completed ? <CheckCircle2 size={23} /> : <span className="empty-check" />}
      </button>
      <div className="assignment-copy">
        <p className="course-name">{assignment.course}</p>
        <h3>{assignment.title}</h3>
        <div className="assignment-meta">
          <span className={new Date(`${assignment.dueDate}T12:00:00`) < new Date(new Date().setHours(0, 0, 0, 0)) && !assignment.completed ? 'overdue' : ''}>
            <CalendarDays size={15} /> {formatDueDate(assignment.dueDate)}
          </span>
          <span><Clock3 size={15} /> {assignment.minutes} min</span>
          <span className={`priority priority-${assignment.priority.toLowerCase()}`}>{assignment.priority}</span>
        </div>
      </div>
      <button className="icon-button edit-button" type="button" onClick={() => onEdit(assignment)} aria-label={`Edit ${assignment.title}`}><SquarePen size={18} /></button>
    </article>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('tasks');
  const [assignments, setAssignments] = useState(readAssignments);
  const [availableMinutes, setAvailableMinutes] = useState(30);
  const [dialogAssignment, setDialogAssignment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [notice, setNotice] = useState('Sample assignments are ready. Import a calendar file whenever you want.');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [recommendationId, setRecommendationId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => {
      setTimerSeconds((seconds) => {
        if (seconds <= 1) {
          setTimerRunning(false);
          setNotice('Time is up. Take a breath, then choose your next step.');
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const incomplete = assignments.filter((assignment) => !assignment.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completed = assignments.filter((assignment) => assignment.completed);
  const fitting = incomplete.filter((assignment) => Number(assignment.minutes) <= Number(availableMinutes));
  const recommended = fitting[0] || incomplete[0] || null;
  const recommendationFits = recommended && Number(recommended.minutes) <= Number(availableMinutes);
  const timerMinutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const timerRemainder = (timerSeconds % 60).toString().padStart(2, '0');

  function saveAssignment(values) {
    if (values.id) {
      setAssignments((current) => current.map((item) => item.id === values.id ? { ...item, ...values } : item));
      setNotice(`${values.title} updated.`);
    } else {
      setAssignments((current) => [...current, { ...values, id: crypto.randomUUID(), completed: false }]);
      setNotice(`${values.title} added to your list.`);
    }
    setDialogOpen(false);
    setDialogAssignment(null);
    setVoiceTranscript('');
  }

  function toggleAssignment(id) {
    const target = assignments.find((item) => item.id === id);
    if (!target) return;
    setAssignments((current) => current.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
    setNotice(target.completed ? `${target.title} is back on your list.` : `${target.title} marked complete. Nice work.`);
    if (recommendationId === id) setRecommendationId(null);
  }

  function openDialog(assignment = null) {
    setVoiceTranscript('');
    setDialogAssignment(assignment);
    setDialogOpen(true);
  }

  function chooseNextTask() {
    setRecommendationId(recommended?.id || null);
    setNotice(recommended ? (recommendationFits ? `${recommended.title} is a good fit for ${availableMinutes} minutes.` : `Nothing fits ${availableMinutes} minutes yet. ${recommended.title} is the closest upcoming task.`) : 'You’re all caught up. Add a task whenever you’re ready.');
  }

  function startTimer() {
    if (!recommended) return;
    if (!timerRunning && timerSeconds === 0) setTimerSeconds(Number(recommended.minutes) * 60);
    setTimerRunning((running) => !running);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
  }

  function handleVoiceCommand(transcript) {
    const command = transcript.toLowerCase().trim();
    const completeMatch = command.match(/^(?:complete|finish|done with)\s+(.+)/);
    if (completeMatch) {
      const match = incomplete.find((item) => item.title.toLowerCase().includes(completeMatch[1]));
      if (match) {
        toggleAssignment(match.id);
        return;
      }
    }
    const addMatch = command.match(/^(?:please\s+)?(?:add|create|remind me about)\s+(.+)/);
    if (addMatch) {
      const draft = parseVoiceAssignment(transcript);
      setDialogAssignment({ ...draft, dueDate: draft.dueDate || dateOffset(3), priority: 'Medium', details: '' });
      setVoiceTranscript(transcript);
      setDialogOpen(true);
      setNotice('Review the assignment details I heard, then save when they look right.');
      return;
    }
    if (/what('s| is) due|show my assignments|what do i have/.test(command)) {
      setNotice(incomplete.length ? `You have ${incomplete.length} upcoming ${incomplete.length === 1 ? 'assignment' : 'assignments'}: ${incomplete.slice(0, 3).map((item) => item.title).join(', ')}.` : 'You have no upcoming assignments.');
      return;
    }
    setNotice(`I heard “${transcript}”. Try “add reading notes” or “complete project proposal”.`);
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setNotice('Voice input is not available in this browser. You can still add tasks by typing.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setVoiceActive(true); setNotice('Listening. Try “what is due this week?”'); };
    recognition.onresult = (event) => handleVoiceCommand(event.results[0][0].transcript);
    recognition.onerror = () => setNotice('I couldn’t catch that. Try again or add your task by typing.');
    recognition.onend = () => setVoiceActive(false);
    recognition.start();
  }

  function importCalendar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCanvasCalendar(String(reader.result));
        if (!parsed.length) throw new Error('No assignment events were found.');
        const existingUids = new Set(assignments.map((assignment) => assignment.sourceUid).filter(Boolean));
        const imported = parsed.filter((assignment) => !existingUids.has(assignment.sourceUid))
          .map((assignment) => ({ ...assignment, id: crypto.randomUUID() }));
        if (!imported.length) {
          setNotice('This Canvas calendar is already up to date.');
        } else {
          setAssignments((current) => [...current, ...imported]);
          setNotice(`${imported.length} ${imported.length === 1 ? 'assignment' : 'assignments'} imported from Canvas. Your data stays in this browser.`);
        }
      } catch {
        setNotice('That calendar could not be imported. Choose a Canvas calendar export in .ics format.');
      }
      event.target.value = '';
    };
    reader.onerror = () => {
      setNotice('That calendar file could not be read. Please choose it again.');
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="AssignItDone home">
          <span className="brand-mark"><Check size={27} strokeWidth={3} /></span>
          <span>Assign<span className="brand-accent">IT</span>Done</span>
        </a>
        <div className="top-actions">
          <label className="button secondary-button import-button" title="Import Canvas calendar">
            <FileUp size={17} />
            <span className="import-label">Import Canvas calendar</span>
            <span className="visually-hidden">Choose a Canvas calendar file</span>
            <input className="visually-hidden" type="file" accept="text/calendar,.ics,.ical" aria-label="Import Canvas calendar" onChange={importCalendar} />
          </label>
          <button className="icon-button add-button" type="button" onClick={() => openDialog()} aria-label="Add an assignment"><Plus size={23} /></button>
        </div>
      </header>

      <main id="top" className="main-content">
        <nav className="workspace-tabs" aria-label="Main workspace">
          <button className={`workspace-tab ${activeView === 'tasks' ? 'active-tab' : ''}`} type="button" aria-current={activeView === 'tasks' ? 'page' : undefined} onClick={() => setActiveView('tasks')}><CalendarDays size={17} /> Tasks</button>
          <button className={`workspace-tab ${activeView === 'study' ? 'active-tab' : ''}`} type="button" aria-current={activeView === 'study' ? 'page' : undefined} onClick={() => setActiveView('study')}><BookOpen size={17} /> Study library</button>
        </nav>
        {activeView === 'tasks' ? <>
        <section className="intro-section" aria-labelledby="page-title">
          <p className="eyebrow date-label">{formatLongDate()}</p>
          <div className="intro-line">
            <div>
              <h1 id="page-title">What can you get done?</h1>
              <p className="intro-copy">Tell me how much time you have. I’ll help choose the best next step.</p>
            </div>
            <div className="calendar-ready"><span className="ready-dot" /> Your day, in hand</div>
          </div>
        </section>

        <p className="notice" role="status" aria-live="polite">{notice}</p>

        <section className="focus-panel" aria-labelledby="time-title">
          <div className="focus-controls">
            <div className="time-control-group">
              <h2 id="time-title">I have</h2>
              <div className="time-row">
                <div className="stepper" aria-label="Available time">
                  <button type="button" onClick={() => setAvailableMinutes((value) => Math.max(5, value - 10))} aria-label="Subtract ten minutes">−</button>
                  <input aria-label="Available time in minutes" type="number" min="5" max="600" step="5" value={availableMinutes} onChange={(event) => setAvailableMinutes(Math.max(5, Number(event.target.value) || 5))} />
                  <span>minutes</span>
                  <button type="button" onClick={() => setAvailableMinutes((value) => Math.min(600, value + 10))} aria-label="Add ten minutes">+</button>
                </div>
                <button className="button primary-button find-button" type="button" onClick={chooseNextTask}><Sparkles size={19} /> Find my next task</button>
                <button className={`icon-button voice-button ${voiceActive ? 'is-listening' : ''}`} type="button" onClick={startVoice} aria-label={voiceActive ? 'Listening for voice command' : 'Ask by voice'} title={voiceSupported ? 'Ask by voice' : 'Voice input is not supported'}><Mic size={21} /></button>
              </div>
            </div>
            <div className="recommended-area" aria-live="polite">
              {recommended ? (
                <article className={`recommendation ${recommendationId === recommended.id ? 'is-selected' : ''}`}>
                  <div className="sparkle-tile"><Sparkles size={25} /></div>
                  <div className="recommendation-copy">
                    <p className="eyebrow">{recommendationFits ? `Best fit for ${availableMinutes} minutes` : `Next up · ${availableMinutes} min available`}</p>
                    <h2>{recommended.title}</h2>
                    <p className="recommendation-description">{formatDueDate(recommended.dueDate)}. {recommendationFits ? `Its ${recommended.minutes}-minute estimate fits the time you have.` : `Estimated at ${recommended.minutes} minutes.`}</p>
                    <div className="recommendation-meta"><span><Clock3 size={16} /> About {recommended.minutes} minutes</span><span className="due-accent">{formatDueDate(recommended.dueDate)}</span></div>
                  </div>
                  <div className="timer-actions">
                    {timerSeconds > 0 && <span className="timer-display" aria-live="off">{timerMinutes}:{timerRemainder}</span>}
                    <button className="button timer-button" type="button" onClick={startTimer}>
                      {timerRunning ? <Pause size={18} /> : <Play size={18} />}{timerRunning ? 'Pause timer' : timerSeconds > 0 ? 'Resume timer' : 'Start work timer'}
                    </button>
                    {timerSeconds > 0 && <button className="timer-reset" type="button" onClick={resetTimer}><RotateCcw size={14} /> Reset</button>}
                  </div>
                </article>
              ) : (
                <div className="empty-recommendation"><CheckCircle2 size={25} /><div><h2>Nothing on your list</h2><p>Add a task and we’ll help find a place for it.</p></div></div>
              )}
            </div>
          </div>
        </section>

        <section className="assignments-section" aria-labelledby="upcoming-title">
          <div className="section-heading">
            <div><p className="eyebrow">Your workload · {completed.length} complete</p><h2 id="upcoming-title">Coming up <span className="count-pill">{incomplete.length}</span></h2></div>
            <button className="button secondary-button add-text-button" type="button" onClick={() => openDialog()}><Plus size={17} /> Add assignment</button>
          </div>
          {incomplete.length ? (
            <div className="assignment-list">
              {incomplete.map((assignment) => <AssignmentRow key={assignment.id} assignment={assignment} onEdit={openDialog} onToggle={toggleAssignment} />)}
            </div>
          ) : (
            <div className="empty-list"><CheckCircle2 size={22} /><p>A clear desk. Enjoy the breathing room.</p></div>
          )}
        </section>

        {completed.length > 0 && (
          <section className="completed-section">
            <button className="completed-toggle" type="button" aria-expanded={showCompleted} onClick={() => setShowCompleted((value) => !value)}>
              <span>Completed <span className="count-pill">{completed.length}</span></span><ChevronDown size={18} className={showCompleted ? 'chevron-open' : ''} />
            </button>
            {showCompleted && <div className="assignment-list completed-list">{completed.map((assignment) => <AssignmentRow key={assignment.id} assignment={assignment} onEdit={openDialog} onToggle={toggleAssignment} />)}</div>}
          </section>
        )}

        <footer className="privacy-note"><span className="privacy-symbol"><AlarmClock size={15} /></span><p><strong>Your space stays yours.</strong> Assignments are saved only in this browser on this device.</p></footer>
        </> : <StudyWorkspace />}
      </main>

      {dialogOpen && <AssignmentDialog assignment={dialogAssignment} voiceTranscript={voiceTranscript} onClose={() => { setDialogOpen(false); setDialogAssignment(null); setVoiceTranscript(''); }} onSave={saveAssignment} />}
    </div>
  );
}
