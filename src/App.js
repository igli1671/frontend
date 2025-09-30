import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, FileText, Download, User, Bot, Send, Loader2 } from 'lucide-react';

const LegalAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Përshëndetje! Jam Asistenti yt Ligjor, i specializuar në të drejtën shqiptare. Mund të të përgjigjem pyetjeve të përgjithshme dhe të gjeneroj dokumente ligjore profesionale. Si mund të të ndihmoj sot?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingMessageId, setDownloadingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          // Only scroll within the chat container, not the page
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  };

  const downloadDocument = async (messageId) => {
    setDownloadingMessageId(messageId);
    
    try {
      const response = await fetch('http://localhost:5000/api/download-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messages.find(m => m.id === messageId)?.content || '',
          format: 'word'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const downloadUrl = `http://localhost:5000${data.download_url}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(`Gabim gjatë gjenerimit të dokumentit: ${data.error}`);
      }
    } catch {
      alert('Gabim gjatë gjenerimit të dokumentit. Kontrollo lidhjen.');
    } finally {
      setDownloadingMessageId(null);
    }
  };

  useEffect(() => {
    // Only scroll if we have messages and the container exists
    if (messages.length > 0 && messagesContainerRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
        }),
      });

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.ok ? data.message : `Na vjen keq, ndodhi një gabim: ${data.error}`,
        legal_area: data.legal_area,
        document_type: data.document_type,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Na vjen keq, nuk u lidh me serverin. Sigurohu që backend-i është aktiv.',
        timestamp: new Date()
      }]);
    }

    setIsLoading(false);
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-silver to-legal-navy font-legal overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <header className="bg-legal-dark text-white rounded-xl shadow-legal-lg mb-6 p-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-legal-gold p-3 rounded-full">
              <MessageSquare className="w-6 h-6 text-legal-dark" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Asistent Ligjor Shqip</h1>
              <p className="text-legal-silver">AI për bisedë inteligjente dhe gjenerimin e dokumenteve ligjore</p>
            </div>
          </div>
        </header>

        {/* Chat */}
        <main className="bg-white rounded-xl shadow-legal-lg flex flex-col h-[500px] overflow-hidden mb-8">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl rounded-xl p-4 ${message.type === 'user' ? 'bg-legal-gold text-legal-dark' : 'bg-legal-navy text-white'} animate-slide-up`}>
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    <div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.legal_area && (
                        <div className="mt-2 text-sm opacity-75">
                          <span className="font-semibold">Fusha Ligjore:</span> {message.legal_area} | 
                          <span className="font-semibold"> Lloji i Dokumentit:</span> {message.document_type}
                        </div>
                      )}
                      {message.legal_area && message.legal_area !== "përgjithshme" && (
                        <div className="mt-3">
                          <button
                            onClick={() => downloadDocument(message.id)}
                            disabled={downloadingMessageId === message.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition"
                          >
                            {downloadingMessageId === message.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Duke gjeneruar...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Shkarko Word</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      <div className="text-xs mt-2 opacity-50">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-legal-navy text-white rounded-xl p-4 max-w-xs flex items-center space-x-2 animate-pulse-slow">
                  <Bot className="w-5 h-5" />
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Duke analizuar pyetjen...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-legal-dark">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Përshkruaj çështjen ligjore ose kërko këshillim..."
                className="flex-1 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold resize-none"
                rows="2"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-legal-gold text-legal-dark p-3 rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: MessageSquare, title: 'Bisedë Inteligjente', desc: 'Përgjigje të menjëhershme për pyetje të përgjithshme dhe ligjore.', color: 'text-legal-gold' },
            { icon: FileText, title: 'Dokumente Profesionale', desc: 'Shkarko dokumente ligjore të formatuara në Word.', color: 'text-green-600' },
            { icon: Download, title: 'Bazuar në Ligjin Shqiptar', desc: 'Përdor ligje dhe precedentë shqiptare për saktësi maksimale.', color: 'text-purple-600' }
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl shadow-legal p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <f.icon className={`w-8 h-8 ${f.color}`} />
                <h3 className="text-lg font-semibold">{f.title}</h3>
              </div>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Instructions */}
        <aside className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Si të përdorësh:</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>Shkruaj pyetjen ose përshkruaj çështjen ligjore</li>
            <li>Kliko dërgo për të marrë përgjigjen</li>
            <li>Për dokumente ligjore, kliko "Shkarko Word"</li>
            <li>Dokumenti shkarkohet automatikisht në kompjuterin tënd</li>
          </ol>
        </aside>
      </div>
    </div>
  );
};

export default LegalAssistant;
