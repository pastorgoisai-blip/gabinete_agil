import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ShieldAlert, Mail } from 'lucide-react';

export default function PendingInvite() {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-amber-100 p-4 shadow-sm">
                        <ShieldAlert className="h-12 w-12 text-amber-600" />
                    </div>
                </div>
                <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
                    Acesso Pendente
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 px-4">
                    Olá, <span className="font-semibold text-slate-800">{user?.email}</span>. Sua conta foi criada com sucesso.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-xl sm:px-10 border border-slate-100">
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-900 text-sm leading-relaxed">
                            <p className="font-semibold mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Você precisa de um convite
                            </p>
                            Para acessar o sistema, o administrador do seu gabinete deve enviar um convite ou fornecer o código de acesso.
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-medium text-slate-900 mb-3">O que fazer agora?</h3>
                            <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4 marker:text-slate-400">
                                <li>Entre em contato com o responsável pelo gabinete.</li>
                                <li>Peça para ele te adicionar na equipe.</li>
                                <li>Assim que ele confirmar, atualize esta página.</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3 mt-8">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none transition-all"
                            >
                                Já fui aceito, atualizar página
                            </button>

                            <button
                                onClick={() => signOut()}
                                className="flex w-full justify-center items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none transition-all"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sair da conta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
