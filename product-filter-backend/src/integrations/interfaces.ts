export interface SalesData {
  product: string;
  db: number;
  sold: number;
}

export interface Member {
  email: string;
  name: string;
  lastEmailSent?: Date;
  campaignHistory?: string[];
}

export interface EmailCampaign {
  id: string;
  productIds: string[];
  sentAt: Date;
  recipients: string[];
}
