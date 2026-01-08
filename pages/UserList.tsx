import React from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  MoreVertical, 
  Plus, 
  ShieldCheck, 
  Briefcase, 
  Heart 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Section: Breadcrumbs & Actions */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <a className="text-slate-500 dark:text-slate-400 font-medium hover:text-primary-600 transition-colors" href="#">Dashboard</a>
          <ChevronRight className="text-slate-400 w-4 h-4" />
          <span className="text-slate-900 dark:text-white font-medium">Gerenciamento de Usuários</span>
        </div>
        {/* Title & Primary Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Gerenciamento de Usuários</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie o acesso, permissões e monitore a atividade da equipe.</p>
          </div>
          <button 
            onClick={() => navigate('/users/new')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold h-10 px-5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="relative block h-11">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input 
                className="block w-full h-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-all" 
                placeholder="Buscar por nome ou email..." 
                type="text"
              />
            </label>
          </div>
          {/* Filters */}
          <div className="flex gap-4">
            <div className="w-full lg:w-48">
              <div className="relative">
                <select className="appearance-none w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block px-3 py-2.5 outline-none">
                  <option value="">Status: Todos</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>
            <div className="w-full lg:w-48">
              <div className="relative">
                <select className="appearance-none w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block px-3 py-2.5 outline-none">
                  <option value="">Função: Todas</option>
                  <option value="admin">Administrador</option>
                  <option value="staff">Equipe</option>
                  <option value="volunteer">Voluntário</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Usuário</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:table-cell">Função</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden lg:table-cell">Último Acesso</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              {/* Row 1 */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate('/users/edit/1')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDUQnMATvJGjEvv1Srqs35aJxIXgjihTJ_0ueMmZQJedENNeKNyHiPV5AnGsBKiOCmt5AyTwO4tFFUxqaS474gLC9LbosFCAOsSnBykT2x0OHE4T6jsGzfiPp5zuA4wittzeLUOXUt_hwmbbaJhCItkIWKGisPLe9uZinwydMRSIqIFv8UE3cczmOwwr4GXDG5BFojfybBpCZ7XyJtrE2B-0EfKlkGuXU5RQL8sE8t9Op_eAeIRQ0i7o7J8vK4py1BMVx1TJN2H2LA")'}}></div>
                    <div className="ml-4">
                      <div className="font-medium text-slate-900 dark:text-white">Ana Silva</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">ana.silva@campanha.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-primary-600" />
                    <span>Administrador</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                    Ativo
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                  Hoje, 09:42
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate('/users/edit/2')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC0cj4dfUXI4VtmKkHo89q38CFJo8897A1EUf8PG2nDbfIhRx5PfP44W5Qg8cp_e-N_B2Gz5NctSPujvBixF9xMTeC3D6aSeEdCddIPl-EvVcNCzP6qelcCPVlr5AsC0svJHQTWXxRcES7MCLVHhkMY-Ckqjbe2HhTLA2UWBuIlHS05KgkZqSHTRtzf01JRB3gBKECDybJ6cSDpJPYD45wu5j3ND1e0TQewqaJIhdZAAI7I7zmHnAaZn5ha2zJFAUVkKJDXd_ranEw")'}}></div>
                    <div className="ml-4">
                      <div className="font-medium text-slate-900 dark:text-white">Carlos Mendes</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">carlos.m@campanha.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>Equipe</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                    Ativo
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                  Ontem, 16:20
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate('/users/edit/3')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      JR
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-slate-900 dark:text-white">João Rodrigues</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">joao.r@campanha.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Heart className="w-4 h-4 text-slate-400" />
                    <span>Voluntário</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
                    Pendente
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
              {/* Row 4 */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate('/users/edit/4')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxgEFkkIuY2WTFtIx-dkifcFlR91N0WJpafiulLUB7xv28htZhgU2VZuKIOWMzFGpo6r5CjvEPQFPx9sX72l19qWe9HIdN4ocAY93rEmxYvDrUkqmJmwXSHnL84ectcWF_Onu0vTObKrMOssxR0mvOsHOxMRjZN30i7qfapCe4BYbZL_Z92I-lmbO8VEmJls6CWN6KihJJxkKBZvrd82wHEddm4DXM9JE1P2OOvXGlxaC5GU_WTbW-BGIo9auJ1yeRhiTlntBCtOg")'}}></div>
                    <div className="ml-4">
                      <div className="font-medium text-slate-900 dark:text-white">Mariana Costa</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">mariana.c@campanha.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>Equipe</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600 dark:bg-slate-400"></span>
                    Inativo
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                  20 Ago, 2024
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 gap-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Mostrando <span className="font-medium text-slate-900 dark:text-white">1</span> a <span className="font-medium text-slate-900 dark:text-white">5</span> de <span className="font-medium text-slate-900 dark:text-white">24</span> resultados
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded bg-primary-600 text-white font-medium text-sm shadow-md shadow-primary-600/20">
              1
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium transition-colors">
              2
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium transition-colors">
              3
            </button>
            <span className="text-slate-400 px-1">...</span>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium transition-colors">
              5
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;