export type WebhookStatus = 'SUCCESS' | 'FAILED' | 'REJECTED';

export type WebhookDelivery = {
  id: string;
  webhookId: string;
  deliveryId: string;
  status: WebhookStatus;
  processed: number;
  error: string | null;
  createdAt: string;
};

export type Webhook = {
  id: string;
  name: string;
  secret?: string; // Somente retornado na criação ou rotação
  event: string;
  isActive: boolean;
  totalReceived: number;
  lastReceivedAt: string | null;
  lastStatus: WebhookStatus | null;
  createdAt: string;
  updatedAt: string;
};

export type WebhookCreateInput = {
  name: string;
  event?: string;
  isActive?: boolean;
};

export type WebhookUpdateInput = Partial<WebhookCreateInput>;
