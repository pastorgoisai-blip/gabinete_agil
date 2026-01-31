import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, RefreshCw, Smartphone, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

const ChatSimulator: React.FC = () => {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (profile?.cabinet_id) {
            fetchMessages();
            // Optional: Subscribe to realtime changes
            const channel = supabase
                .channel('simulation_messages')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'simulation_messages',
                    filter: `cabinet_id=eq.${profile.cabinet_id}`
                }, (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [profile?.cabinet_id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        if (!profile?.cabinet_id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('simulation_messages')
            .select('*')
            .eq('cabinet_id', profile.cabinet_id)
            .order('created_at', { ascending: true });

        if (error) console.error('Error fetching messages:', error);
        else setMessages(data || []);
        setLoading(false);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !profile?.cabinet_id) return;

        const tempMsg: Message = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content: newMessage,
            created_at: new Date().toISOString()
        };

        // Optimistic UI update for user message
        // setMessages(prev => [...prev, tempMsg]); // Subscription will add it for real, preventing dupes if we are fast
        setNewMessage('');
        setSending(true);

        try {
            // Call Edge Function
            // Note: We need the agent_access_token. Ideally it's stored in context or fetched.
            // But wait, the Edge Function requires 'x-agent-token' header.
            // However, since we are calling from the Dashboard (Owner), maybe we should allow Owner Auth too?
            // Or we fetch the agent_access_token from the cabinet now.

            // To be secure/simple for this "Owner Simulator":
            // We can invoke the function authenticated as the logged user?
            // The Edge Function expects 'x-agent-token'. 
            // In Settings.tsx we have access to cabinet.agent_access_token.
            // Let's assume we pass it or fetch it.
            // Since we are inside a component, we might not have it readily available without fetching the cabinet.
            // Let's quickly fetch the token if needed or assume we can pass it as props.
            // For now, let's fetch it once on mount or use a prop.
            // PROPOSAL: Modify to accept agentToken as prop or fetch it.
            // Let's try to fetch it here to be self-contained.

            const { data: cabinetData } = await supabase
                .from('cabinets')
                .select('agent_access_token')
                .eq('id', profile.cabinet_id)
                .single();

            if (!cabinetData?.agent_access_token) {
                alert('Token do Agente não encontrado. Gere um token na aba "Conexão Externa".');
                setSending(false);
                return;
            }

            const { data, error } = await supabase.functions.invoke('agent-gateway', {
                body: {
                    tool: 'simulate_response',
                    args: { message: tempMsg.content },
                    agent_name: 'Simulator'
                },
                headers: {
                    'x-agent-token': cabinetData.agent_access_token
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            // AI response will come via Realtime, but optimal UX requires immediate feedback
            if (data.data) {
                setMessages(prev => {
                    if (prev.find(m => m.id === data.data.id)) return prev;
                    return [...prev, data.data];
                });
            }
        } catch (err: any) {
            console.error('Error sending message:', err);
            alert(`Erro no simulador: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleReset = async () => {
        if (!profile?.cabinet_id) return;
        if (!confirm('Isso apagará todo o histórico do simulador. Confirmar?')) return;

        const { error } = await supabase
            .from('simulation_messages')
            .delete()
            .eq('cabinet_id', profile.cabinet_id);

        if (error) console.error('Error resetting:', error);
        else setMessages([]);
    };

    return (
        <div className="flex flex-col h-[600px] bg-slate-100 dark:bg-slate-900 rounded-3xl border-8 border-slate-800 shadow-2xl overflow-hidden relative max-w-sm mx-auto">
            {/* Notch / Header */}
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Assistente Virtual</h3>
                        <p className="text-xs text-slate-400">Online</p>
                    </div>
                </div>
                <button onClick={handleReset} className="p-1 hover:bg-slate-700 rounded-full" title="Limpar Conversa">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] dark:bg-slate-800/50" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay' }}>
                {loading && <div className="text-center text-xs text-slate-500">Carregando histórico...</div>}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${msg.role === 'user'
                            ? 'bg-[#dcf8c6] dark:bg-green-900 text-slate-800 dark:text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none'
                            }`}>
                            <p>{msg.content}</p>
                            <span className="text-[10px] text-slate-500 block text-right mt-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-700 rounded-lg px-4 py-3 rounded-tl-none shadow-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-slate-200 dark:bg-slate-800 p-3 flex gap-2 items-end">
                <textarea
                    className="flex-1 rounded-2xl border-0 px-4 py-2 focus:ring-0 resize-none bg-white dark:bg-slate-700 dark:text-white text-sm"
                    rows={1}
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 pl-0.5" />}
                </button>
            </div>
        </div>
    );
};

export default ChatSimulator;
