import { useMemo, useState } from 'react'
import { heroRoom, roomImages } from './assets'
import { SITE_CONFIG, TRACKING_EVENTS } from './config'
import { questions } from './data/questions'
import { productContent } from './data/product'
import { results, resultsById } from './data/results'
import { trackEvent } from './tracking'
import { aestheticIds, type AestheticId } from './types'

type Screen = 'landing' | 'quiz' | 'result'
type AnswerMap = Record<string, string>
type ScoreMap = Record<AestheticId, number>

function calculateResult(answers: AnswerMap) {
  const scores = Object.fromEntries(aestheticIds.map((id) => [id, 0])) as Record<AestheticId, number>
  questions.forEach((question) => {
    const selected = question.answers.find((answer) => answer.id === answers[question.id])
    if (!selected) return
    Object.entries(selected.scores).forEach(([id, points]) => {
      scores[id as AestheticId] += points ?? 0
    })
  })
  // Stable tie-break: the first type in aestheticIds wins. The order is documented in README.
  const id = aestheticIds.reduce((winner, candidate) => scores[candidate] > scores[winner] ? candidate : winner)
  const signals = questions.flatMap((question) => {
    const selected = question.answers.find((answer) => answer.id === answers[question.id])
    return selected && (selected.scores[id] ?? 0) > 0 ? [selected.text] : []
  }).slice(0, 3)
  return { id, scores, signals }
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [resultId, setResultId] = useState<AestheticId>('cozy-minimalist')
  const [resultScores, setResultScores] = useState<ScoreMap>(Object.fromEntries(aestheticIds.map((id) => [id, 0])) as ScoreMap)
  const [resultSignals, setResultSignals] = useState<string[]>([])
  const [shareStatus, setShareStatus] = useState('Share my result')

  const currentQuestion = questions[questionIndex]
  const result = resultsById[resultId]
  const progress = ((questionIndex + 1) / questions.length) * 100
  const selectedAnswer = answers[currentQuestion?.id]
  const rankedResults = useMemo(() => aestheticIds
    .map((id) => ({ id, score: resultScores[id], result: resultsById[id] }))
    .sort((a, b) => b.score - a.score || aestheticIds.indexOf(a.id) - aestheticIds.indexOf(b.id)), [resultScores])
  const matchPercent = (score: number) => Math.round((score / (questions.length * 3)) * 100)

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const startQuiz = () => {
    setAnswers({})
    setQuestionIndex(0)
    setScreen('quiz')
    setShareStatus('Share my result')
    trackEvent(TRACKING_EVENTS.quizStarted)
    scrollToTop()
  }

  const chooseAnswer = (answerId: string) => {
    const nextAnswers = { ...answers, [currentQuestion.id]: answerId }
    setAnswers(nextAnswers)
    if (questionIndex < questions.length - 1) {
      setTimeout(() => setQuestionIndex((index) => index + 1), 150)
      return
    }
    const nextResult = calculateResult(nextAnswers)
    setResultId(nextResult.id)
    setResultScores(nextResult.scores)
    setResultSignals(nextResult.signals)
    setScreen('result')
    trackEvent(TRACKING_EVENTS.quizCompleted, { result: nextResult.id })
    trackEvent(TRACKING_EVENTS.resultViewed, { result: nextResult.id })
    scrollToTop()
  }

  const retakeQuiz = () => {
    trackEvent(TRACKING_EVENTS.retakeQuizClicked, { previous_result: resultId })
    startQuiz()
  }

  const shareResult = async () => {
    const shareText = `My room aesthetic is ${result.name} — ${result.tagline}. Find yours:`
    const shareData = { title: `My room aesthetic: ${result.name}`, text: shareText, url: window.location.href }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setShareStatus('Shared!')
        trackEvent(TRACKING_EVENTS.resultShared, { result: result.id, method: 'native' })
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
        setShareStatus('Result copied!')
        trackEvent(TRACKING_EVENTS.resultShared, { result: result.id, method: 'clipboard' })
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setShareStatus('Try copying the page URL')
    }
  }

  const previewCards = useMemo(() => results.map((item) => (
    <article className="preview-card" key={item.id} style={{ '--card-accent': item.softAccent } as React.CSSProperties}>
      <div className="preview-image-wrap">
        <img src={roomImages[item.id]} alt={`${item.name} bedroom inspiration`} loading="lazy" />
        <span className="preview-symbol" aria-hidden="true">{item.symbol}</span>
      </div>
      <div className="preview-card-copy">
        <h3>{item.name}</h3>
        <p>{item.tagline}</p>
      </div>
    </article>
  )), [])

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => { setScreen('landing'); scrollToTop() }} aria-label="Room Aesthetic Quiz home">
          <span className="brand-mark">RA</span>
          <span>Room Aesthetic Quiz</span>
        </button>
        <span className="header-note">Free · No email</span>
      </header>

      {screen === 'landing' && <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span>✦</span> Your dream room starts here</span>
            <h1>What’s Your<br /><em>Room Aesthetic?</em></h1>
            <p className="hero-subtitle">Take the free quiz and find your dream room style.</p>
            <p className="hero-description">Discover the colors, decor, and first steps that can make your bedroom, dorm, or first apartment feel more like you.</p>
            <button className="primary-button" onClick={startQuiz}>Start the Free Quiz <span aria-hidden="true">→</span></button>
            <p className="privacy-note"><span aria-hidden="true">✓</span> No email required. Just 12 quick questions.</p>
            <div className="hero-benefits" aria-label="What the quiz includes">
              <span><strong>Instant</strong> style result</span>
              <span><strong>Personal</strong> color palette</span>
              <span><strong>Practical</strong> 3-step plan</span>
            </div>
          </div>
          <div className="hero-art">
            <img className="hero-room-image" src={heroRoom} alt="Warm small bedroom styled with cream, sage, blush, and light wood" />
            <div className="hero-image-note"><span>6 styles</span><strong>One that feels like you</strong></div>
            <div className="hero-image-badge" aria-hidden="true">✦</div>
          </div>
        </section>

        <section className="preview-section">
          <span className="eyebrow">Six possible styles</span>
          <h2>One room vibe will feel <em>so you.</em></h2>
          <p>Maybe you love airy neutrals—or maybe your walls need more drama. Your answers will point the way.</p>
          <div className="preview-grid">{previewCards}</div>
          <button className="text-button" onClick={startQuiz}>Find my room aesthetic <span>→</span></button>
        </section>

        <ProductSection onCta={() => trackEvent(TRACKING_EVENTS.productCtaClicked, { location: 'landing' })} />
      </main>}

      {screen === 'quiz' && <main className="quiz-page">
        <section className="quiz-card" aria-live="polite">
          <div className="quiz-topline">
            <span>Question {questionIndex + 1} of {questions.length}</span>
            <button className="restart-link" onClick={startQuiz}>Start over</button>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={questionIndex + 1} aria-valuemin={1} aria-valuemax={questions.length} aria-label="Quiz progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="question-heading">
            <span className="eyebrow">{currentQuestion.eyebrow}</span>
            <h1>{currentQuestion.text}</h1>
            <p>Go with the one that feels most like you.</p>
          </div>
          <div className="answer-grid">
            {currentQuestion.answers.map((answer) => (
              <button key={answer.id} className={`answer-button ${selectedAnswer === answer.id ? 'selected' : ''}`} onClick={() => chooseAnswer(answer.id)}>
                {answer.swatches ? <span className="answer-swatches" aria-hidden="true">{answer.swatches.map((color) => <i key={color} style={{ background: color }} />)}</span> : <span className="answer-emoji" aria-hidden="true">{answer.emoji}</span>}
                <span>{answer.text}</span>
                <span className="answer-check" aria-hidden="true">✓</span>
              </button>
            ))}
          </div>
          <div className="quiz-actions">
            <button className="secondary-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}>← Back</button>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </section>
      </main>}

      {screen === 'result' && <main className="result-page" style={{ '--result-accent': result.accent, '--result-soft': result.softAccent } as React.CSSProperties}>
        <section className="result-hero">
          <div className="result-image-wrap">
            <img src={roomImages[result.id]} alt={`${result.name} bedroom inspiration`} />
            <div className="result-symbol" aria-hidden="true">{result.symbol}</div>
          </div>
          <span className="eyebrow">Your result</span>
          <h1>{result.name}</h1>
          <span className="match-badge">{matchPercent(resultScores[result.id])}% match</span>
          <p className="result-tagline">{result.tagline}</p>
          <p className="result-description">{result.description}</p>
          <div className="vibe-row">{result.vibe.map((word) => <span key={word}>{word}</span>)}</div>
        </section>

        <section className="result-content">
          <div className="style-mix-card">
            <div className="style-mix-copy">
              <span className="eyebrow">More personal than one label</span>
              <h2>Your room style mix</h2>
              <p><strong>{rankedResults[0].result.name}</strong> is your foundation. Borrow a few accents from <strong>{rankedResults[1].result.name}</strong> to make the room feel less like a template and more like you.</p>
              <small>Match strength is based on your answers. It is a creative starting point, not a rulebook.</small>
            </div>
            <div className="mix-bars">
              {rankedResults.slice(0, 2).map((item, index) => <div className="mix-row" key={item.id}>
                <div><span>{index === 0 ? 'Primary' : 'Secondary'}</span><strong>{item.result.name}</strong><b>{matchPercent(item.score)}%</b></div>
                <div className="mix-track"><span style={{ width: `${matchPercent(item.score)}%`, background: item.result.accent }} /></div>
              </div>)}
            </div>
            <div className="result-reasons">
              <span className="eyebrow">Why this fits</span>
              <ul>{resultSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
            </div>
          </div>
          <div className="result-section colors-section">
            <div className="section-number">01</div><div>
              <span className="eyebrow">Your palette</span><h2>Best colors for you</h2>
              <div className="palette-list">{result.colors.map((color) => <div key={color.name} className="palette-item"><span style={{ background: color.hex }} /><small>{color.name}</small></div>)}</div>
            </div>
          </div>
          <div className="two-column-results">
            <div className="result-section compact"><div className="section-number">02</div><div><span className="eyebrow">Look for</span><h2>Decor that fits</h2><ul className="check-list">{result.decor.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
            <div className="result-section compact avoid-card"><div className="section-number">03</div><div><span className="eyebrow">Skip it</span><h2>What to avoid</h2><ul className="avoid-list">{result.avoid.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
          </div>
          <div className="steps-card">
            <span className="eyebrow">Your mini makeover plan</span><h2>Start with these 3 steps</h2>
            <ol>{result.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
          </div>
        </section>

        <section className="result-product">
          <div>
            <span className="eyebrow">Take the next step</span>
            <h2>{productContent.resultHeadline}</h2>
            <p>{productContent.resultDescription} Your best starting pages:</p>
            <div className="vibe-row">{result.kitBestFor.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
          <div className="product-cta-box">
            <span className="coming-soon">{productContent.statusLabel}</span>
            <p>Plan your palette, priorities, layout, and shopping list—without buying random decor first.</p>
            <a className="primary-button" href={SITE_CONFIG.productUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent(TRACKING_EVENTS.productCtaClicked, { location: 'result', result: result.id })}>{productContent.buttonLabel} <span>↗</span></a>
            <small>{productContent.priceNote}</small>
          </div>
        </section>
        <div className="retake-wrap"><button className="secondary-button share-button" onClick={shareResult}>↗ {shareStatus}</button><button className="secondary-button" onClick={retakeQuiz}>↻ Retake quiz</button><button className="text-button" onClick={() => { setScreen('landing'); scrollToTop() }}>Back to home</button></div>
      </main>}

      <footer><p>Made for small rooms, fresh starts, and finding your style.</p><p>© {new Date().getFullYear()} Room Aesthetic Quiz · No personal data collected.</p></footer>
    </div>
  )
}

function ProductSection({ onCta }: { onCta: () => void }) {
  return <section className="product-section">
    <div className="product-copy">
      <span className="eyebrow">{productContent.statusLabel}</span>
      <h2>A room plan you’ll<br /><em>actually use.</em></h2>
      <p>{productContent.landingDescription}</p>
      <a className="secondary-button" href={SITE_CONFIG.productUrl} target="_blank" rel="noreferrer" onClick={onCta}>Preview the Starter Kit <span>↗</span></a>
      <small>{productContent.priceNote}</small>
    </div>
    <div className="kit-card">
      <div className="kit-card-title"><span>Room Aesthetic</span><strong>Starter Kit</strong><small>PLAN · STYLE · MAKE IT YOURS</small></div>
      <ul>{productContent.contents.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
    </div>
  </section>
}

export default App
