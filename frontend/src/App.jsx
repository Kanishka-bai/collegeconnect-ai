import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import KnowledgeModal from './components/KnowledgeModal';
import { 
  checkBackendHealth, 
  fetchSessions, 
  createSession, 
  fetchSessionHistory, 
  deleteSession, 
  clearAllSessions, 
  sendChatMessage 
} from './services/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial load: check health & fetch sessions
  useEffect(() => {
    const initApp = async () => {
      const health = await checkBackendHealth();
      setBackendStatus(health);

      const loadedSessions = await fetchSessions();
      setSessions(loadedSessions);

      if (loadedSessions.length > 0) {
        // Load the most recent session
        const latestId = loadedSessions[0].id;
        setActiveSessionId(latestId);
        const history = await fetchSessionHistory(latestId);
        if (history && history.messages) {
          setMessages(history.messages);
        }
      } else {
        // Create an initial session
        const newSession = await createSession('Welcome to CollegeConnect');
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
        setMessages([]);
      }
    };

    initApp();
  }, []);

  // Handle switching sessions
  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setIsLoading(false);
    setErrorMessage(null);
    const history = await fetchSessionHistory(sessionId);
    if (history && history.messages) {
      setMessages(history.messages);
    } else {
      setMessages([]);
    }
  };

  // Handle creating a new chat
  const handleNewChat = async () => {
    try {
      const newSession = await createSession('New Conversation');
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
      setErrorMessage(null);
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  // Handle deleting a single session
  const handleDeleteSession = async (sessionId) => {
    const success = await deleteSession(sessionId);
    if (success) {
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (activeSessionId === sessionId) {
        if (updated.length > 0) {
          handleSelectSession(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    }
  };

  // Handle clearing all chat history
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all conversation history?')) {
      await clearAllSessions();
      setSessions([]);
      setMessages([]);
      handleNewChat();
    }
  };

  // Handle sending a message
  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    setErrorMessage(null);

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession = await createSession(text.slice(0, 30));
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
    }

    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      session_id: currentSessionId,
      role: 'user',
      content: text,
      status: 'ACCEPTED',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text, currentSessionId);

      const botMsg = {
        id: response.id,
        session_id: response.session_id,
        role: 'assistant',
        content: response.message,
        status: response.status,
        warning_message: response.warning_message,
        citations: response.citations || [],
        created_at: response.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Update sidebar session title if it was first message
      setSessions((prevSessions) =>
        prevSessions.map((s) => {
          if (s.id === currentSessionId && (s.title === 'New Conversation' || s.title === 'Welcome to CollegeConnect')) {
            return { ...s, title: text.slice(0, 28) + (text.length > 28 ? '...' : ''), updated_at: new Date().toISOString() };
          }
          return s;
        })
      );
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Unable to connect to CollegeConnect AI. Please ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-navy-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-navy-950 relative">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          onOpenKnowledge={() => setIsKnowledgeModalOpen(true)}
          backendStatus={backendStatus}
        />

        {/* Messages or Welcome View */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {messages.length === 0 ? (
            <WelcomeScreen onSelectQuery={handleSendMessage} />
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onTryPrompt={handleSendMessage}
                />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex gap-3 my-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white flex items-center justify-center shrink-0 shadow-md">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-navy-850 border border-navy-750 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
                    <span className="text-xs text-slate-300 font-medium">
                      Checking relevance & querying college knowledge base...
                    </span>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={false}
        />
      </div>

      {/* Knowledge Base Modal */}
      <KnowledgeModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
      />
    </div>
  );
}
