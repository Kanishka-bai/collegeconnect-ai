// API Client for CollegeConnect AI Backend

const API_BASE = '/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend not responding to health check:', err);
    return null;
  }
}

export async function fetchCollegeOverview() {
  try {
    const res = await fetch(`${API_BASE}/knowledge/overview`);
    if (!res.ok) throw new Error(`Overview fetch failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not load college overview:', err);
    return null;
  }
}

export async function fetchSessions() {
  try {
    const res = await fetch(`${API_BASE}/sessions`);
    if (!res.ok) throw new Error(`Sessions fetch failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not load sessions from backend:', err);
    return [];
  }
}

export async function createSession(title = 'New Conversation') {
  try {
    const res = await fetch(`${API_BASE}/sessions?title=${encodeURIComponent(title)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Create session failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not create session on backend:', err);
    return {
      id: 'local-' + Date.now(),
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };
  }
}

export async function fetchSessionHistory(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
    if (!res.ok) throw new Error(`Fetch session history failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Could not load history for session ${sessionId}:`, err);
    return null;
  }
}

export async function deleteSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not delete session on backend:', err);
    return false;
  }
}

export async function clearAllSessions() {
  try {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not clear sessions on backend:', err);
    return false;
  }
}

export async function sendChatMessage(message, sessionId) {
  const payload = {
    message,
    session_id: sessionId,
  };

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = 'Failed to send message';
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return await res.json();
}
