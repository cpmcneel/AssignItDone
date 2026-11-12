import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Send,
  Trash2,
  Volume2,
} from 'lucide-react';
import { extractNoteText } from './noteFiles.js';
import { askStudyAssistant } from './studyAssistant.js';
import { gradeAnswer } from './studyTools.js';
import ClassForm from './ClassForm.jsx';
import { apiRequest } from './api.js';
import { toStudyCard, toDeckRequest } from './deckData.js';

function NoteUpload({ onUpload, disabled }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Keep the UI responsive while the note parser reads and converts the uploaded file.
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
      <input ref={inputRef} className="visually-hidden" type="file" disabled={busy || disabled} accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" onChange={handleFile} />
      <div className="upload-icon"><FileText size={23} /></div>
      <div className="upload-copy">
        <h3>{busy ? 'Preparing flashcards…' : 'Turn notes into flashcards'}</h3>
        <p>Upload a PDF, Word document, Markdown, or text file up to 10 MB. Extracted text is sent to AI; the original file is not stored.</p>
      </div>
      <button className="button primary-button" type="button" disabled={busy || disabled} onClick={() => inputRef.current?.click()}><Plus size={17} /> Upload notes</button>
    </div>
  );
}

function PracticeSession({ deck, onBack }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [whyExplanation, setWhyExplanation] = useState('');
  const [whyLoading, setWhyLoading] = useState(false);
  const [whyError, setWhyError] = useState('');
  const [questionHelp, setQuestionHelp] = useState('');
  const [questionHelpLoading, setQuestionHelpLoading] = useState(false);
  const [questionHelpError, setQuestionHelpError] = useState('');
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('Say your answer, type it, or choose “I don’t know yet.”');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const answerRef = useRef(null);
  const whyRequestRef = useRef(0);
  const questionHelpRequestRef = useRef(0);
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
    if (whyLoading) return;
    setAnswer(value);
    setResult(gradeAnswer(value, card.back));
    setWhyExplanation('');
    setWhyError('');
    setWhyLoading(true);
    const requestId = ++whyRequestRef.current;
    askStudyAssistant({
      deck,
      prompt: `Explain why the deck's answer to "${card.front}" is correct. The student's answer was: "${value || 'I do not know yet'}". Connect the key details from the deck to the question. Be concise and do not add unsupported facts.`,
    }).then((explanation) => {
      if (requestId === whyRequestRef.current) setWhyExplanation(explanation);
    }).catch((error) => {
      if (requestId === whyRequestRef.current) setWhyError(error.message || 'I could not explain the answer right now.');
    }).finally(() => {
      if (requestId === whyRequestRef.current) setWhyLoading(false);
    });
  }

  function moveNext() {
    setIndex((current) => (current + 1) % deck.cards.length);
    setAnswer('');
    setResult(null);
    setWhyExplanation('');
    setWhyError('');
    setWhyLoading(false);
    whyRequestRef.current += 1;
    setQuestionHelp('');
    setQuestionHelpError('');
    setQuestionHelpLoading(false);
    questionHelpRequestRef.current += 1;
    setNotice('Say your answer, type it, or choose “I don’t know yet.”');
  }

  async function explainQuestion() {
    setQuestionHelp('');
    setQuestionHelpError('');
    setQuestionHelpLoading(true);
    const requestId = ++questionHelpRequestRef.current;
    try {
      const explanation = await askStudyAssistant({
        deck,
        prompt: `Explain what this question is asking the student to think about: "${card.front}". Use this deck to clarify any important terms and give a small hint about how to approach it, but do not reveal the answer directly. Keep it concise and beginner-friendly.`,
      });
      if (requestId === questionHelpRequestRef.current) setQuestionHelp(explanation);
    } catch (error) {
      if (requestId === questionHelpRequestRef.current) setQuestionHelpError(error.message || 'I could not expand the question right now.');
    } finally {
      if (requestId === questionHelpRequestRef.current) setQuestionHelpLoading(false);
    }
  }

  const resultTitle = result?.status === 'correct' ? 'You got the key ideas' : result?.status === 'partial' ? 'You got part of it' : 'Let’s learn it together';

  return (
    <section className="study-session" aria-labelledby="practice-title">
      <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={17} /> Back to {deck.title}</button>
      <div className="session-topline"><span className="eyebrow">STUDY COMPANION · {deck.title}</span><span>{index + 1} of {deck.cards.length}</span></div>
      <div className="progress-track" aria-label={`Question ${index + 1} of ${deck.cards.length}`}><span style={{ width: `${progress}%` }} /></div>
      <div className="practice-layout">
        <div className="practice-question-block">
          <div className="practice-icon"><Headphones size={22} /></div>
          <p className="eyebrow">STUDY QUESTION</p>
          <h2 id="practice-title">{card.front}</h2>
          <button className="text-action" type="button" onClick={() => speak(card.front)}><Volume2 size={17} /> Read question aloud</button>
          <button className="button secondary-button question-help-button" type="button" onClick={explainQuestion} disabled={questionHelpLoading}><CircleHelp size={16} /> {questionHelpLoading ? 'Unpacking question…' : 'Explain this question more'}</button>
          {(questionHelp || questionHelpError) && (
            <div className="question-help-panel" aria-live="polite">
              <p className="eyebrow">QUESTION, UNPACKED</p>
              <p>{questionHelp || questionHelpError}</p>
            </div>
          )}
        </div>
        <div className="answer-panel">
          <label className="field answer-field" htmlFor="practice-answer">Your answer
            <textarea id="practice-answer" ref={answerRef} rows="4" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Explain it in your own words…" onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && answer.trim()) checkAnswer(); }} />
          </label>
          <div className="answer-actions">
            <button className={`icon-button answer-mic ${listening ? 'is-listening' : ''}`} type="button" onClick={startListening} aria-label={listening ? 'Listening to answer' : 'Answer by voice'}><Mic size={19} /></button>
            <button className="button secondary-button dont-know-button" type="button" disabled={whyLoading} onClick={() => checkAnswer('')}>I don’t know yet</button>
            <button className="button primary-button" type="button" disabled={whyLoading || !answer.trim()} onClick={() => checkAnswer()}><Check size={17} /> Check answer</button>
          </div>
          <p className="practice-notice" role="status" aria-live="polite">{notice}</p>
          {result && (
            <div className={`answer-feedback feedback-${result.status}`} aria-live="polite">
              <div className="feedback-heading"><span className="feedback-mark">{result.status === 'correct' ? <CheckCircle2 size={20} /> : <CircleHelp size={20} />}</span><div><p className="eyebrow">{result.status === 'correct' ? 'NICE WORK' : result.status === 'partial' ? 'KEEP BUILDING' : 'HERE’S THE IDEA'}</p><h3>{resultTitle}</h3></div></div>
              <p className="feedback-copy">{result.feedback}</p>
              <p>Feedback checks keywords; compare your answer with the deck to review.</p>
              <div className="explanation-block"><span className="eyebrow">FROM THIS DECK</span><p>{result.explanation}</p></div>
              <div className="why-answer-block" aria-live="polite">
                <p className="eyebrow">WHY THIS IS THE ANSWER</p>
                <p>{whyLoading ? 'Connecting the answer to the question…' : whyExplanation || whyError || 'The note-based answer above is the source to compare with the question.'}</p>
              </div>
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

function StudyBuddy({ deck }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  async function handleAsk(suggestedQuestion = '') {
    const trimmed = (suggestedQuestion || question).trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');
    setQuestion('');
    setMessages([{ role: 'user', content: trimmed }]);

    try {
      const response = await askStudyAssistant({
        deck,
        prompt: trimmed,
      });
      setMessages([{ role: 'user', content: trimmed }, { role: 'assistant', content: response }]);
    } catch (caughtError) {
      setError(caughtError.message || 'The helper is not available right now.');
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setError('');
    setQuestion('');
  }

  function submitQuestion(event) {
    event.preventDefault();
    handleAsk();
  }

  const suggestions = ['Explain a key idea from this deck simply', 'Give an example of a concept in this deck', 'Quiz me on this deck'];

  return (
    <section className="study-buddy" aria-label="Study assistant">
      <div className="study-buddy-header">
        <div>
          <p className="eyebrow">AI ASSISTANT</p>
          <h3>Ask anything</h3>
        </div>
        <button className="icon-button study-buddy-clear" type="button" onClick={clearChat} disabled={loading || messages.length === 0} aria-label="Clear chat" title="Clear chat">
          <Trash2 size={17} />
        </button>
      </div>

      <div className="study-chat" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.length === 0 && (
          <p className="study-chat-empty">Ask about this study set. Each question is answered independently.</p>
        )}
        {messages.map((message, index) => (
          <article className={`study-chat-message ${message.role}`} key={`${message.role}-${index}`}>
            <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
            {message.role === 'assistant' ? (
              <div className="study-chat-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{message.content}</ReactMarkdown>
              </div>
            ) : <p>{message.content}</p>}
          </article>
        ))}
        {loading && <p className="study-chat-thinking" role="status">Thinking…</p>}
        <div ref={messagesEndRef} />
      </div>

      {messages.some((message) => message.role === 'assistant') && !loading && (
        <div className="study-chat-suggestions" aria-label="Suggested follow-up questions">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => handleAsk(suggestion)}>{suggestion}</button>
          ))}
        </div>
      )}

      {error && <p className="study-buddy-error" role="alert">{error}</p>}
      <form className="study-chat-form" onSubmit={submitQuestion}>
        <label className="visually-hidden" htmlFor="study-chat-question">Your message</label>
        <textarea
          id="study-chat-question"
          rows="2"
          maxLength={12000}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) submitQuestion(event);
          }}
          placeholder="Message the assistant…"
          disabled={loading}
        />
        <button className="button primary-button" type="submit" disabled={loading || !question.trim()} aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
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
      <div className="deck-detail-heading"><div><span className="eyebrow">{deck.sourceName}</span><h2 id="deck-title">{deck.title}</h2><p>{deck.cards.length} cards in this deck</p></div><button className="button primary-button" type="button" disabled={!deck.id} title={deck.id ? 'Start practice' : 'Save the deck to start practice'} onClick={() => setMode('practice')}><Mic size={17} /> Practice with voice</button></div>
      <div className="flashcard-progress"><span>Card {index + 1} of {deck.cards.length}</span><span>{showAnswer ? 'Answer' : 'Question'}</span></div>
      <button className={`flashcard ${showAnswer ? 'showing-answer' : ''}`} type="button" onClick={() => setShowAnswer((value) => !value)} aria-label={showAnswer ? 'Show question side' : 'Reveal answer'}>
        <span className="flashcard-label"><Sparkles size={15} /> {showAnswer ? 'ANSWER' : 'QUESTION'}</span>
        <span className="flashcard-text">{showAnswer ? card.back : card.front}</span>
        <span className="flashcard-hint">Select card to {showAnswer ? 'return to question' : 'reveal answer'}</span>
      </button>
      <div className="flashcard-controls"><button className="icon-button" type="button" onClick={() => moveCard(-1)} aria-label="Previous card"><ArrowLeft size={19} /></button><button className="button secondary-button" type="button" onClick={() => { setIndex(0); setShowAnswer(false); }}><RotateCcw size={16} /> Start over</button><button className="icon-button" type="button" onClick={() => moveCard(1)} aria-label="Next card"><ArrowRight size={19} /></button></div>
      {deck.id ? <StudyBuddy deck={deck} /> : <p className="notice">Save the deck to use the AI assistant and practice controls.</p>}
    </section>
  );
}

export default function StudyWorkspace({ classes: folders, classesLoading, onCreateClass }) {
  const [decks, setDecks] = useState([]);
  const [decksLoading, setDecksLoading] = useState(true);
  const [decksLoadError, setDecksLoadError] = useState('');
  const [loadingCards, setLoadingCards] = useState(false);
  const [savingDeck, setSavingDeck] = useState(false);
  const [preparingCards, setPreparingCards] = useState(false);
  const [error, setError] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [draftDeck, setDraftDeck] = useState(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [notice, setNotice] = useState('Choose a class to view its study decks.');

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/decks', { signal: controller.signal })
      .then(setDecks)
      .catch((error) => {
        if (!controller.signal.aborted) setDecksLoadError(`Could not load decks: ${error.message}. Refresh to try again.`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDecksLoading(false);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!selectedFolderId && folders.length) setSelectedFolderId(folders[0].id);
    if (selectedFolderId && !folders.some((folder) => folder.id === selectedFolderId)) setSelectedFolderId(folders[0]?.id || '');
  }, [folders, selectedFolderId]);

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
  const folderDecks = useMemo(() => decks.filter((deck) => deck.classId === selectedFolderId), [decks, selectedFolderId]);

  async function openDeck(deck) {
    setLoadingCards(true);
    setError('');
    try {
      const cards = await apiRequest(`/decks/${deck.id}/flashcards`);
      if (!cards.length) throw new Error('This deck has no flashcards.');
      setSelectedDeck({ ...deck, sourceName: deck.className, cards: cards.map(toStudyCard) });
    } catch (error) {
      setError(`Could not open deck: ${error.message}`);
    } finally {
      setLoadingCards(false);
    }
  }

  async function saveDeck(event) {
    event.preventDefault();
    if (savingDeck) return;
    setSavingDeck(true);
    setError('');
    try {
      const deck = await apiRequest('/decks', { method: 'POST', body: toDeckRequest(draftDeck) });
      setDecks((current) => [...current, deck]);
      setDraftDeck(null);
      setNotice(`${deck.title} was saved.`);
      await openDeck(deck);
    } catch (error) {
      setError(`Could not save deck: ${error.message}`);
    } finally {
      setSavingDeck(false);
    }
  }

  async function addFolder(name) {
    const folder = await onCreateClass(name);
    setSelectedFolderId(folder.id);
    setAddingFolder(false);
    setNotice(`${folder.name} folder created.`);
  }

  async function addNotes(file) {
    if (!selectedFolder || preparingCards) return;
    setPreparingCards(true);
    setError('');
    setNotice('Reading notes…');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a file no larger than 10 MB.');
      let noteText;
      try {
        noteText = (await extractNoteText(file)).trim();
      } catch {
        throw new Error('Could not read this file. Choose a searchable PDF, Word document, Markdown, or text file.');
      }
      if (!noteText) throw new Error('No readable text was found. Scanned PDFs and images need OCR first.');
      if (noteText.length > 20000) throw new Error('These notes are too long. Choose a shorter document with at most 20,000 characters of text.');

      setNotice('Generating flashcards…');
      const cards = await apiRequest('/flashcards/generate', { method: 'POST', body: { text: noteText } });
      if (!cards.length) throw new Error('No flashcards could be made from these notes. Try notes with clear facts or definitions.');

      // Review the generated cards before saving them to the backend.
      const baseTitle = file.name.replace(/\.(pdf|docx|txt|md|markdown)$/i, '');
      setDraftDeck({ title: baseTitle, classId: selectedFolder.id, sourceName: file.name, cards: cards.map(toStudyCard) });
    } catch (error) {
      if (error.status === 503) {
        setError('AI flashcard generation is unavailable right now. Try again when the AI service is enabled.');
      } else if (error.status === 502) {
        setError('The AI service could not generate usable cards. Please try again.');
      } else {
        setError(error.message || 'Could not generate flashcards. Please try again.');
      }
    } finally {
      setPreparingCards(false);
      setNotice('Choose a class to view its study decks.');
    }
  }

  if (draftDeck) return (
    <>
      <p className="notice">Review the cards, then save the deck. The original file is not stored.</p>
      {error && <p className="notice" role="alert">{error}</p>}
      <form className="assignment-form" onSubmit={saveDeck}>
        <label className="field full-field">Deck title
          <input required maxLength={255} disabled={savingDeck} value={draftDeck.title} onChange={(event) => setDraftDeck({ ...draftDeck, title: event.target.value })} />
        </label>
        <div className="dialog-actions full-field">
          <button className="button secondary-button" type="button" disabled={savingDeck} onClick={() => setDraftDeck(null)}>Discard</button>
          <button className="button primary-button" type="submit" disabled={savingDeck}>{savingDeck ? 'Saving…' : 'Save deck'}</button>
        </div>
      </form>
      <FlashcardViewer deck={draftDeck} onBack={() => { if (!savingDeck) setDraftDeck(null); }} />
    </>
  );

  if (selectedDeck) return <FlashcardViewer key={selectedDeck.id} deck={selectedDeck} onBack={() => setSelectedDeck(null)} />;

  return (
    <section className="study-workspace" aria-labelledby="study-heading">
      <div className="study-heading-row"><div><p className="eyebrow">STUDY TIME</p><h1 id="study-heading">Turn notes into simple study cards.</h1><p>Pick a class, upload notes, and make quick questions you can practice later.</p></div><div className="study-heading-mark"><Library size={24} /><span>{decks.length} {decks.length === 1 ? 'study set' : 'study sets'}</span></div></div>
      <div className="study-steps" aria-label="How this works">
        <span>1. Pick a class</span>
        <span>2. Upload notes</span>
        <span>3. Make cards</span>
        <span>4. Practice</span>
      </div>
      <p className="notice study-notice" role="status" aria-live="polite">{notice}</p>
      {decksLoading && <p className="notice" role="status">Loading decks…</p>}
      {decksLoadError && <p className="notice" role="alert">{decksLoadError}</p>}
      {loadingCards && <p className="notice" role="status">Loading flashcards…</p>}
      {error && <p className="notice" role="alert">{error}</p>}
      <div className="library-layout">
        <aside className="folder-sidebar" aria-label="Class folders">
          <div className="folder-sidebar-heading"><h2>Classes</h2><button className="icon-button small-icon-button" type="button" disabled={classesLoading || preparingCards} onClick={() => setAddingFolder((value) => !value)} aria-label="Create class folder"><FolderPlus size={18} /></button></div>
          {addingFolder && <ClassForm onCancel={() => setAddingFolder(false)} onCreate={addFolder} />}
          {folders.length ? (
            <div className="folder-list">{folders.map((folder) => {
              const count = decks.filter((deck) => deck.classId === folder.id).length;
              return <button key={folder.id} className={`folder-button ${selectedFolderId === folder.id ? 'selected-folder' : ''}`} type="button" disabled={loadingCards || savingDeck || preparingCards} onClick={() => setSelectedFolderId(folder.id)}><Folder size={17} /><span>{folder.name}</span><span className="folder-count">{count}</span></button>;
            })}</div>
          ) : (
            <div className="folder-empty"><Folder size={20} /><p>Create a class folder to keep each course’s study decks together.</p><button className="text-action" type="button" disabled={classesLoading} onClick={() => setAddingFolder(true)}><Plus size={15} /> Add your first class</button></div>
          )}
          <div className="local-note"><CheckCircle2 size={16} /><span>Saved data resets when the backend restarts</span></div>
        </aside>

        <div className="library-content">
          {selectedFolder ? (
            <>
              <div className="library-content-heading"><div><span className="eyebrow">CLASS FOLDER</span><h2>{selectedFolder.name}</h2></div>{folderDecks.length > 0 && <span className="deck-count-label">{folderDecks.length} {folderDecks.length === 1 ? 'study set' : 'study sets'}</span>}</div>
              <NoteUpload onUpload={addNotes} disabled={decksLoading || Boolean(decksLoadError) || loadingCards || savingDeck || preparingCards} />
              {folderDecks.length ? (
                <div className="deck-grid">{folderDecks.map((deck) => <button className="deck-tile" key={deck.id} type="button" disabled={loadingCards || savingDeck || preparingCards} onClick={() => openDeck(deck)}><span className="deck-tile-icon"><BookOpen size={20} /></span><span className="deck-tile-copy"><strong>{deck.title}</strong><small>{deck.cardCount} cards</small></span><ArrowRight size={17} /></button>)}</div>
              ) : !decksLoading && !decksLoadError && (
                <div className="study-empty"><div className="empty-book-icon"><BookOpen size={25} /></div><h3>No decks in this class yet</h3><p>Upload your lecture notes above and we’ll pull out study prompts to get you started.</p></div>
              )}
            </>
          ) : (
            <div className="study-welcome"><div className="welcome-symbol"><FolderPlus size={26} /></div><span className="eyebrow">START A STUDY FOLDER</span><h2>One class at a time.</h2><p>Create a folder for a course. Add notes there to keep its flashcards and practice sessions together.</p><button className="button primary-button" type="button" disabled={classesLoading} onClick={() => setAddingFolder(true)}><Plus size={17} /> Create class folder</button></div>
          )}
          {folders.length > 0 && <div className="study-footnote"><ChevronDown size={15} /><span>Supported notes: searchable PDFs, .docx, .txt, and Markdown. Images and handwriting need readable text or OCR.</span></div>}
        </div>
      </div>
    </section>
  );
}
