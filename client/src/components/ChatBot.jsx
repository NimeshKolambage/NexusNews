import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const SYSTEM_PROMPT = `You are NexusNews Bot, a helpful news assistant for NexusNews — a Sri Lanka-based news platform. Your job is to:
- Summarize current news on any topic (Sri Lanka, world, sports, tech, politics, business)
- Answer questions about recent events using web search
- Provide clear, concise, well-structured summaries
- Always mention sources/outlets when available
- If asked in Sinhala or Singlish, reply in the same style

When summarizing news, structure your response with a brief headline, key points, and context if relevant.`;

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! 👋 I'm NexusNews Bot. Ask me about Sri Lanka news, world events, sports, or tech — I'll search the web for the latest!", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text) return;

    const userMsg = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Use local backend directly
      const response = await fetch('https://nexusnews-production.up.railway.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error('Backend unavailable');
      }

      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't process that. Try again!";
      
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: '❌ Backend not responding. Make sure the server is running on port 3000!', sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickSuggestions = [
    'Latest Sri Lanka news today',
    'Top world news summary',
    'Latest sports news',
    'Recent tech news',
  ];

  return (
    <>
      <div className={`chat-widget ${isOpen ? 'open' : 'closed'}`}>
        <div className="chat-header">
          <div className="chat-title">
            <span style={{fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '20px'}}></span>
              NexusNews AI
            </span>
          </div>
          <button className="chat-close-btn" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <div className="chat-messages">
          {messages.length === 1 && (
            <div className="quick-suggestions">
              {quickSuggestions.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <div className="message-content">{msg.text}</div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="message-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder="Ask about any news..."
            className="chat-input"
            rows="2"
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="chat-send-btn">
            Send
          </button>
        </div>
      </div>

      {!isOpen && (
        <button className="chat-float-btn" onClick={() => setIsOpen(true)} title="Open NexusNews AI Chat">
          💬
        </button>
      )}
    </>
  );
}

export default ChatBot;