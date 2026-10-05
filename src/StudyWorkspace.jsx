import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  Folder,
  FolderPlus,
  Headphones,
  Library,
  Mic,
  Plus,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { extractNoteText } from './noteFiles.js';
import { createDeck, createFolder, generateFlashcards, gradeAnswer } from './studyTools.js';

const FOLDERS_KEY = 'assignitdone.study-folders.v1';
const DECKS_KEY = 'assignitdone.study-decks.v1';

function readStored(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function NoteUpload({ onUpload, disabled }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file);
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  return (
    <div className="notes-dropzone">
      <input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown" onChange={handleFile} />
      <div className="upload-icon"><FileText size={23} /></div>
      <div className="upload-copy">
        <h3>{busy ? 'Reading your notes…' : 'Turn notes into flashcards'}</h3>
        <p>Upload a PDF, Markdown, or text file. Your notes are processed in this browser.</p>
      </div>
      <button className="button primary-button" type="button" disabled={busy || disabled} onClick={() => inputRef.current?.click()}><Plus size={17} /> Upload notes</button>
    </div>
  );
}

function FolderForm({ onCancel, onCreate }) {
  const [name, setName] = useState('');
  return (
    <form className="folder-form" onSubmit={(event) => { event.preventDefault(); if (name.trim()) onCreate(name); }}>
      <label className="visually-hidden" htmlFor="folder-name">Class folder name</label>
      <input id="folder-name" autoFocus maxLength={60} required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Biology 101" />
      <button className="icon-button small-icon-button" type="submit" aria-label="Create folder"><Check size={17} /></button>
      <button className="icon-button small-icon-button" type="button" onClick={onCancel} aria-label="Cancel folder creation"><X size={17} /></button>
    </form>
  );
}

function PracticeSession({ deck, onBack }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('Say your answer, type it, or choose “I don’t know yet.”');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const answerRef = useRef(null);
  const card = deck.cards[index];
  const progress = Math.round(((index + 1) / deck.cards.length) * 100);

  useEffect(() => {
    if (answerRef.current) answerRef.current.focus();
  }, [index]);

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      setNotice('Spoken playback is not supported in this browser. You can read the question on screen.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setNotice('Voice answers are not supported here. Type your answer below instead.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setListening(true); setNotice('Listening to your answer…'); };
    recognition.onresult = (event) => {
      setAnswer(event.results[0][0].transcript);
      setNotice('Answer captured. Check it when you are ready.');
    };
    recognition.onerror = () => setNotice('I could not hear that clearly. Try again or type your answer.');
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function checkAnswer(value = answer) {
    setAnswer(value);
    setResult(gradeAnswer(value, card.back));
  }

  function moveNext() {
    setIndex((current) => (current + 1) % deck.cards.length);
    setAnswer('');
    setResult(null);
    setNotice('Say your answer, type it, or choose “I don’t know yet.”');
  }

  const resultTitle = result?.status === 'correct' ? 'You got the key ideas' : result?.status === 'partial' ? 'You got part of it' : 'Let’s learn it together';

  return (
    <section className="study-session" aria-labelledby="practice-title">
      <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={17} /> Back to {deck.title}</button>
      <div className="session-topline"><span className="eyebrow">VOICE PRACTICE · {deck.title}</span><span>{index + 1} of {deck.cards.length}</span></div>
      <div className="progress-track" aria-label={`Question ${index + 1} of ${deck.cards.length}`}><span style={{ width: `${progress}%` }} /></div>
      <div className="practice-layout">
        <div className="practice-question-block">
          <div className="practice-icon"><Headphones size={22} /></div>
          <p className="eyebrow">YOUR QUESTION</p>
          <h2 id="practice-title">{card.front}</h2>
          <button className="text-action" type="button" onClick={() => speak(card.front)}><Volume2 size={17} /> Read question aloud</button>
        </div>
        <div className="answer-panel">
          <label className="field answer-field" htmlFor="practice-answer">Your answer
            <textarea id="practice-answer" ref={answerRef} rows="4" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Explain it in your own words…" onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && answer.trim()) checkAnswer(); }} />
          </label>
          <div className="answer-actions">
            <button className={`icon-button answer-mic ${listening ? 'is-listening' : ''}`} type="button" onClick={startListening} aria-label={listening ? 'Listening to answer' : 'Answer by voice'}><Mic size={19} /></button>
            <button className="button secondary-button dont-know-button" type="button" onClick={() => checkAnswer('')}>I don’t know yet</button>
            <button className="button primary-button" type="button" disabled={!answer.trim()} onClick={() => checkAnswer()}><Check size={17} /> Check answer</button>
          </div>
          <p className="practice-notice" role="status" aria-live="polite">{notice}</p>
          {result && (
            <div className={`answer-feedback feedback-${result.status}`} aria-live="polite">
              <div className="feedback-heading"><span className="feedback-mark">{result.status === 'correct' ? <CheckCircle2 size={20} /> : <CircleHelp size={20} />}</span><div><p className="eyebrow">{result.status === 'correct' ? 'NICE WORK' : result.status === 'partial' ? 'KEEP BUILDING' : 'HERE’S THE IDEA'}</p><h3>{resultTitle}</h3></div></div>
              <p className="feedback-copy">{result.feedback}</p>
              <div className="explanation-block"><span className="eyebrow">FROM YOUR NOTES</span><p>{result.explanation}</p></div>
              {result.matched.length > 0 && <p className="keyword-line"><strong>You mentioned:</strong> {result.matched.slice(0, 7).join(', ')}</p>}
              {result.missing.length > 0 && <p className="keyword-line"><strong>Revisit:</strong> {result.missing.slice(0, 6).join(', ')}</p>}
              <button className="button secondary-button next-question-button" type="button" onClick={moveNext}>Next question <ArrowRight size={16} /></button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FlashcardViewer({ deck, onBack }) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mode, setMode] = useState('cards');
  const card = deck.cards[index];

  function moveCard(direction) {
    setIndex((current) => (current + direction + deck.cards.length) % deck.cards.length);
    setShowAnswer(false);
  }

  if (mode === 'practice') return <PracticeSession deck={deck} onBack={() => setMode('cards')} />;

  return (
    <section className="deck-detail" aria-labelledby="deck-title">
      <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={17} /> Back to library</button>
      <div className="deck-detail-heading"><div><span className="eyebrow">{deck.sourceName}</span><h2 id="deck-title">{deck.title}</h2><p>{deck.cards.length} cards in this deck</p></div><button className="button primary-button" type="button" onClick={() => setMode('practice')}><Mic size={17} /> Practice with voice</button></div>
      <div className="flashcard-progress"><span>Card {index + 1} of {deck.cards.length}</span><span>{showAnswer ? 'Answer' : 'Question'}</span></div>
      <button className={`flashcard ${showAnswer ? 'showing-answer' : ''}`} type="button" onClick={() => setShowAnswer((value) => !value)} aria-label={showAnswer ? 'Show question side' : 'Reveal answer'}>
        <span className="flashcard-label"><Sparkles size={15} /> {showAnswer ? 'ANSWER' : 'QUESTION'}</span>
        <span className="flashcard-text">{showAnswer ? card.back : card.front}</span>
        <span className="flashcard-hint">Select card to {showAnswer ? 'return to question' : 'reveal answer'}</span>
      </button>
      <div className="flashcard-controls"><button className="icon-button" type="button" onClick={() => moveCard(-1)} aria-label="Previous card"><ArrowLeft size={19} /></button><button className="button secondary-button" type="button" onClick={() => setShowAnswer(false)}><RotateCcw size={16} /> Start over</button><button className="icon-button" type="button" onClick={() => moveCard(1)} aria-label="Next card"><ArrowRight size={19} /></button></div>
    </section>
  );
}

export default function StudyWorkspace() {
  const [folders, setFolders] = useState(readStored(FOLDERS_KEY));
  const [decks, setDecks] = useState(readStored(DECKS_KEY));
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [notice, setNotice] = useState('Your study materials stay in this browser.');

  useEffect(() => localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)), [folders]);
  useEffect(() => localStorage.setItem(DECKS_KEY, JSON.stringify(decks)), [decks]);
  useEffect(() => {
    if (!selectedFolderId && folders.length) setSelectedFolderId(folders[0].id);
    if (selectedFolderId && !folders.some((folder) => folder.id === selectedFolderId)) setSelectedFolderId(folders[0]?.id || '');
  }, [folders, selectedFolderId]);

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
  const folderDecks = useMemo(() => decks.filter((deck) => deck.folderId === selectedFolderId), [decks, selectedFolderId]);

  function addFolder(name) {
    const folder = createFolder(name);
    setFolders((current) => [...current, folder]);
    setSelectedFolderId(folder.id);
    setAddingFolder(false);
    setNotice(`${folder.name} folder created.`);
  }

  async function addNotes(file) {
    if (!selectedFolder) return;
    try {
      const noteText = await extractNoteText(file);
      if (!noteText.trim()) throw new Error('No readable text was found in that file.');
      const cards = generateFlashcards(noteText);
      if (!cards.length) throw new Error('No study-ready text found. Try notes with definitions, Markdown headings, or longer fact sentences.');
      const baseTitle = file.name.replace(/\.(pdf|txt|md|markdown)$/i, '');
      const deck = createDeck({ title: baseTitle, folderId: selectedFolder.id, sourceName: file.name, cards });
      setDecks((current) => [...current, deck]);
      setSelectedDeckId(deck.id);
      setNotice(`Created ${cards.length} flashcards from ${file.name}. Review them before practice.`);
    } catch (error) {
      setNotice(error.message || 'Could not read that notes file. Try a PDF, Markdown, or text file.');
    }
  }

  if (selectedDeck) return <FlashcardViewer deck={selectedDeck} onBack={() => setSelectedDeckId('')} />;

  return (
    <section className="study-workspace" aria-labelledby="study-heading">
      <div className="study-heading-row"><div><p className="eyebrow">YOUR STUDY SPACE</p><h1 id="study-heading">Make it stick.</h1><p>Turn your class notes into a study deck, then talk through what you remember.</p></div><div className="study-heading-mark"><Library size={24} /><span>{decks.length} {decks.length === 1 ? 'deck' : 'decks'}</span></div></div>
      <p className="notice study-notice" role="status" aria-live="polite">{notice}</p>
      <div className="library-layout">
        <aside className="folder-sidebar" aria-label="Class folders">
          <div className="folder-sidebar-heading"><h2>Classes</h2><button className="icon-button small-icon-button" type="button" onClick={() => setAddingFolder((value) => !value)} aria-label="Create class folder"><FolderPlus size={18} /></button></div>
          {addingFolder && <FolderForm onCancel={() => setAddingFolder(false)} onCreate={addFolder} />}
          {folders.length ? (
            <div className="folder-list">{folders.map((folder) => {
              const count = decks.filter((deck) => deck.folderId === folder.id).length;
              return <button key={folder.id} className={`folder-button ${selectedFolderId === folder.id ? 'selected-folder' : ''}`} type="button" onClick={() => setSelectedFolderId(folder.id)}><Folder size={17} /><span>{folder.name}</span><span className="folder-count">{count}</span></button>;
            })}</div>
          ) : (
            <div className="folder-empty"><Folder size={20} /><p>Create a class folder to keep each course’s study decks together.</p><button className="text-action" type="button" onClick={() => setAddingFolder(true)}><Plus size={15} /> Add your first class</button></div>
          )}
          <div className="local-note"><CheckCircle2 size={16} /><span>Private to this browser</span></div>
        </aside>

        <div className="library-content">
          {selectedFolder ? (
            <>
              <div className="library-content-heading"><div><span className="eyebrow">CLASS FOLDER</span><h2>{selectedFolder.name}</h2></div>{folderDecks.length > 0 && <span className="deck-count-label">{folderDecks.length} {folderDecks.length === 1 ? 'deck' : 'decks'}</span>}</div>
              <NoteUpload onUpload={addNotes} />
              {folderDecks.length ? (
                <div className="deck-grid">{folderDecks.map((deck) => <button className="deck-tile" key={deck.id} type="button" onClick={() => setSelectedDeckId(deck.id)}><span className="deck-tile-icon"><BookOpen size={20} /></span><span className="deck-tile-copy"><strong>{deck.title}</strong><small>{deck.cards.length} cards · {new Date(deck.createdAt).toLocaleDateString()}</small></span><ArrowRight size={17} /></button>)}</div>
              ) : (
                <div className="study-empty"><div className="empty-book-icon"><BookOpen size={25} /></div><h3>No decks in this class yet</h3><p>Upload your lecture notes above and we’ll pull out study prompts to get you started.</p></div>
              )}
            </>
          ) : (
            <div className="study-welcome"><div className="welcome-symbol"><FolderPlus size={26} /></div><span className="eyebrow">START A STUDY FOLDER</span><h2>One class at a time.</h2><p>Create a folder for a course. Add notes there to keep its flashcards and practice sessions together.</p><button className="button primary-button" type="button" onClick={() => setAddingFolder(true)}><Plus size={17} /> Create class folder</button></div>
          )}
          {folders.length > 0 && <div className="study-footnote"><ChevronDown size={15} /><span>Supported notes: searchable PDFs, .txt, and Markdown. Images and handwriting need readable text or OCR.</span></div>}
        </div>
      </div>
    </section>
  );
}
