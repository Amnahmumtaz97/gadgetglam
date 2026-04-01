export function getAssistantSessionId() {
  return localStorage.getItem('gg_ai_session') || '';
}

export function setAssistantSessionId(sessionId) {
  if (!sessionId) return;
  localStorage.setItem('gg_ai_session', sessionId);
}

export function getLastCartActivity() {
  return localStorage.getItem('gg_last_cart_activity') || '';
}

export function setLastCartActivity(timestamp = new Date().toISOString()) {
  localStorage.setItem('gg_last_cart_activity', timestamp);
}
