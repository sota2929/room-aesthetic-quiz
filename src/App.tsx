import { useEffect, useMemo, useRef, useState } from 'react'
import { heroRoom, productImages, roomImages, shopImages } from './assets'
import { getCurrentEntry, shouldStartImmediately, withAttribution } from './attribution'
import { SITE_CONFIG, TRACKING_EVENTS } from './config'
import { affiliateProducts, amazonSearchUrl } from './data/affiliateProducts'
import { getEntryLanding } from './data/entryLanding'
import { questions } from './data/questions'
import { productContent } from './data/product'
import { results, resultsById } from './data/results'
import { trackEvent } from './tracking'
import { aestheticIds, type AestheticId } from './types'

type Screen = 'landing' | 'quiz' | 'result'
type AnswerMap = Record<string, string>
type ScoreMap = Record<AestheticId, number>
const initialDirectStart = shouldStartImmediately()
let directStartTracked = false

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
  const [screen, setScreen] = useState<Screen>(initialDirectStart ? 'quiz' : 'landing')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [resultId, setResultId] = useState<AestheticId>('cozy-minimalist')
  const [resultScores, setResultScores] = useState<ScoreMap>(Object.fromEntries(aestheticIds.map((id) => [id, 0])) as ScoreMap)
  const [resultSignals, setResultSignals] = useState<string[]>([])
  const [shareStatus, setShareStatus] = useState('Share my result')
  const quizStartedAt = useRef<number | null>(initialDirectStart ? Date.now() : null)
  const viewedSections = useRef(new Set<string>())
  const entryLanding = getEntryLanding(getCurrentEntry())
  const entryImage = entryLanding?.image === 'hero' ? heroRoom : entryLanding ? roomImages[entryLanding.image] : heroRoom
  const productUrl = withAttribution(SITE_CONFIG.productUrl)

  useEffect(() => {
    if (initialDirectStart && !directStartTracked) {
      directStartTracked = true
      trackEvent(TRACKING_EVENTS.quizStarted, { start_method: 'direct' })
    }
  }, [])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const section = (entry.target as HTMLElement).dataset.trackSection
        if (!section) return
        const viewKey = `${screen}:${resultId}:${section}`
        if (viewedSections.current.has(viewKey)) return
        viewedSections.current.add(viewKey)
        trackEvent(TRACKING_EVENTS.sectionViewed, {
          section,
          screen,
          ...(screen === 'result' ? { result: resultId } : {}),
        }, { pinterest: false })
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.5 })
    document.querySelectorAll<HTMLElement>('[data-track-section]').forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [screen, resultId])

  const currentQuestion = questions[questionIndex]
  const result = resultsById[resultId]
  const progress = ((questionIndex + 1) / questions.length) * 100
  const selectedAnswer = answers[currentQuestion?.id]
  const rankedResults = useMemo(() => aestheticIds
    .map((id) => ({ id, score: resultScores[id], result: resultsById[id] }))
    .sort((a, b) => b.score - a.score || aestheticIds.indexOf(a.id) - aestheticIds.indexOf(b.id)), [resultScores])
  const matchPercent = (score: number) => Math.round((score / (questions.length * 3)) * 100)

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const startQuiz = (startMethod: string) => {
    setAnswers({})
    setQuestionIndex(0)
    setScreen('quiz')
    setShareStatus('Share my result')
    quizStartedAt.current = Date.now()
    trackEvent(TRACKING_EVENTS.quizStarted, { start_method: startMethod })
    scrollToTop()
  }

  const chooseAnswer = (answerId: string) => {
    const nextAnswers = { ...answers, [currentQuestion.id]: answerId }
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - (quizStartedAt.current ?? Date.now())) / 1000))
    trackEvent(TRACKING_EVENTS.quizProgress, {
      question_number: questionIndex + 1,
      progress_percent: Math.round(((questionIndex + 1) / questions.length) * 100),
      elapsed_seconds: elapsedSeconds,
    }, { pinterest: false })
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
    trackEvent(TRACKING_EVENTS.quizCompleted, { result: nextResult.id, duration_seconds: elapsedSeconds, answer_count: questions.length })
    trackEvent(TRACKING_EVENTS.resultViewed, { result: nextResult.id })
    scrollToTop()
  }

  const retakeQuiz = () => {
    trackEvent(TRACKING_EVENTS.retakeQuizClicked, { previous_result: resultId })
    startQuiz('retake')
  }

  const shareResult = async () => {
    const shareText = `I got ${result.name} ✦ ${result.tagline}. Which room aesthetic are you? Take the free 12-question quiz:`
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

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => { setScreen('landing'); scrollToTop() }} aria-label="Room Aesthetic Quiz home">
          <span className="brand-mark">RA</span>
          <span>Room Aesthetic Quiz</span>
        </button>
        <span className="header-note"><a href="./articles/">Room guides</a> · Free · No email</span>
      </header>

      {screen === 'landing' && <main>
        <section className={`hero ${entryLanding ? 'entry-hero' : ''}`} data-track-section="landing_hero">
          <div className="hero-copy">
            <span className="eyebrow"><span>✦</span> {entryLanding?.eyebrow ?? 'Your dream room starts here'}</span>
            <h1>{entryLanding ? <>{entryLanding.headline}<br /><em>{entryLanding.emphasis}</em></> : <>What’s Your<br /><em>Room Aesthetic?</em></>}</h1>
            <p className="hero-subtitle">Take the free 12-question quiz and get an instant room style result.</p>
            <p className="hero-description">{entryLanding?.description ?? 'Discover the colors, decor, and first steps that can make your bedroom, dorm, or first apartment feel more like you.'}</p>
            <button className="primary-button" onClick={() => startQuiz('hero')}>{entryLanding?.cta ?? 'Start the Free Quiz'} <span aria-hidden="true">→</span></button>
            <p className="privacy-note"><span aria-hidden="true">✓</span> No email required. Just 12 quick questions.</p>
            <a className="hero-shop-link" href="#shop-by-style">Already know your style? Shop the edits <span aria-hidden="true">↓</span></a>
            <div className="hero-benefits" aria-label="What the quiz includes">
              <span><strong>Instant</strong> style result</span>
              <span><strong>Personal</strong> color palette</span>
              <span><strong>Practical</strong> 3-step plan</span>
            </div>
          </div>
          <div className="hero-art">
            <img className="hero-room-image" src={entryImage} alt={entryLanding?.imageAlt ?? 'Warm small bedroom styled with cream, sage, blush, and light wood'} />
            <div className="hero-image-note"><span>6 styles</span><strong>One that feels like you</strong></div>
            <div className="hero-image-badge" aria-hidden="true">✦</div>
          </div>
        </section>

        <FreeValueSection onStartQuiz={() => startQuiz('layout_preview')} />
        <ArticleFeature />
        <ProductSection onCta={() => trackEvent(TRACKING_EVENTS.productCtaClicked, { location: 'landing', destination: 'gumroad', product_name: SITE_CONFIG.productName, price_usd: 7 })} />
        <StyleShopSection onStartQuiz={() => startQuiz('style_shop')} />
      </main>}

      {screen === 'quiz' && <main className="quiz-page">
        <section className="quiz-card" aria-live="polite">
          <div className="quiz-topline">
            <span>Question {questionIndex + 1} of {questions.length}</span>
            <button className="restart-link" onClick={() => startQuiz('restart')}>Start over</button>
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

        <ResultProductSection resultName={result.name} resultId={result.id} bestFor={result.kitBestFor} productUrl={productUrl} />

        <section className="affiliate-section" aria-labelledby="shop-your-result-heading" data-track-section="result_amazon_edits">
          <div className="affiliate-feature">
            <div className="affiliate-feature-image">
              <img src={shopImages[result.id]} alt={`Editorial styling example of decor for a ${result.name} room`} loading="lazy" />
              <span>Curated for your result</span>
            </div>
            <div className="affiliate-feature-copy">
              <span className="eyebrow">Shop your result</span>
              <h2 id="shop-your-result-heading">Start your {result.name} room with three useful pieces.</h2>
              <p>You do not need to redo the whole room. Pick the one item that solves your biggest gap first—lighting, softness, or storage—then layer from there.</p>
              <div className="affiliate-proof-row"><span>✓ Result-matched</span><span>✓ Easy first swaps</span><span>✓ Multiple price options</span></div>
            </div>
          </div>
          <div className="affiliate-grid">
            {affiliateProducts[result.id].map((item, index) => (
              <article className="affiliate-card" key={item.id}>
                <div className="affiliate-card-top"><span className="affiliate-number">0{index + 1}</span><span>{index === 0 ? 'Best first buy' : index === 1 ? 'Layer in next' : 'Finish the look'}</span></div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <a
                  href={amazonSearchUrl(item.search)}
                  target="_blank"
                  rel="sponsored noreferrer"
                  onClick={() => trackEvent(TRACKING_EVENTS.affiliateProductClicked, { location: 'result_edit', result: result.id, product_category: item.id, position: index + 1, destination: 'amazon', link_type: 'search', search_term: item.search, click_target: 'cta' })}
                >
                  Browse this category <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
          <p className="affiliate-disclosure"><strong>Image note:</strong> The styling photo is original visual inspiration, not an image of the exact linked listings. <strong>Affiliate disclosure:</strong> As an Amazon Associate I earn from qualifying purchases. Prices and availability are shown on Amazon and may change.</p>
        </section>

        <div className="retake-wrap"><button className="secondary-button share-button" onClick={shareResult}>↗ {shareStatus}</button><button className="secondary-button" onClick={retakeQuiz}>↻ Retake quiz</button><button className="text-button" onClick={() => { setScreen('landing'); scrollToTop() }}>Back to home</button></div>
      </main>}

      <footer><p>Made for small rooms, fresh starts, and finding your style.</p><p>© {new Date().getFullYear()} Room Aesthetic Quiz · <a href="./articles/">Room guides</a> · <a href="./privacy.html">Privacy & disclosures</a></p></footer>
    </div>
  )
}

function ArticleFeature() {
  return <section className="article-feature" data-track-section="landing_article_feature">
    <img src="./articles/assets/10x10-bedroom-hero.webp" alt="Warm neutral small bedroom with a queen bed and slim desk by the window" loading="lazy" />
    <div>
      <span className="eyebrow">New measured room guide</span>
      <h2>Can a queen bed and desk fit in a 10×10 room?</h2>
      <p>Yes—but only if the walkway, door swing, and desk depth work together. Compare three floor plans and see the honest trade-offs before you move or buy anything.</p>
      <a href="./articles/10x10-bedroom-layout/" onClick={() => trackEvent('article_link_click', { location: 'landing_article_feature', article_slug: '10x10-bedroom-layout', click_target: 'cta' }, { pinterest: false })}>See all 3 floor plans <span aria-hidden="true">→</span></a>
      <div className="article-feature-links" aria-label="More room guides">
        <a href="./articles/small-bedroom-desk-dresser/" onClick={() => trackEvent('article_link_click', { location: 'landing_article_feature', article_slug: 'small-bedroom-desk-dresser', click_target: 'related_link' }, { pinterest: false })}>Desk + dresser</a>
        <a href="./articles/bedroom-layout-clearance-guide/" onClick={() => trackEvent('article_link_click', { location: 'landing_article_feature', article_slug: 'bedroom-layout-clearance-guide', click_target: 'related_link' }, { pinterest: false })}>Clearance guide</a>
        <a href="./articles/bedside-storage-under-12-inches/" onClick={() => trackEvent('article_link_click', { location: 'landing_article_feature', article_slug: 'bedside-storage-under-12-inches', click_target: 'related_link' }, { pinterest: false })}>Under-12″ storage</a>
      </div>
    </div>
  </section>
}

function ProductSection({ onCta }: { onCta: () => void }) {
  return <section className="product-section" data-track-section="landing_gumroad_offer">
    <div className="product-copy">
      <span className="eyebrow">24-page guide + editable workbook</span>
      <h2>Plan the room<br /><em>before you shop it.</em></h2>
      <p>{productContent.landingDescription}</p>
      <div className="product-proof"><span>✓ Instant download</span><span>✓ No subscription</span><span>✓ 30-day guarantee</span></div>
      <a className="primary-button" href={withAttribution(SITE_CONFIG.productUrl)} target="_blank" rel="noreferrer" onClick={onCta}>{productContent.buttonLabel} <span>↗</span></a>
      <small>{productContent.priceNote}</small>
    </div>
    <div className="product-visuals">
      <img className="product-cover-image" src={productImages.cover} alt="Small Bedroom Layout and Shopping Kit with real layout, style, and budget previews" loading="lazy" />
      <div className="product-preview-tabs">
        <img src={productImages.pages} alt="Four real pages from the 24-page small bedroom guide" loading="lazy" />
        <img src={productImages.workbook} alt="Editable budget and shopping workbook preview" loading="lazy" />
      </div>
    </div>
    <div className="product-includes"><span className="eyebrow">Inside the kit</span><ul>{productContent.contents.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul></div>
  </section>
}

function FreeValueSection({ onStartQuiz }: { onStartQuiz: () => void }) {
  return <section className="free-value-section" data-track-section="landing_layout_preview">
    <div><span className="eyebrow">Start with the room—not the cart</span><h2>Three decisions make a small bedroom feel bigger.</h2><p>Protect a 30–36 inch main walkway, choose one visual anchor, and solve your biggest daily problem before adding decor.</p><button className="secondary-button" onClick={onStartQuiz}>Find my room style <span>→</span></button></div>
    <ol><li><span>01</span><div><strong>Measure the fixed things</strong><p>Doors, windows, vents and the furniture you must keep.</p></div></li><li><span>02</span><div><strong>Choose the function</strong><p>Sleep-first, study-first, storage-first—or a balanced plan.</p></div></li><li><span>03</span><div><strong>Buy in the right order</strong><p>Lighting and function first; small decor only after the plan works.</p></div></li></ol>
  </section>
}

function ResultProductSection({ resultName, resultId, bestFor, productUrl }: { resultName: string; resultId: AestheticId; bestFor: readonly string[]; productUrl: string }) {
  return <section className="result-product result-product-upgraded" data-track-section="result_gumroad_offer">
    <div className="result-product-image"><img src={productImages.cover} alt="Small Bedroom Layout and Shopping Kit preview" loading="lazy" /><span>Real pages shown</span></div>
    <div><span className="eyebrow">Your practical next step</span><h2>{productContent.resultHeadline}</h2><p>{productContent.resultDescription} Use the {resultName} recipe, then pick the closest layout and budget path.</p><div className="vibe-row">{bestFor.map((item) => <span key={item}>{item}</span>)}</div><div className="product-proof"><span>24 pages</span><span>Editable workbook</span><span>30-day guarantee</span></div><a className="primary-button" href={productUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent(TRACKING_EVENTS.productCtaClicked, { location: 'result_after_plan', result: resultId, destination: 'gumroad', product_name: SITE_CONFIG.productName, price_usd: 7 })}>{productContent.buttonLabel} <span>↗</span></a><small>{productContent.priceNote}</small></div>
  </section>
}

function StyleShopSection({ onStartQuiz }: { onStartQuiz: () => void }) {
  return <section className="style-shop-section" id="shop-by-style" aria-labelledby="style-shop-heading" data-track-section="landing_affiliate_edits">
    <div className="style-shop-intro">
      <div>
        <span className="eyebrow">Already know your vibe?</span>
        <h2 id="style-shop-heading">Shop a small edit<br /><em>by room style.</em></h2>
      </div>
      <div>
        <p>Skip the endless scroll. Each edit starts with three categories that create the biggest visual change without requiring a full room makeover.</p>
        <button className="text-button" onClick={onStartQuiz}>Not sure yet? Take the quiz <span aria-hidden="true">→</span></button>
      </div>
    </div>
    <div className="style-shop-grid">
      {results.map((style) => {
        const picks = affiliateProducts[style.id]
        return <article className="style-shop-card" key={style.id} style={{ '--shop-accent': style.accent, '--shop-soft': style.softAccent } as React.CSSProperties}>
          <a
            className="style-shop-image-link"
            href={amazonSearchUrl(`${style.name} bedroom decor`)}
            target="_blank"
            rel="sponsored noreferrer"
            aria-label={`Browse ${style.name} bedroom decor on Amazon`}
            onClick={() => trackEvent(TRACKING_EVENTS.affiliateProductClicked, { location: 'landing_style_edit', result: style.id, product_category: 'style_edit', destination: 'amazon', link_type: 'search', search_term: `${style.name} bedroom decor`, click_target: 'image' })}
          >
            <img src={shopImages[style.id]} alt={`Editorial decor styling example for ${style.name}`} loading="lazy" />
            <span className="style-shop-badge">3-piece edit</span>
          </a>
          <div className="style-shop-copy">
            <div className="style-shop-title"><span aria-hidden="true">{style.symbol}</span><h3>{style.name}</h3></div>
            <p>{style.tagline}</p>
            <ul>{picks.map((pick) => <li key={pick.id}>{pick.name}</li>)}</ul>
            <a
              className="style-shop-cta"
              href={amazonSearchUrl(`${style.name} bedroom decor`)}
              target="_blank"
              rel="sponsored noreferrer"
              onClick={() => trackEvent(TRACKING_EVENTS.affiliateProductClicked, { location: 'landing_style_edit', result: style.id, product_category: 'style_edit', destination: 'amazon', link_type: 'search', search_term: `${style.name} bedroom decor`, click_target: 'cta' })}
            >Browse the {style.name} edit <span aria-hidden="true">↗</span></a>
          </div>
        </article>
      })}
    </div>
    <p className="affiliate-disclosure"><strong>Image note:</strong> These original styling photos are visual inspiration, not images of exact Amazon listings. <strong>Affiliate disclosure:</strong> As an Amazon Associate I earn from qualifying purchases.</p>
  </section>
}

export default App
