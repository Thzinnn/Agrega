import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso - Agrega',
  description: 'Termos de uso e condições do portal Agrega.',
};

export default function TermosPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Termos de Uso</h1>
        
        <div className="prose prose-brand max-w-none text-gray-600">
          <p className="lead text-lg mb-6">
            Ao acessar ao site Agrega, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Uso da Plataforma</h2>
          <p className="mb-4">
            O Agrega é um portal de indexação e agregação de vagas de emprego. Nosso serviço visa centralizar oportunidades do mercado para facilitar o acesso de profissionais em busca de realocação ou novas posições.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Isenção de Responsabilidade sobre Vagas</h2>
          <p className="mb-4">
            As vagas listadas em nossa plataforma são agregadas a partir de fontes públicas, submissões de empresas parceiras ou via web scraping ético. O Agrega <strong>não tem qualquer controle sobre os processos seletivos</strong>, os links de candidatura de terceiros ou o resultado das contratações. Toda submissão de currículos ocorre nos portais oficiais das empresas ou nos links indicados, transferindo a responsabilidade do tratamento de dados de currículo ao recrutador final.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Proibições</h2>
          <p className="mb-4">
            É estritamente proibido o uso automatizado abusivo (crawlers maliciosos, DDoS, extração maciça de banco de dados por scraping ofensivo) que possa comprometer a infraestrutura e a performance da plataforma. Os infratores terão seus IPs bloqueados pelas nossas defesas na borda (Cloudflare) e estarão sujeitos às penalidades legais.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Submissão de Novas Vagas</h2>
          <p className="mb-4">
            Empresas e usuários que submetem vagas manualmente devem garantir que a vaga existe, é verdadeira e não contém conteúdo discriminatório ou malicioso. Reservamo-nos o direito de remover qualquer vaga que viole nossas políticas de integridade a qualquer momento, sem aviso prévio.
          </p>

          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
            <p>Termos atualizados em Outubro de 2026.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
