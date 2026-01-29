import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  MapPin,
  Globe,
  Cake,
  FileText,
  Lightbulb,
  Download,
  LayoutDashboard,
  FileBarChart
} from 'lucide-react';
import Modal from '../components/Modal';
import ProductivityDashboard from '../components/ProductivityDashboard';
import { useReports } from '../hooks/useReports';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'productivity'>('reports');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const { getGeneralStats, getByNeighborhood, getByCity, getBirthdays, loading } = useReports();

  const reports = [
    {
      id: 'general',
      title: 'Relatório Geral de Eleitores',
      desc: 'Relatório completo com filtros de período, bairro e faixa etária.',
      icon: Users,
      color: 'bg-blue-600',
      textColor: 'text-blue-100'
    },
    {
      id: 'neighborhood',
      title: 'Relatório por Bairro',
      desc: 'Relatório específico por bairro para planejamento de ações.',
      icon: MapPin,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-100'
    },
    {
      id: 'city',
      title: 'Relatório por Cidade',
      desc: 'Relatório específico por cidade — útil para deputados.',
      icon: Globe,
      color: 'bg-purple-600',
      textColor: 'text-purple-100'
    },
    {
      id: 'birthdays',
      title: 'Relatório de Aniversariantes',
      desc: 'Lista de aniversariantes com filtros personalizados por mês.',
      icon: Cake,
      color: 'bg-pink-600',
      textColor: 'text-pink-100'
    },
  ];

  const handleOpenReport = (report: any) => {
    setSelectedReport(report);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    // In a real scenario, this would trigger a backend generation or client-side generation
    // utilizing the data fetched from useReportsHooks.

    // Example:
    // const data = await getGeneralStats();
    // generatePDF(data);

    const fileName = `${selectedReport?.id}_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

    if (format === 'excel') {
      const csvContent = "data:text/csv;charset=utf-8,ID,Nome,Data\n1,Exemplo,2024-01-01";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", fileName.replace('xlsx', 'csv'));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Iniciando download do relatório: ${fileName}`);
    }

    setSelectedReport(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Central de Inteligência</h1>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reports'
                ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <FileBarChart className="w-4 h-4" />
            Relatórios
          </button>
          <button
            onClick={() => setActiveTab('productivity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'productivity'
                ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Produtividade
          </button>
        </div>
      </div>

      {activeTab === 'productivity' ? (
        <ProductivityDashboard />
      ) : (
        <>
          {/* Intro Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Relatórios de Campanha</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Gere relatórios detalhados para acompanhar o desempenho e planejar ações estratégicas.
                </p>
              </div>
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleOpenReport(report)}
                className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className={`${report.color} p-6 text-white relative overflow-hidden h-40`}>
                  <div className="relative z-10">
                    <h4 className="text-lg font-bold mb-2">{report.title}</h4>
                    <p className={`${report.textColor} text-sm leading-relaxed pr-8`}>{report.desc}</p>
                  </div>
                  <report.icon className="absolute right-4 bottom-4 w-20 h-20 text-white/20 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 font-medium transition-colors">Clique para acessar</span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <FileText className="w-4 h-4" />
                    Relatório
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dicas de Uso:</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm">Relatório Geral:</h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside marker:text-slate-400">
                    <li>Visão ampla de todos os eleitores cadastrados</li>
                    <li>Filtros por período e faixa etária</li>
                    <li>Estatísticas detalhadas de engajamento</li>
                    <li>Ideal para análises gerais da campanha</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm">Relatório por Cidade:</h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside marker:text-slate-400">
                    <li>Análise detalhada por município</li>
                    <li>Filtragem por gênero, faixa etária e busca</li>
                    <li>Exportação em CSV para equipes regionais</li>
                    <li>Útil para planejamento de deputados e viagens</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm">Relatório por Bairro:</h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside marker:text-slate-400">
                    <li>Foco específico em bairros estratégicos</li>
                    <li>Lista completa para visitas porta-a-porta</li>
                    <li>Exportação em CSV para impressão</li>
                    <li>Ideal para ações de campo locais</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm">Relatório de Aniversariantes:</h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside marker:text-slate-400">
                    <li>Lista de aniversariantes por período</li>
                    <li>Filtros por mês, cidade, bairro e categoria</li>
                    <li>Exportação em Excel para CRM</li>
                    <li>Ideal para ações de relacionamento e fidelização</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Report Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.title || 'Gerar Relatório'}
        footer={
          <>
            <button
              onClick={() => setSelectedReport(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> Gerar PDF
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Configure os filtros abaixo para personalizar os dados que serão incluídos no seu relatório.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Período de Cadastro</label>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                <input type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            {selectedReport?.id === 'birthdays' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mês de Referência</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Janeiro</option>
                  <option>Fevereiro</option>
                  <option>Março</option>
                  {/* ... */}
                </select>
              </div>
            )}

            {selectedReport?.id === 'neighborhood' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bairros Específicos</label>
                <input placeholder="Todos os bairros" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="include-inactive" className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
              <label htmlFor="include-inactive" className="text-sm text-slate-700 dark:text-slate-300">Incluir registros inativos</label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;