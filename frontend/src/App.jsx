import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, User, Sparkles, FileText, Loader2, AlertCircle, 
  Briefcase, Code2, GraduationCap, Award, CheckCircle2, 
  Terminal, ArrowUpRight, Cpu, Layers, RotateCcw
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    icon: Code2,
    title: "Technical Architecture & Stack",
    prompt: "What are the candidate's core technical skills, languages, and frameworks?",
    category: "Capabilities"
  },
  {
    icon: Briefcase,
    title: "Professional Experience",
    prompt: "Summarize the candidate's internships, roles, and key engineering contributions.",
    category: "Track Record"
  },
  {
    icon: Layers,
    title: "Key Engineering Projects",
    prompt: "Tell me in detail about the candidate's top projects and their tech stacks.",
    category: "Portfolio"
  },
  {
    icon: GraduationCap,
    title: "Academic & Certifications",
    prompt: "What is the candidate's educational background and certifications?",
    category: "Credentials"
  }
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(res => res.json())
      .then(() => {
        setIsBackendReady(true);
        return fetch('http://127.0.0.1:8000/resume');
      })
      .then(res => res.json())
      .then(data => setCandidate(data))
      .catch(() => setIsBackendReady(false));
  }, []);

  const sendMessage = async (questionText) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || isLoading) return;

    if (!questionText) setInput('');
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev, 
      { role: 'user', content: textToSend, timestamp },
      { role: 'assistant', content: '', timestamp, isStreaming: true }
    ]);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend })
      });

      if (!response.ok || !response.body) {
        throw new Error('Stream failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: accumulatedText
          };
          return updated;
        });
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false
        };
        return updated;
      });

    } catch (error) {
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.role === 'assistant' && m.content === ''));
        return [...filtered, { 
          role: 'system', 
          content: 'Connection interrupted. Verify that the FastAPI server is active on port 8000.' 
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const candidateName = candidate?.name || "Parsing Resume...";
  const candidateRole = candidate?.experiences?.[0]?.role || "Candidate Profile";
  const candidateEducation = candidate?.education?.[0]?.split('–')?.[0]?.trim() || "Verified";
  const candidateSkills = candidate?.skills?.slice(0, 12) || [];
  const firstName = candidate?.name ? candidate.name.split(' ')[0] : "Candidate";

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-zinc-800 selection:text-white overflow-hidden relative">
      
      {/* Subtle Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-zinc-800/20 blur-[140px]" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] rounded-full bg-zinc-800/15 blur-[140px]" />
      </div>

      {/* LEFT SIDEBAR: Executive Candidate Dossier */}
      <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-r border-white/[0.07] bg-zinc-950/60 backdrop-blur-2xl z-10 justify-between p-6">
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-400 flex items-center justify-center shadow-lg shadow-white/5">
                <Terminal className="w-5 h-5 text-zinc-950" />
              </div>
              <div>
                <span className="font-semibold tracking-tight text-white text-base block leading-none">HireMe.AI</span>
                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest mt-1 block">Dossier Intelligence</span>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
              v2.6 Stream
            </span>
          </div>

          {/* Candidate Profile Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.07] space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1">Active Candidate</span>
                <h2 className="text-lg font-semibold text-white tracking-tight truncate">{candidateName}</h2>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{candidateRole}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] flex-shrink-0">
                <FileText className="w-4 h-4 text-zinc-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                <span className="text-[10px] text-zinc-500 uppercase block">Education</span>
                <span className="text-xs font-medium text-zinc-200 mt-0.5 block truncate" title={candidateEducation}>
                  {candidateEducation}
                </span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                <span className="text-[10px] text-zinc-500 uppercase block">Document</span>
                <span className="text-xs font-medium text-emerald-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {candidate ? "Cached" : "Indexing..."}
                </span>
              </div>
            </div>
          </div>

          {/* Core Competencies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Extracted Stack</span>
              <Cpu className="w-3.5 h-3.5 text-zinc-600" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {candidateSkills.length > 0 ? candidateSkills.map((skill) => (
                <span 
                  key={skill} 
                  onClick={() => sendMessage(`Tell me about the candidate's experience with ${skill}.`)}
                  className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] hover:border-white/20 transition-all duration-150"
                >
                  {skill}
                </span>
              )) : (
                <span className="text-xs text-zinc-500 font-mono">Extracting skills from resume.pdf...</span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 italic">Click any skill tag to stream specific experience.</p>
          </div>
        </div>

        {/* System Telemetry Footer */}
        <div className="pt-4 border-t border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Inference Mode</span>
            <span className="text-zinc-300 font-mono text-[11px]">Live Token Stream</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Backend Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isBackendReady ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
              <span className={`font-medium ${isBackendReady ? 'text-zinc-200' : 'text-rose-400'}`}>
                {isBackendReady ? 'Online & Ready' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN AREA: AI Command & Chat Interface */}
      <div className="flex-1 flex flex-col h-full z-10 relative">
        
        {/* Top Glass Navigation Bar */}
        <header className="h-16 border-b border-white/[0.07] bg-zinc-950/40 backdrop-blur-xl px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <h1 className="text-sm font-medium text-zinc-200">Interactive Resume Interrogation</h1>
          </div>

          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-all disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Session
              </button>
            )}
            <div className="lg:hidden flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs">
              <span className={`w-2 h-2 rounded-full ${isBackendReady ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span>{isBackendReady ? 'Ready' : 'Offline'}</span>
            </div>
          </div>
        </header>

        {/* Conversation Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            
            {/* Empty State / Executive Welcome */}
            {messages.length === 0 ? (
              <div className="my-auto space-y-8 py-8">
                <div className="space-y-3 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 mb-2">
                    <Award className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Real-Time Streaming Evaluation</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                    Evaluate {firstName}'s profile in seconds.
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                    Query verified resume data directly. Ask about architectural decisions, internships, AI implementations, or academic credentials without reading through pages of static text.
                  </p>
                </div>

                {/* Quick-Action Prompt Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {SUGGESTED_PROMPTS.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => sendMessage(item.prompt)}
                        disabled={!isBackendReady || isLoading}
                        className="group text-left p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 flex flex-col justify-between gap-4 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            {item.category}
                          </span>
                          <div className="p-2 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.1] border border-white/[0.05] transition-colors">
                            <IconComponent className="w-4 h-4 text-zinc-300" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white flex items-center justify-between">
                            {item.title}
                            <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-zinc-400" />
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            "{item.prompt}"
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Active Conversation Stream */
              <div className="space-y-6 pb-6">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot / System Avatar */}
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                        {msg.role === 'system' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        ) : msg.isStreaming && !msg.content ? (
                          <Loader2 className="w-4 h-4 text-zinc-300 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-zinc-200" />
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[92%] sm:max-w-[85%]`}>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-[11px] font-medium text-zinc-400">
                          {msg.role === 'user' ? 'Recruiter / Evaluator' : msg.role === 'system' ? 'System Alert' : 'Resume Intelligence'}
                        </span>
                        {msg.timestamp && (
                          <span className="text-[10px] text-zinc-600 font-mono">{msg.timestamp}</span>
                        )}
                      </div>

                      <div className={`rounded-2xl px-6 py-4 text-sm leading-relaxed w-full ${
                        msg.role === 'user' 
                          ? 'bg-zinc-100 text-zinc-950 font-medium rounded-tr-sm shadow-lg shadow-white/5' 
                          : msg.role === 'system'
                          ? 'bg-rose-950/40 text-rose-200 border border-rose-500/30'
                          : 'bg-zinc-900/60 border border-white/[0.08] text-zinc-300 rounded-tl-sm backdrop-blur-md shadow-xl'
                      }`}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : msg.content === '' && msg.isStreaming ? (
                          <div className="flex items-center gap-3 py-1">
                            <div className="flex space-x-1.5">
                              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-xs text-zinc-400 font-mono">Connecting to Groq stream...</span>
                          </div>
                        ) : (
                          /* Structured Markdown Renderer */
                          <div className="relative">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0 border-b border-white/10 pb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-base font-semibold text-white mt-5 mb-2.5 first:mt-0 flex items-center gap-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-zinc-100 mt-4 mb-1.5 first:mt-0" {...props} />,
                                p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed text-zinc-300" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                                ul: ({node, ...props}) => <ul className="space-y-2 my-3 list-none pl-0" {...props} />,
                                ol: ({node, ...props}) => <ol className="space-y-2 my-3 list-decimal pl-5 text-zinc-300" {...props} />,
                                li: ({node, ...props}) => (
                                  <li className="flex items-start gap-2.5 text-zinc-300 leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-2 flex-shrink-0" />
                                    <div className="flex-1">{props.children}</div>
                                  </li>
                                ),
                                table: ({node, ...props}) => (
                                  <div className="my-4 w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 shadow-inner">
                                    <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
                                  </div>
                                ),
                                thead: ({node, ...props}) => <thead className="bg-white/[0.04] border-b border-white/[0.08] text-zinc-200 font-medium" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="divide-y divide-white/[0.06]" {...props} />,
                                tr: ({node, ...props}) => <tr className="hover:bg-white/[0.02] transition-colors" {...props} />,
                                th: ({node, ...props}) => <th className="py-3 px-4 font-semibold text-zinc-200 whitespace-nowrap" {...props} />,
                                td: ({node, ...props}) => <td className="py-3 px-4 text-zinc-300 align-top leading-relaxed" {...props} />,
                                code: ({node, inline, ...props}) => (
                                  inline 
                                    ? <code className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-zinc-100 font-mono text-xs border border-white/[0.06]" {...props} />
                                    : <pre className="p-4 rounded-xl bg-black/60 border border-white/[0.08] overflow-x-auto my-3 font-mono text-xs text-zinc-200"><code {...props} /></pre>
                                ),
                                hr: ({node, ...props}) => <hr className="my-4 border-white/[0.08]" {...props} />
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                            {msg.isStreaming && (
                              <span className="inline-block w-2 h-4 ml-1 align-middle bg-zinc-300 animate-pulse" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-zinc-200 text-zinc-950 flex items-center justify-center flex-shrink-0 mt-1 font-semibold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Bottom Floating Command Input Bar */}
        <footer className="p-4 sm:p-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent">
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={handleSubmit} 
              className="relative flex items-center rounded-2xl bg-zinc-900/90 border border-white/[0.1] focus-within:border-white/[0.25] shadow-2xl transition-all duration-200 backdrop-blur-xl"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || !isBackendReady}
                placeholder={isBackendReady ? `Ask anything about ${firstName}'s projects, internships, or tech stack...` : "Awaiting backend connection on port 8000..."}
                className="w-full bg-transparent pl-5 pr-14 py-4 text-sm text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !isBackendReady}
                className="absolute right-2.5 p-2.5 bg-white text-zinc-950 rounded-xl hover:bg-zinc-200 transition-all duration-150 disabled:opacity-20 disabled:hover:bg-white disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between px-2 mt-2.5 text-[11px] text-zinc-500">
              <span>Strict adherence to verified resume data. Zero hallucination mode active.</span>
              <span className="hidden sm:inline font-mono">Press Enter ↵ to send</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}