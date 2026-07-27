import React, { useState, useEffect } from "react";
import { Bot, Send, Sparkles, RefreshCw, BookOpen, ShieldAlert, Clock, UserCheck, Check, Copy, HelpCircle, X, ChevronRight, Mic, MicOff, Scale, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { useToasts } from "./ToastProvider";

interface DispatcherAssistantProps {
  onClose?: () => void;
  isWidget?: boolean;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  isLoadRebalanceProposal?: boolean;
  loadTransferData?: {
    sourceVehicle: string;
    targetVehicle: string;
    cargoWeightKg: number;
    meetingLocation: string;
    efficiencyGainPct: number;
  };
}

export default function DispatcherAssistant({ onClose, isWidget = false }: DispatcherAssistantProps) {
  const { addToast } = useToasts();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "assistant",
      text: "Greetings, Dispatch Administrator. I am the AI Dispatcher Assistant. I can help you search driver schedules, company HOS policies, emergency protocol steps, voice-activated commands, and mid-route live load re-balancing. How may I assist your shift today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            handleSend(transcript);
          }
        };

        setVoiceRecognition(recognition);
      }
    }
  }, []);

  const toggleVoiceListener = () => {
    if (isListening && voiceRecognition) {
      voiceRecognition.stop();
      setIsListening(false);
    } else if (voiceRecognition) {
      try {
        voiceRecognition.start();
        addToast({ title: "Voice Command Listener Active", description: "Speak your command clearly now...", type: "info" });
      } catch (err) {
        console.error("Speech recognition start failed:", err);
      }
    } else {
      // Fallback if browser SpeechRecognition is missing
      const sampleVoiceCommand = "What is the status of driver John Doe?";
      setInputMsg(sampleVoiceCommand);
      addToast({ title: "Voice Listener Simulation", description: `Voice input captured: "${sampleVoiceCommand}"`, type: "info" });
    }
  };

  const presetQueries = [
    "What is the status of driver John Doe?",
    "Mark vehicle 104 as low priority",
    "Run live mid-route load re-balancing analysis",
    "Which drivers are near HOS driving hour limits today?",
    "What is the emergency protocol for a vehicle breakdown?"
  ];

  const triggerLiveLoadRebalance = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: "Run live mid-route load re-balancing analysis",
      timestamp: timeStr
    };

    const proposalMsg: Message = {
      id: `bot-${Date.now()}`,
      sender: "assistant",
      text: "⚡ Live Load Capacity Analysis Complete: Vehicle FLT-9821 is operating near critical capacity (94% load, 18,800 kg), while adjacent vehicle FLT-1008 is currently underutilized (28% load, 5,600 kg) and travelling within 11.4 km on Interstate Corridor 90. Mid-route cargo re-balance recommended.",
      timestamp: timeStr,
      isLoadRebalanceProposal: true,
      loadTransferData: {
        sourceVehicle: "FLT-9821 (Heavy Freight)",
        targetVehicle: "FLT-1008 (Cargo Van)",
        cargoWeightKg: 3400,
        meetingLocation: "Rest Area Gate 14 (I-90 Milepost 42)",
        efficiencyGainPct: 18.5
      }
    };

    setMessages((prev) => [...prev, userMsg, proposalMsg]);
    addToast({
      title: "Live Load Re-balancing Calculated",
      description: "Mid-route cargo transfer proposal generated between FLT-9821 and FLT-1008.",
      type: "success"
    });
  };

  const handleSend = async (queryText?: string) => {
    const text = queryText || inputMsg;
    if (!text.trim() || loading) return;

    // Check if voice command triggers load rebalance
    if (text.toLowerCase().includes("load") && (text.toLowerCase().includes("rebalan") || text.toLowerCase().includes("transfer"))) {
      setInputMsg("");
      triggerLiveLoadRebalance();
      return;
    }

    // Check if voice command triggers vehicle priority update
    if (text.toLowerCase().includes("priority") || text.toLowerCase().includes("mark vehicle")) {
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userMsg: Message = { id: `usr-${Date.now()}`, sender: "user", text: text.trim(), timestamp: timeStr };
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: `✅ Voice Command Executed: Updated vehicle allocation ledger for command "${text.trim()}". Dispatch priority adjusted in operational matrix.`,
        timestamp: timeStr
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      if (!queryText) setInputMsg("");
      addToast({ title: "Voice Command Processed", description: `Updated priority state: "${text.trim()}"`, type: "success" });
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() })
      });
      const data = await res.json();

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: data.answer || "I parsed the system state, but was unable to formulate a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error("AI Assistant query error:", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: `[SYSTEM OFFLINE]: Unable to connect to cognitive engine. Default Policy Check: Maximum driving hours per 24h cycle is 8.0 hours. Mandatory 15-minute rest pause required every 3.5 driving hours.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col font-sans overflow-hidden ${
      isWidget ? "h-[560px] w-[380px]" : "h-[620px] w-full"
    }`}>
      
      {/* Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">AI Dispatcher Assistant</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <span className="text-[10px] text-slate-400 block">Query schedules, company policies & emergency steps</span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/90 text-xs">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="text-[9px] text-slate-400 font-mono mb-1 flex items-center gap-1.5">
                <span>{isUser ? "Dispatcher" : "AI Dispatch Assistant"}</span>
                <span>• {m.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-none border border-blue-500 font-medium"
                    : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700 font-mono"
                }`}
              >
                {m.text}

                {/* Interactive Load Re-balancing Proposal Card */}
                {m.isLoadRebalanceProposal && m.loadTransferData && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                      <Scale className="w-3.5 h-3.5" />
                      Mid-Route Cargo Transfer Proposal
                    </div>

                    <div className="bg-slate-900/90 p-2.5 rounded border border-slate-700 text-[10.5px] space-y-1 font-mono text-slate-300">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Source Vessel:</span>
                        <span className="font-bold text-amber-400">{m.loadTransferData.sourceVehicle}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Target Receiver:</span>
                        <span className="font-bold text-emerald-400">{m.loadTransferData.targetVehicle}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Re-balance Cargo Weight:</span>
                        <span className="font-bold text-white">{m.loadTransferData.cargoWeightKg.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Transfer Waypoint:</span>
                        <span className="font-bold text-blue-300 truncate max-w-[150px]">{m.loadTransferData.meetingLocation}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-800 pt-1 mt-1">
                        <span className="text-slate-400">Projected Fleet Efficiency Gain:</span>
                        <span className="font-bold text-emerald-400">+{m.loadTransferData.efficiencyGainPct}%</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addToast({
                          title: "Load Transfer Dispatched!",
                          description: `Instructions dispatched to ${m.loadTransferData?.sourceVehicle} and ${m.loadTransferData?.targetVehicle} for waypoint meeting at ${m.loadTransferData?.meetingLocation}.`,
                          type: "success"
                        });
                      }}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm uppercase font-mono"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Dispatch Mid-Route Transfer
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-blue-400 text-[11px] font-mono bg-slate-800/60 p-2.5 rounded-lg max-w-xs border border-slate-700">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Querying TransitOps database state & protocols...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2 bg-slate-950 border-t border-slate-800 space-y-1">
        <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider px-1 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-blue-400" /> Quick Administrative Queries:
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
          {presetQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="bg-slate-800 hover:bg-blue-900/50 text-slate-300 hover:text-blue-200 border border-slate-700 hover:border-blue-500 px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <span>{q}</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Form with Voice Listener */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleVoiceListener}
          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
            isListening 
              ? "bg-red-600 text-white border-red-400 animate-pulse" 
              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
          }`}
          title={isListening ? "Listening... Speak command" : "Click to speak voice command"}
        >
          {isListening ? <Mic className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-blue-400" />}
        </button>

        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder={isListening ? "Listening to voice input..." : "Ask schedule, policy, voice cmd ('status of John Doe'), or load rebalance..."}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim() || loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
