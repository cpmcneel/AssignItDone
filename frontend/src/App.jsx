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
  Trash2,
  X,
} from 'lucide-react';
import { parseVoiceAssignment } from './voiceCommands.js';
import StudyWorkspace from './StudyWorkspace.jsx';
import ClassForm from './ClassForm.jsx';
import CalendarImportDialog from './CalendarImportDialog.jsx';
import { parseCanvasCalendar } from './canvasCalendar.js';
import { apiRequest } from './api.js';
import { toAssignment, toTaskRequest } from './taskData.js';

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
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

function AssignmentDialog({ assignment, onClose, onSave, onDelete, busy, error, voiceTranscript, classes, classesLoading, onCreateClass }) {
  const isEditing = Boolean(assignment?.id);
  const [addingClass, setAddingClass] = useState(false);
  const [form, setForm] = useState(() => ({
    ...(assignment || { title: '', dueDate: dateOffset(3), minutes: 30, priority: 'Medium', details: '' }),
    classId: assignment?.classId ?? classes.find((course) => course.name.toLowerCase() === assignment?.course?.toLowerCase())?.id ?? '',
  }));

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (busy) return;
    const course = classes.find((course) => course.id === form.classId);
    if (!course) return;
    onSave({ ...form, course: course.name, minutes: Number(form.minutes) });
  }

  async function createClass(name) {
    const course = await onCreateClass(name);
    update('classId', course.id);
    setAddingClass(false);
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}>
      <section className="assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">YOUR TASKS</span>
            <h2 id="dialog-title">{isEditing ? 'Edit task' : 'Add a task'}</h2>
          </div>
          <button className="icon-button quiet" type="button" disabled={busy} onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
        </div>
        {voiceTranscript && <div className="voice-review"><Mic size={17} /><p><strong>I heard:</strong> {voiceTranscript}<br />Check it and save it if it looks right.</p></div>}
        {error && <p className="notice" role="alert">{error}</p>}
        {addingClass && <ClassForm onCreate={createClass} onCancel={() => setAddingClass(false)} />}
        <form onSubmit={submit} className="assignment-form">
          <label className="field full-field">Task name
            <input autoFocus required maxLength={255} disabled={busy} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Research proposal" />
          </label>
          <label className="field full-field">Class
            <select required disabled={classesLoading || busy} value={form.classId} onChange={(event) => update('classId', Number(event.target.value) || '')}>
              <option value="">{classesLoading ? 'Loading classes…' : 'Select a class'}</option>
              {classes.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </label>
          <button className="text-action full-field" type="button" disabled={classesLoading || addingClass || busy} onClick={() => setAddingClass(true)}><Plus size={15} /> Add a class</button>
          <label className="field">When is it due?
            <input required type="date" disabled={busy} value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
          </label>
          <label className="field">How long?
            <span className="input-with-suffix"><input required min="1" max="2147483647" step="1" type="number" disabled={busy} value={form.minutes} onChange={(event) => update('minutes', event.target.value)} /><span>min</span></span>
          </label>
          <label className="field full-field">How important?
            <select disabled={busy} value={form.priority} onChange={(event) => update('priority', event.target.value)}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </label>
          <label className="field full-field">Extra note <span className="optional-label">Optional</span>
            <textarea rows="3" disabled={busy} value={form.details || ''} onChange={(event) => update('details', event.target.value)} placeholder="Add a reminder" />
          </label>
          <div className="dialog-actions full-field">
            {isEditing && <button className="button secondary-button" type="button" disabled={busy || addingClass} onClick={() => onDelete(assignment)}><Trash2 size={17} /> Delete</button>}
            <button className="button secondary-button" type="button" disabled={busy} onClick={onClose}>Cancel</button>
            <button className="button primary-button" type="submit" disabled={busy || classesLoading || addingClass || classes.length === 0}><Check size={17} /> {busy ? 'Please wait…' : 'Save task'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AssignmentRow({ assignment, onEdit, onToggle, busy }) {
  return (
    <article className={`assignment-row ${assignment.completed ? 'is-complete' : ''}`}>
      <button className="completion-button" type="button" disabled={busy} onClick={() => onToggle(assignment.id)} aria-label={`${assignment.completed ? 'Reopen' : 'Mark'} ${assignment.title} ${assignment.completed ? 'incomplete' : 'complete'}`}>
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
      <button className="icon-button edit-button" type="button" disabled={busy} onClick={() => onEdit(assignment)} aria-label={`Edit ${assignment.title}`}><SquarePen size={18} /></button>
    </article>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('tasks');
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksLoadError, setTasksLoadError] = useState('');
  const [taskBusy, setTaskBusy] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [availableMinutes, setAvailableMinutes] = useState(30);
  const [dialogAssignment, setDialogAssignment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarImportOpen, setCalendarImportOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [notice, setNotice] = useState('Add a task or pick how much time you have.');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [recommendationId, setRecommendationId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/classes', { signal: controller.signal })
      .then(setClasses)
      .catch((error) => {
        if (!controller.signal.aborted) setClassesError(`Could not load classes: ${error.message}. Refresh to try again.`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setClassesLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function createClass(name) {
    const course = await apiRequest('/classes', { method: 'POST', body: { name } });
    setClasses((current) => [...current, course]);
    return course;
  }

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/tasks', { signal: controller.signal })
      .then((tasks) => setAssignments(tasks.map(toAssignment)))
      .catch((error) => {
        if (!controller.signal.aborted) setTasksLoadError(`Could not load tasks: ${error.message}. Refresh to try again.`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setTasksLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => {
      setTimerSeconds((seconds) => {
        if (seconds <= 1) {
          setTimerRunning(false);
          setNotice('Time is up. Nice job. Pick your next step when you’re ready.');
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

  async function saveAssignment(values) {
    if (taskBusy) return;
    setTaskBusy(true);
    setTaskError('');
    try {
      const path = values.id ? `/tasks/${values.id}` : '/tasks';
      const task = await apiRequest(path, { method: values.id ? 'PUT' : 'POST', body: toTaskRequest(values) });
      const saved = toAssignment(task);
      setAssignments((current) => values.id
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]);
      setNotice(`${saved.title} was ${values.id ? 'updated' : 'added to your list'}.`);
      if (values.id && recommended?.id === saved.id) resetTimer();
      setDialogOpen(false);
      setDialogAssignment(null);
      setVoiceTranscript('');
    } catch (error) {
      setTaskError(`Could not save task: ${error.message}`);
    } finally {
      setTaskBusy(false);
    }
  }

  // Used Codex to help connect calendar imports to the backend task API.
  // Prompt: Connect the existing Canvas calendar parser to the backend task endpoints.
  async function importCalendar(file, classId) {
    if (taskBusy) return;
    setTaskBusy(true);
    setTaskError('');
    let imported = 0;
    try {
      if (!classes.some((course) => course.id === classId)) throw new Error('Select a class.');
      if (!file.name.toLowerCase().endsWith('.ics')) throw new Error('Choose a .ics calendar file.');
      if (file.size > 2 * 1024 * 1024) throw new Error('Choose a calendar smaller than 2 MB.');
      let tasks;
      try {
        tasks = parseCanvasCalendar(await file.text());
      } catch {
        throw new Error('Could not read this calendar. Export a new .ics file from Canvas.');
      }
      if (!tasks.length) throw new Error('No tasks with titles and due dates were found.');
      if (tasks.length > 200) throw new Error('Import at most 200 tasks at a time.');
      if (tasks.some((task) => task.title.length > 255)) throw new Error('A calendar title exceeds 255 characters. Shorten it before importing.');

      const taskKey = (task) => JSON.stringify([task.classId, task.title.trim().toLowerCase(), task.dueDate]);
      const existing = new Set(assignments.map(taskKey));
      let skipped = 0;
      for (const task of tasks) {
        const values = { ...task, classId };
        const key = taskKey(values);
        if (existing.has(key)) {
          skipped++;
          continue;
        }
        const saved = toAssignment(await apiRequest('/tasks', { method: 'POST', body: toTaskRequest(values) }));
        setAssignments((current) => [...current, saved]);
        existing.add(key);
        imported++;
      }
      setNotice(`Imported ${imported} tasks.${skipped ? ` Skipped ${skipped} matching tasks already on your list.` : ''}`);
      setActiveView('tasks');
      setCalendarImportOpen(false);
    } catch (error) {
      setTaskError(`${imported ? `${imported} tasks were saved before the import stopped. ` : ''}${error.message}`);
    } finally {
      setTaskBusy(false);
    }
  }

  async function toggleAssignment(id) {
    const target = assignments.find((item) => item.id === id);
    if (!target || taskBusy) return;
    setTaskBusy(true);
    setTaskError('');
    try {
      const body = toTaskRequest({ ...target, completed: !target.completed });
      const saved = toAssignment(await apiRequest(`/tasks/${id}`, { method: 'PUT', body }));
      setAssignments((current) => current.map((item) => item.id === id ? saved : item));
      setNotice(saved.completed ? `${saved.title} marked complete. Nice work.` : `${saved.title} is back on your list.`);
      if (recommendationId === id) setRecommendationId(null);
      if (recommended?.id === id) resetTimer();
    } catch (error) {
      setTaskError(`Could not update task: ${error.message}`);
    } finally {
      setTaskBusy(false);
    }
  }

  async function deleteAssignment(assignment) {
    if (taskBusy) return;
    setTaskBusy(true);
    setTaskError('');
    try {
      await apiRequest(`/tasks/${assignment.id}`, { method: 'DELETE' });
      setAssignments((current) => current.filter((item) => item.id !== assignment.id));
      setDialogOpen(false);
      setDialogAssignment(null);
      setVoiceTranscript('');
      setNotice(`${assignment.title} was deleted.`);
      if (recommendationId === assignment.id) setRecommendationId(null);
      if (recommended?.id === assignment.id) resetTimer();
    } catch (error) {
      setTaskError(`Could not delete task: ${error.message}`);
    } finally {
      setTaskBusy(false);
    }
  }

  function openDialog(assignment = null) {
    if (taskBusy || tasksLoading || tasksLoadError) return;
    setTaskError('');
    setVoiceTranscript('');
    setDialogAssignment(assignment);
    setDialogOpen(true);
  }

  function chooseNextTask() {
    // Pick the next action by checking which assignment is both soonest and small enough to match
    // the amount of time the student says they have available.
    setRecommendationId(recommended?.id || null);
    setNotice(recommended ? (recommendationFits ? `${recommended.title} is a good match for ${availableMinutes} minutes.` : `Nothing quite fits ${availableMinutes} minutes yet. ${recommended.title} is the closest one.`) : 'You’re all set. Add a task when you want a new next step.');
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
    if (taskBusy || tasksLoading || tasksLoadError) return;
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
      setNotice('I heard a task. Check it, then save it when it looks right.');
      return;
    }
    if (/what('s| is) due|show my assignments|what do i have/.test(command)) {
      setNotice(incomplete.length ? `You have ${incomplete.length} upcoming ${incomplete.length === 1 ? 'assignment' : 'assignments'}: ${incomplete.slice(0, 3).map((item) => item.title).join(', ')}.` : 'You have no upcoming assignments.');
      return;
    }
    setNotice(`I heard “${transcript}”. Try “add reading notes” or “complete project proposal”.`);
  }

  function startVoice() {
    // Opt into browser speech recognition when available. The main app then turns spoken commands
    // into either task updates or assignment creation prompts.
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="AssignItDone home">
          <span className="brand-mark"><Check size={27} strokeWidth={3} /></span>
          <span>Assign<span className="brand-accent">IT</span>Done</span>
        </a>
        <div className="top-actions">
          <button className="button secondary-button import-button" type="button" disabled={taskBusy || tasksLoading || classesLoading || Boolean(tasksLoadError) || Boolean(classesError)} onClick={() => { setTaskError(''); setCalendarImportOpen(true); }} aria-label="Import class schedule">
            <FileUp size={17} /><span className="import-label">Import class schedule</span>
          </button>
          <button className="icon-button add-button" type="button" disabled={taskBusy || tasksLoading || Boolean(tasksLoadError)} onClick={() => openDialog()} aria-label="Add a task"><Plus size={23} /></button>
        </div>
      </header>

      <main id="top" className="main-content">
        <nav className="workspace-tabs" aria-label="Main workspace">
          <button className={`workspace-tab ${activeView === 'tasks' ? 'active-tab' : ''}`} type="button" aria-current={activeView === 'tasks' ? 'page' : undefined} onClick={() => setActiveView('tasks')}><CalendarDays size={17} /> My list</button>
          <button className={`workspace-tab ${activeView === 'study' ? 'active-tab' : ''}`} type="button" aria-current={activeView === 'study' ? 'page' : undefined} onClick={() => setActiveView('study')}><BookOpen size={17} /> Study</button>
        </nav>
        {classesLoading && <p className="notice" role="status">Loading classes…</p>}
        {classesError && <p className="notice" role="alert">{classesError}</p>}
        {activeView === 'tasks' ? <>
        <section className="intro-section" aria-labelledby="page-title">
          <p className="eyebrow date-label">{formatLongDate()}</p>
          <div className="intro-line">
            <div>
              <h1 id="page-title">What should we do next?</h1>
              <p className="intro-copy">Pick how much time you have. I’ll help choose the next thing to do.</p>
            </div>
            <div className="calendar-ready"><span className="ready-dot" /> Your plan for today</div>
          </div>
        </section>

        <p className="notice" role="status" aria-live="polite">{notice}</p>
        {taskError && <p className="notice" role="alert">{taskError}</p>}

        <section className="focus-panel" aria-labelledby="time-title">
          <div className="focus-controls">
            <div className="time-control-group">
              <h2 id="time-title">I have this much time</h2>
              <div className="time-row">
                <div className="stepper" aria-label="Available time">
                  <button type="button" onClick={() => setAvailableMinutes((value) => Math.max(5, value - 10))} aria-label="Subtract ten minutes">−</button>
                  <input aria-label="Available time in minutes" type="number" min="5" max="600" step="5" value={availableMinutes} onChange={(event) => setAvailableMinutes(Math.max(5, Number(event.target.value) || 5))} />
                  <span>minutes</span>
                  <button type="button" onClick={() => setAvailableMinutes((value) => Math.min(600, value + 10))} aria-label="Add ten minutes">+</button>
                </div>
                <button className="button primary-button find-button" type="button" onClick={chooseNextTask}><Sparkles size={19} /> Pick my next step</button>
                <button className={`icon-button voice-button ${voiceActive ? 'is-listening' : ''}`} type="button" disabled={taskBusy || tasksLoading || Boolean(tasksLoadError)} onClick={startVoice} aria-label={voiceActive ? 'Listening for voice command' : 'Ask by voice'} title={voiceSupported ? 'Ask by voice' : 'Voice input is not supported'}><Mic size={21} /></button>
              </div>
            </div>
            <div className="recommended-area" aria-live="polite">
              {tasksLoading ? <p role="status">Loading your tasks…</p> : tasksLoadError ? <p>Tasks are unavailable until the list can be loaded.</p> : recommended ? (
                <article className={`recommendation ${recommendationId === recommended.id ? 'is-selected' : ''}`}>
                  <div className="sparkle-tile"><Sparkles size={25} /></div>
                  <div className="recommendation-copy">
                    <p className="eyebrow">{recommendationFits ? `Best match for ${availableMinutes} minutes` : `Next up · ${availableMinutes} min available`}</p>
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
            <div><p className="eyebrow">Your list · {completed.length} done</p><h2 id="upcoming-title">Next up <span className="count-pill">{incomplete.length}</span></h2></div>
            <button className="button secondary-button add-text-button" type="button" disabled={taskBusy || tasksLoading || Boolean(tasksLoadError)} onClick={() => openDialog()}><Plus size={17} /> Add a task</button>
          </div>
          {tasksLoading ? <p className="notice" role="status">Loading tasks…</p> : tasksLoadError ? <p className="notice" role="alert">{tasksLoadError}</p> : incomplete.length ? (
            <div className="assignment-list">
              {incomplete.map((assignment) => <AssignmentRow key={assignment.id} assignment={assignment} busy={taskBusy} onEdit={openDialog} onToggle={toggleAssignment} />)}
            </div>
          ) : (
            <div className="empty-list"><CheckCircle2 size={22} /><p>A clear desk. Enjoy the breathing room.</p></div>
          )}
        </section>

        {completed.length > 0 && (
          <section className="completed-section">
            <button className="completed-toggle" type="button" aria-expanded={showCompleted} onClick={() => setShowCompleted((value) => !value)}>
              <span>Done <span className="count-pill">{completed.length}</span></span><ChevronDown size={18} className={showCompleted ? 'chevron-open' : ''} />
            </button>
            {showCompleted && <div className="assignment-list completed-list">{completed.map((assignment) => <AssignmentRow key={assignment.id} assignment={assignment} busy={taskBusy} onEdit={openDialog} onToggle={toggleAssignment} />)}</div>}
          </section>
        )}

        <footer className="privacy-note"><span className="privacy-symbol"><AlarmClock size={15} /></span><p><strong>Your tasks are saved on the server.</strong> Data resets when the backend restarts.</p></footer>
        </> : <StudyWorkspace classes={classes} classesLoading={classesLoading} onCreateClass={createClass} />}
      </main>

      {calendarImportOpen && <CalendarImportDialog classes={classes} busy={taskBusy} error={taskError} onImport={importCalendar} onClose={() => { setCalendarImportOpen(false); setTaskError(''); }} />}
      {dialogOpen && <AssignmentDialog assignment={dialogAssignment} classes={classes} classesLoading={classesLoading} onCreateClass={createClass} busy={taskBusy} error={taskError} voiceTranscript={voiceTranscript} onClose={() => { setDialogOpen(false); setDialogAssignment(null); setVoiceTranscript(''); }} onSave={saveAssignment} onDelete={deleteAssignment} />}
    </div>
  );
}
