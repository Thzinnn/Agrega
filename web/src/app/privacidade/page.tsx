import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade - Agrega',
  description: 'Política de privacidade e uso de dados do portal Agrega.',
};

export default function PrivacidadePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-brand max-w-none text-gray-600">
          <p className="lead text-lg mb-6">
            A sua privacidade é importante para nós. É política do Agrega respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar em nosso site e outros sites que possuímos e operamos.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Coleta e Uso de Dados</h2>
          <p className="mb-4">
            Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço (como por exemplo, ao assinar alertas de vagas). Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Retenção de Dados</h2>
          <p className="mb-4">
            Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Compartilhamento de Informações</h2>
          <p className="mb-4">
            Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei. Nosso sistema não pratica a venda de dados pessoais de usuários.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Links Externos</h2>
          <p className="mb-4">
            O nosso portal agrega vagas que contêm links para sites externos (sistemas de recrutamento, portais de empresas) que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade. Recomendamos que você revise as políticas ao submeter suas candidaturas nesses links externos.
          </p>

          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
            <p>Esta política é efetiva a partir de Outubro de 2026.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
