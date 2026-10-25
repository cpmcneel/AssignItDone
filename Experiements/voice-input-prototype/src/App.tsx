import { useEffect, useRef, useState } from 'react'
import { recognitionConstructor, type Recognition } from './speech'
import './App.css'

type Reply = { response: string; mode: string; model: string }

function App() {
  const [text, setText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reply, setReply] = useState<Reply | null>(null)
  const recognition = useRef<Recognition | null>(null)
  const request = useRef<AbortController | null>(null)
  const speech = useRef<SpeechSynthesisUtterance | null>(null)
  const supportsRecognition = Boolean(recognitionConstructor())
  const supportsSpeech = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  useEffect(() => () => {
    if (recognition.current) {
      recognition.current.onresult = null
      recognition.current.onerror = null
      recognition.current.onend = null
      recognition.current.abort()
    }
    request.current?.abort()
    if (speech.current) {
      speech.current.onend = null
      speech.current.onerror = null
      speech.current = null
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  function startListening() {
    const Constructor = recognitionConstructor()
    if (!Constructor || recognition.current) return
    stopSpeaking()
    const session = new Constructor()
    recognition.current = session
    session.lang = 'en-US'
    session.continuous = false
    session.interimResults = true
    setError('')
    setTranscript('')
    // Preserve typed input; each microphone session appends its final result.
    const original = text.trim()
    session.onresult = (event) => {
      const results = Array.from(event.results)
      setTranscript(results.map((result) => result[0].transcript).join(' '))
      const finalText = results.filter((result) => result.isFinal)
        .map((result) => result[0].transcript).join(' ')
      if (finalText) setText([original, finalText].filter(Boolean).join(' '))
    }
    session.onerror = (event) => {
      setError(`Microphone: ${event.error}. You can still type your request.`)
    }
    session.onend = () => {
      recognition.current = null
      setListening(false)
    }
    try {
      session.start()
      setListening(true)
    } catch {
      recognition.current = null
      setListening(false)
      setError('Could not start recognition. Try again or type your request.')
    }
  }

  async function send() {
    if (!text.trim() || busy || listening) return
    setError('')
    setReply(null)
    stopSpeaking()
    setBusy(true)
    const controller = new AbortController()
    request.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 70000)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
        signal: controller.signal,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Backend request failed.')
      if (typeof data.response !== 'string') throw new Error('Unexpected backend response.')
      setReply(data)
    } catch (cause) {
      setError(cause instanceof Error && cause.name === 'AbortError'
        ? 'Request timed out. No automatic retry was sent.'
        : cause instanceof Error ? cause.message : 'Could not reach the backend.')
    } finally {
      window.clearTimeout(timeout)
      request.current = null
      setBusy(false)
    }
  }

  function stopSpeaking() {
    // Detach callbacks so stopping/replacing playback cannot report a stale error.
    if (speech.current) {
      speech.current.onend = null
      speech.current.onerror = null
      speech.current = null
    }
    if (supportsSpeech) window.speechSynthesis.cancel()
  }

  function speak(textToSpeak: string) {
    if (!textToSpeak.trim() || !supportsSpeech) return
    stopSpeaking()
    setError('')
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    // Voices can load asynchronously. Query at click time; when none are listed,
    // leave voice unset so the browser can use its default engine.
    const englishVoices = synth.getVoices().filter((voice) => /^en(?:-|$)/i.test(voice.lang))
    const voice = englishVoices.find((voice) => voice.localService)
      ?? englishVoices.find((voice) => voice.default) ?? englishVoices[0]
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? 'en-US'
    speech.current = utterance
    utterance.onend = () => {
      if (speech.current === utterance) speech.current = null
    }
    utterance.onerror = (event) => {
      if (speech.current !== utterance) return
      speech.current = null
      if (event.error === 'canceled' || event.error === 'interrupted') return
      setError(`Speech playback failed (${event.error}). Try Test speech in your browser; the response remains available as text.`)
    }
    try {
      // Resume a paused synthesis queue, while keeping speak inside the button click.
      synth.resume()
      synth.speak(utterance)
    } catch (cause) {
      speech.current = null
      setError(`Could not start speech: ${cause instanceof Error ? cause.message : 'browser error'}`)
    }
  }

  return (
    <main>
      <header>
        <p className="eyebrow">ASSIGNITDONE · EXPERIMENT 01</p>
        <h1>Talk it through.</h1>
        <p>Test voice input, a study buddy response, and spoken output in one small loop.</p>
      </header>
      <section aria-labelledby="input-heading">
        <h2 id="input-heading">1. Speak or type</h2>
        <p>Try: “Extract the assignment details: HCI prototype review is due October 21.”</p>
        <div className="actions">
          <button onClick={startListening} disabled={!supportsRecognition || listening || busy}>Start microphone</button>
          <button onClick={() => recognition.current?.stop()} disabled={!listening}>Stop microphone</button>
        </div>
        <p role="status">{listening ? 'Listening… Stop to finish your transcript.' : 'Microphone off.'}</p>
        {!supportsRecognition && <p>Speech recognition is unavailable in this browser. Use the text box below.</p>}
        <p className="hint">Browser recognition may send audio to its speech service. AI receives text only when you click Send.</p>
        <div className="transcript"><strong>Live transcript</strong><p>{transcript || 'Your microphone transcript will appear here.'}</p></div>
        <label htmlFor="request">Review your transcript or type a request</label>
        <textarea id="request" value={text} onChange={(event) => setText(event.target.value)}
          maxLength={4000} rows={6} disabled={listening || busy} placeholder="Type a short request or paste fictional course notes…" />
        <p className="hint">{text.length}/4000 characters · Each send is an independent request.</p>
        <button className="primary" onClick={send} disabled={!text.trim() || listening || busy}>{busy ? 'Waiting for response…' : 'Send to study buddy'}</button>
      </section>
      {error && <p role="alert" className="error">{error}</p>}
      <section aria-labelledby="response-heading">
        <h2 id="response-heading">2. Read or listen</h2>
        {reply && <p className="hint">{reply.mode === 'mock' ? 'MOCK · No cloud request' : `CLOUD · ${reply.model}`}</p>}
        <div className="response" aria-live="polite">{reply?.response ?? 'Your response will appear here. This prototype does not save assignments.'}</div>
        <div className="actions">
          <button onClick={() => speak(reply?.response ?? '')} disabled={!reply || !supportsSpeech || listening}>Speak response</button>
          <button onClick={() => speak('AssignItDone speech test.')} disabled={!supportsSpeech || listening}>Test speech</button>
          <button onClick={stopSpeaking} disabled={!supportsSpeech}>Stop speaking</button>
        </div>
        {!supportsSpeech && <p>Speech output is unavailable in this browser.</p>}
      </section>
    </main>
  )
}
export default App
