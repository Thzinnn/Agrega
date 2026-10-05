'use client';

import { useEffect, useState } from 'react';
import { Webhook, WebhookDelivery, WebhookCreateInput, WebhookUpdateInput } from '@/types/webhook';
import { WebhookTable } from './components/WebhookTable';
import { WebhookFormModal } from './components/WebhookFormModal';
import { SecretRevealModal } from './components/SecretRevealModal';
import { DeliveryLogDrawer } from './components/DeliveryLogDrawer';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [secretToReveal, setSecretToReveal] = useState<string | null>(null);
  
  // Logs Drawer
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [viewingWebhook, setViewingWebhook] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/webhooks');
      if (res.data?.success && res.data?.data) {
        setWebhooks(res.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      toast.error('Erro ao carregar webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: WebhookCreateInput | WebhookUpdateInput) => {
    setIsSubmitting(true);
    try {
      if (editingWebhook) {
        const res = await api.put(`/admin/webhooks/${editingWebhook.id}`, data);
        if (res.data?.success) {
          setIsFormOpen(false);
          loadWebhooks();
          toast.success('Webhook atualizado');
        }
      } else {
        const res = await api.post('/admin/webhooks', data);
        if (res.data?.success && res.data?.data) {
          setIsFormOpen(false);
          loadWebhooks();
          toast.success('Webhook criado');
          // Exibe o secret gerado 1 vez
          if (res.data.data.secret) {
            setSecretToReveal(res.data.data.secret);
          }
        }
      }
    } catch (error: unknown) {
      console.error(error);
      // @ts-expect-error - axios error structure
      toast.error(error?.response?.data?.message || 'Erro na operação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este Webhook? Isso parará a integração imediatamente.')) return;
    
    try {
      const res = await api.delete(`/admin/webhooks/${id}`);
      if (res.data?.success) {
        loadWebhooks();
        toast.success('Webhook excluído');
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error('Erro de rede');
    }
  };

  const handleRotate = async (id: string) => {
    if (!confirm('Atenção: Girar a chave inutilizará o segredo anterior. O script Python vai falhar até você trocar pela chave nova. Confirma?')) return;
    
    try {
      const res = await api.post(`/admin/webhooks/${id}/rotate-secret`);
      if (res.data?.success && res.data?.data?.secret) {
        setSecretToReveal(res.data.data.secret);
        toast.success('Chave girada com sucesso');
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error('Erro ao girar chave');
    }
  };

  const handleViewLogs = async (webhook: Webhook) => {
    setViewingWebhook(webhook);
    setIsLogsOpen(true);
    setIsLoadingLogs(true);
    setDeliveries([]);
    
    try {
      const res = await api.get(`/admin/webhooks/${webhook.id}/deliveries`);
      if (res.data?.success && res.data?.data) {
        setDeliveries(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure integrações de entrada para receber vagas automaticamente.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingWebhook(null);
            setIsFormOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Novo Webhook
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <WebhookTable 
          data={webhooks} 
          actions={{
            onEdit: (wh) => { setEditingWebhook(wh); setIsFormOpen(true); },
            onDelete: handleDelete,
            onRotate: handleRotate,
            onViewLogs: handleViewLogs
          }}
        />
      )}

      {/* Box de Instruções de Integração */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Como Integrar (Python / Scraper)</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          O Webhook espera um <strong>POST</strong> na rota <code>/api/v1/webhooks/receive/:webhookId</code> assinado via HMAC-SHA256 usando o Secret que você recebeu na criação.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm font-mono text-gray-800 dark:text-green-400 border border-gray-200 dark:border-gray-700">
<pre>{`import time
import hmac
import hashlib
import uuid
import requests
import json

WEBHOOK_ID = "SEU_WEBHOOK_ID"
SECRET = "whsec_..."
URL = f"https://sua-api.com/api/v1/webhooks/receive/{WEBHOOK_ID}"

payload = {
    "event": "job.upsert",
    "jobs": [
        {
            "id_vaga": "py-123",
            "titulo": "Dev Python",
            "empresa": "Tech"
            # ... mesmos campos de sempre
        }
    ]
}

raw_body = json.dumps(payload, separators=(',', ':'))
timestamp = str(int(time.time()))
delivery_id = str(uuid.uuid4())

# Cálculo da assinatura HMAC
message = f"{timestamp}.{raw_body}".encode('utf-8')
signature = hmac.new(SECRET.encode('utf-8'), message, hashlib.sha256).hexdigest()

headers = {
    "Content-Type": "application/json",
    "X-Agrega-Timestamp": timestamp,
    "X-Agrega-Signature": f"sha256={signature}",
    "X-Agrega-Delivery": delivery_id
}

resp = requests.post(URL, data=raw_body, headers=headers)
print(resp.json())`}</pre>
        </div>
      </div>

      <WebhookFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
        webhook={editingWebhook}
        isLoading={isSubmitting}
      />

      <SecretRevealModal
        isOpen={!!secretToReveal}
        secret={secretToReveal || ''}
        onClose={() => setSecretToReveal(null)}
      />

      <DeliveryLogDrawer
        isOpen={isLogsOpen}
        webhook={viewingWebhook}
        deliveries={deliveries}
        isLoading={isLoadingLogs}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
}
