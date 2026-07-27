import React, { useState } from "react";
import { MessageSquare, Send, CheckCheck, Clock, User, Shield, AlertCircle, Sparkles } from "lucide-react";
import { DetailedDriver } from "../types";
import { useToasts } from "./ToastProvider";

interface DriverChatProps {
  driver: DetailedDriver;
}

interface ChatMessage {
  id: string;
  sender: "dispatcher" | "driver" | "system";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

export default function DriverChat({ driver }: DriverChatProps) {
  const { addToast } = useToasts();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "system",
      text: `Dispatch communications link established with Vehicle ${driver.current_vehicle_id || "FLT-9821"}. GPS In-Cab Terminal Connected.`,
      timestamp: "08:15 AM"
    },
    {
      id: "msg-2",
      sender: "dispatcher",
      text: `Hello ${driver.name}, please confirm cargo load verification and departure readiness.`,
      timestamp: "08:20 AM",
      status: "read"
    },
    {
      id: "msg-3",
      sender: "driver",
      text: `Cargo manifest verified (${driver.current_order?.cargo_description || "High-Value Goods"}). Vehicle inspection cleared. Departing depot now.`,
      timestamp: "08:24 AM"
    },
    {
      id: "msg-4",
      sender: "dispatcher",
      text: "Acknowledged. Maintain defensive driving protocols. Speed limit along corridor is 80 km/h.",
      timestamp: "08:26 AM",
      status: "read"
    }
  ]);

  const [inputMessage, setInputMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "dispatcher",
      text: text.trim(),
      timestamp: timeStr,
      status: "sent"
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputMessage("");

    addToast({
      type: "info",
      title: "Dispatch Message Sent",
      message: `Transmission sent to ${driver.name}'s in-cab terminal.`
    });

    // Simulate driver automated receipt & acknowledgement response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const ackMsg: ChatMessage = {
        id: `msg-ack-${Date.now()}`,
        sender: "driver",
        text: `Copy dispatch. Message received on in-cab terminal display. Proceeding as instructed.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, ackMsg]);
    }, 2200);
  };

  const quickReplies = [
    "Request Status & Location Check-In",
    "Advise Traffic Bypass on NH-48",
    "Mandatory Rest Break Reminder",
    "Confirm Cargo Delivery Protocol"
  ];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
      {/* Chat Room Header */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs border border-blue-400">
              {driver.name.split(" ").map(n => n[0]).join("")}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
          </div>
          <div>
            <div className="font-bold text-xs text-white flex items-center gap-2">
              <span>{driver.name}</span>
              <span className="font-mono text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.2 rounded border border-blue-800">
                {driver.id}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> In-Cab Terminal Online
              </span>
              <span>• Vehicle: {driver.current_vehicle_id || "FLT-9821"}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 px-2.5 py-1 rounded text-[10px] text-slate-300 font-mono flex items-center gap-1 border border-slate-700">
          <Shield className="w-3 h-3 text-blue-400" />
          <span>Encrypted Dispatch Radio</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/90 text-xs">
        {messages.map((msg) => {
          if (msg.sender === "system") {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="inline-block bg-slate-800/80 text-slate-400 text-[10px] font-mono px-3 py-1 rounded-full border border-slate-700/60">
                  ⚡ {msg.text} ({msg.timestamp})
                </span>
              </div>
            );
          }

          const isDispatcher = msg.sender === "dispatcher";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isDispatcher ? "items-end" : "items-start"}`}
            >
              <div className="text-[9px] text-slate-400 font-mono mb-0.5 flex items-center gap-1">
                <span>{isDispatcher ? "Administrative Dispatcher" : driver.name}</span>
                <span>• {msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[80%] p-2.5 rounded-xl text-xs leading-relaxed shadow-sm ${
                  isDispatcher
                    ? "bg-blue-600 text-white rounded-br-none border border-blue-500"
                    : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"
                }`}
              >
                {msg.text}
              </div>

              {isDispatcher && (
                <div className="text-[9px] text-blue-300 flex items-center gap-1 mt-0.5 font-mono">
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span>Delivered to In-Cab Screen</span>
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-[10px] italic font-mono bg-slate-800/50 p-2 rounded-lg max-w-xs border border-slate-700/40">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></span>
            {driver.name} is keying response on in-cab terminal...
          </div>
        )}
      </div>

      {/* Quick Replies Preset Bar */}
      <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px]">
        <span className="text-slate-500 font-bold shrink-0 px-1 uppercase tracking-wider">Quick Directives:</span>
        {quickReplies.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="bg-slate-800 hover:bg-blue-900/60 text-slate-300 hover:text-blue-200 border border-slate-700 hover:border-blue-600 px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Broadcast instruction to ${driver.name}...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          Transmit
        </button>
      </form>
    </div>
  );
}
