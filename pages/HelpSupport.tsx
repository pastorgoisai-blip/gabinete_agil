import React, { useState } from 'react';
import { 
  Search, 
  Rocket, 
  Users, 
  Bot, 
  Gavel, 
  UserCog, 
  Wrench, 
  ChevronDown, 
  Headset, 
  Ticket, 
  Mail, 
  Phone, 
  ArrowRight,
  Home,
  ChevronRight,
  FileText,
  Send,
  X
} from 'lucide-react';
import Modal from '../components/Modal';

const HelpSupport: React.FC = () => {
  // State for Search
  const [searchQuery, setSearchQuery] = useState('');

  // State for Modals
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Form State for Ticket
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', priority: 'Normal' });

  // Mock Data: FAQs
  const faqs = [
    { question: "Como importo uma lista de contatos do Excel?", answer: "Para importar contatos, vá até a aba <strong>Usuários</strong> e clique no botão 'Importar'. O sistema aceita arquivos .CSV e .XLSX. Certifique-se de que a primeira linha do seu arquivo contém os cabeçalhos das colunas (Nome, Telefone, Email, etc.)." },
    { question: "Posso alterar o nível de acesso de um membro da equipe?", answer: "Sim. Apenas administradores podem realizar essa alteração. Acesse <strong>Configurações > Equipe</strong>, selecione o usuário desejado e clique em 'Editar Permissões'. Você pode escolher entre Administrador, Editor ou Visualizador." },
    { question: "Como configuro o disparo automático de WhatsApp?", answer: "O disparo automático requer a integração da API oficial. Vá para <strong>Mensagens > Configurações</strong> e escaneie o QR Code fornecido. Após a conexão, você poderá criar fluxos de automação baseados em tags ou datas específicas." },
    { question: "Onde encontro os relatórios financeiros da campanha?", answer: "Os relatórios estão disponíveis no <strong>Dashboard</strong> principal. Você pode filtrar por período e exportar os dados em formato PDF ou Excel para prestação de contas." },
    { question: "Como redefinir minha senha?", answer: "Na tela de login, clique em 'Esqueci minha senha'. Um link de redefinição será enviado para o seu e-mail cadastrado." },
  ];

  // Mock Data: Articles per Category
  const categoryArticles: Record<string, string[]> = {
    "Primeiros Passos": ["Configurando sua conta", "Convidando a equipe", "Overview do Dashboard", "Instalando o App Mobile", "Segurança da Conta"],
    "Gerenciamento de Eleitores": ["Importação CSV", "Criando Tags", "Filtros Avançados", "Mapa de Calor", "Histórico de Interações", "Exclusão em Massa"],
    "Agente de Mensagens": ["Conectando WhatsApp", "Criando Chatbots", "Respostas Rápidas", "Regras de Gatilho", "Monitoramento ao Vivo"],
    "Área Legislativa": ["Cadastrando Projetos", "Acompanhando Tramitações", "Diário Oficial", "Modelos de Documentos"],
    "Conta e Assinatura": ["Alterar Plano", "Métodos de Pagamento", "Notas Fiscais", "Gerenciar Usuários"],
    "Problemas Técnicos": ["Sistema Lento", "Erro de Login", "Bug Report", "Limpeza de Cache"]
  };

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCategory = (title: string) => {
    setSelectedCategory({ title, articles: categoryArticles[title] || [] });
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to send to backend would go here
    alert(`Chamado "${ticketForm.subject}" enviado com sucesso! Nossa equipe responderá em breve.`);
    setIsTicketModalOpen(false);
    setTicketForm({ subject: '', message: '', priority: 'Normal' });
  };

  const handleEmailSupport = () => {
    window.location.href = "mailto:suporte@camaramanager.com.br?subject=Solicitação de Suporte";
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-7xl mx-auto w-full pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <a className="hover:text-primary-600 transition-colors flex items-center gap-1" href="/">
          <Home className="w-4 h-4" />
        </a>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 dark:text-white font-medium">Ajuda e Suporte</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Ajuda e Suporte</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Encontre respostas rápidas ou entre em contato com nossa equipe especializada.
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-lg shadow-sm transition-all outline-none" 
          placeholder="Busque por artigos, tutoriais ou perguntas (ex: 'importar eleitores')" 
          type="text"
        />
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Categorias de Ajuda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CategoryCard 
            icon={Rocket} 
            color="text-primary-600 dark:text-primary-400" 
            bgColor="bg-primary-50 dark:bg-primary-900/20" 
            title="Primeiros Passos" 
            desc="Configure sua conta, convide membros da equipe e inicie sua campanha."
            articleCount={5}
            onClick={() => handleOpenCategory("Primeiros Passos")}
          />
          <CategoryCard 
            icon={Users} 
            color="text-emerald-500" 
            bgColor="bg-emerald-50 dark:bg-emerald-900/20" 
            title="Gerenciamento de Eleitores" 
            desc="Importação de listas, segmentação, tags e mapas de calor."
            articleCount={6}
            onClick={() => handleOpenCategory("Gerenciamento de Eleitores")}
          />
          <CategoryCard 
            icon={Bot} 
            color="text-amber-500" 
            bgColor="bg-amber-50 dark:bg-amber-900/20" 
            title="Agente de Mensagens" 
            desc="Configuração de bots, WhatsApp API e respostas automáticas."
            articleCount={5}
            onClick={() => handleOpenCategory("Agente de Mensagens")}
          />
          <CategoryCard 
            icon={Gavel} 
            color="text-purple-500" 
            bgColor="bg-purple-50 dark:bg-purple-900/20" 
            title="Área Legislativa" 
            desc="Gestão de projetos de lei, diário oficial e tramitações."
            articleCount={4}
            onClick={() => handleOpenCategory("Área Legislativa")}
          />
          <CategoryCard 
            icon={UserCog} 
            color="text-pink-500" 
            bgColor="bg-pink-50 dark:bg-pink-900/20" 
            title="Conta e Assinatura" 
            desc="Faturas, upgrades de plano e gestão de usuários administrativos."
            articleCount={4}
            onClick={() => handleOpenCategory("Conta e Assinatura")}
          />
          <CategoryCard 
            icon={Wrench} 
            color="text-red-500" 
            bgColor="bg-red-50 dark:bg-red-900/20" 
            title="Problemas Técnicos" 
            desc="Relatar bugs, problemas de login ou lentidão no sistema."
            articleCount={4}
            onClick={() => handleOpenCategory("Problemas Técnicos")}
          />
        </div>
      </div>

      {/* FAQ & Contact */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
            {searchQuery ? 'Resultados da Busca' : 'Perguntas Frequentes'}
          </h2>
          <div className="flex flex-col gap-3">
             {filteredFaqs.length > 0 ? (
               filteredFaqs.map((faq, idx) => (
                 <FaqItem key={idx} question={faq.question}>
                   <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                 </FaqItem>
               ))
             ) : (
               <div className="p-8 text-center bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 text-slate-500">
                 Nenhuma pergunta encontrada para "{searchQuery}". Tente outro termo ou abra um chamado.
               </div>
             )}
          </div>
        </div>

        <div className="lg:w-80 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-primary-50 to-white dark:from-slate-800 dark:to-slate-800 border border-primary-100 dark:border-slate-700 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 text-white p-2 rounded-lg shadow-lg shadow-primary-600/20">
                <Headset className="w-6 h-6" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">Precisa de ajuda humana?</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Nossa equipe de suporte está disponível de Seg-Sex, das 08h às 20h.</p>
            <div className="flex flex-col gap-3 mt-2">
              <button 
                onClick={() => setIsTicketModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <Ticket className="w-5 h-5" />
                Abrir Chamado
              </button>
              <button 
                onClick={handleEmailSupport}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 text-slate-700 dark:text-white font-medium rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5" />
                Enviar E-mail
              </button>
              <a className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mt-1 transition-colors" href="tel:08001234567">
                <Phone className="w-4 h-4" />
                0800 123 4567
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <h4 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Status do Sistema</h4>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-slate-900 dark:text-white text-sm font-medium">Todos os sistemas operacionais</span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs">Última verificação: há 2 minutos</p>
          </div>
        </div>
      </div>
      
      {/* Footer Links */}
      <footer className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <p>© 2024 Plataforma de Campanha. Todos os direitos reservados.</p>
        <div className="flex gap-6">
          <a className="hover:text-primary-600 dark:hover:text-white transition-colors cursor-pointer">Termos de Uso</a>
          <a className="hover:text-primary-600 dark:hover:text-white transition-colors cursor-pointer">Privacidade</a>
          <a className="hover:text-primary-600 dark:hover:text-white transition-colors cursor-pointer">Documentação API</a>
        </div>
      </footer>

      {/* --- MODALS --- */}

      {/* Ticket Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Abrir Novo Chamado"
        footer={
          <>
            <button 
              onClick={() => setIsTicketModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSendTicket}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Enviar Chamado
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assunto</label>
            <input 
              type="text" 
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
              placeholder="Resumo do problema"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
            <select 
              value={ticketForm.priority}
              onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option>Baixa</option>
              <option>Normal</option>
              <option>Alta</option>
              <option>Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensagem</label>
            <textarea 
              rows={5}
              value={ticketForm.message}
              onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
              placeholder="Descreva detalhadamente o que está acontecendo..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Category Articles Modal */}
      <Modal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        title={selectedCategory?.title || 'Artigos'}
        footer={
          <button 
            onClick={() => setSelectedCategory(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Fechar
          </button>
        }
      >
        <div className="space-y-2">
          {selectedCategory?.articles && selectedCategory.articles.length > 0 ? (
            selectedCategory.articles.map((article: string, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary-600" />
                  <span className="text-slate-700 dark:text-slate-200 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-400">{article}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500" />
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-4">Nenhum artigo encontrado nesta categoria.</p>
          )}
        </div>
      </Modal>

    </div>
  );
};

const CategoryCard = ({ icon: Icon, color, bgColor, title, desc, articleCount, onClick }: any) => (
  <div onClick={onClick} className="group p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary-500/5">
    <div className={`size-10 rounded-lg ${bgColor} flex items-center justify-center mb-4 group-hover:bg-primary-600 dark:group-hover:bg-primary-600 transition-colors`}>
      <Icon className={`${color} w-6 h-6 group-hover:text-white transition-colors`} />
    </div>
    <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{desc}</p>
    <span className={`text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all ${color.split(' ')[0]}`}>
      Ver {articleCount} artigos <ArrowRight className="w-4 h-4" />
    </span>
  </div>
);

const FaqItem = ({ question, children }: any) => (
  <details className="group bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 open:bg-gray-50 dark:open:bg-slate-900/50 transition-all">
    <summary className="flex items-center justify-between p-4 cursor-pointer select-none list-none">
      <span className="text-slate-800 dark:text-white font-medium">{question}</span>
      <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
    </summary>
    <div className="px-4 pb-4 pt-0 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
      {children}
    </div>
  </details>
);

export default HelpSupport;