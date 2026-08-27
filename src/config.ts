export const SITE_CONFIG = {
  productName: 'Room Aesthetic Starter Kit',
  productUrl: 'https://sotahara.gumroad.com/l/room-aesthetic-starter-kit',
  landingPageUrl: 'https://sota2929.github.io/room-aesthetic-quiz/',
  amazonAssociateTag: 'roomaesthe069-20',
} as const

export const TRACKING_EVENTS = {
  pageView: 'page_view',
  quizStarted: 'quiz_start',
  quizCompleted: 'quiz_complete',
  resultViewed: 'result_view',
  productCtaClicked: 'gumroad_click',
  affiliateProductClicked: 'amazon_affiliate_click',
  retakeQuizClicked: 'retake_quiz_clicked',
  resultShared: 'result_shared',
} as const
