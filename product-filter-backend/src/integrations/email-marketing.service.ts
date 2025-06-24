import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Member, SalesData, EmailCampaign } from './interfaces';

@Injectable()
export class EmailMarketingService {
  // Mock member database
  private members: Member[] = [
    { email: 'john@example.com', name: 'John Doe', campaignHistory: [] },
    { email: 'sarah@example.com', name: 'Sarah Smith', campaignHistory: [] },
    { email: 'mike@example.com', name: 'Mike Johnson', campaignHistory: [] },
    { email: 'lisa@example.com', name: 'Lisa Brown', campaignHistory: [] },
    { email: 'alex@example.com', name: 'Alex Wilson', campaignHistory: [] },
  ];

  // Campaign history storage
  private campaigns: EmailCampaign[] = [];
  private monthlyScheduler: NodeJS.Timeout | null = null;

  constructor() {
    // Start monthly automation when service initializes
    this.startMonthlyAutomation();
  }

  // Pseudo email service function - replace with Mailchimp/SendGrid API
  private sendEmail(to: string, subject: string, body: string): void {
    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('-------------------');
    // In real implementation: call Mailchimp/SendGrid API
  }

  // Generate unique campaign ID based on products
  private generateCampaignId(hotProducts: SalesData[]): string {
    const productIds = hotProducts
      .map((p) => p.product.substring(0, 8))
      .sort()
      .join('-');
    const date = new Date().toISOString().split('T')[0];
    return `campaign-${date}-${productIds.substring(0, 20)}`;
  }

  // Check if member should receive email (duplicate prevention)
  private shouldReceiveEmail(member: Member, campaignId: string): boolean {
    // Check if member already received this campaign
    if (member.campaignHistory?.includes(campaignId)) {
      return false;
    }

    // Check if member received email in last 25 days (monthly limit)
    if (member.lastEmailSent) {
      const daysSinceLastEmail =
        (Date.now() - member.lastEmailSent.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastEmail < 25) {
        return false;
      }
    }

    return true;
  }

  // Update member's email history
  private updateMemberHistory(email: string, campaignId: string): void {
    const member = this.members.find((m) => m.email === email);
    if (member) {
      member.lastEmailSent = new Date();
      if (!member.campaignHistory) {
        member.campaignHistory = [];
      }
      member.campaignHistory.push(campaignId);
    }
  }

  // Start monthly automation scheduler
  private startMonthlyAutomation(): void {
    // Run immediately on startup for testing
    console.log('Starting monthly email automation...');

    // Schedule to run every 30 days (for production use cron job instead)
    const thirtyDays = 24 * 60 * 60 * 30 * 1000; // 30 days in milliseconds

    this.monthlyScheduler = setInterval(() => {
      console.log('Running monthly automated email campaign...');
      this.automatedEmailMarketing();
    }, thirtyDays);

    // For demo: also run after 2 minutes to show automation works
    setTimeout(
      () => {
        console.log('Demo: Running first automated campaign...');
        this.automatedEmailMarketing();
      },
      2 * 60 * 1000,
    ); // 2 minutes
  }

  // Read CSV file and parse sales data
  private readSalesData(): SalesData[] {
    try {
      const csvPath = path.join(
        process.cwd(),
        'src',
        'data',
        'filtered_products.csv',
      );
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter((line) => line.trim());

      // Skip header line and parse data
      return lines
        .slice(1)
        .map((line) => {
          const [product, db, sold] = line.split(',');
          return {
            product: product?.trim() || '',
            db: parseFloat(db) || 0,
            sold: parseInt(sold) || 0,
          };
        })
        .filter((item) => item.product); // Remove empty entries
    } catch (error) {
      console.error('Error reading sales data:', error);
      return [];
    }
  }

  // Main automation function for email marketing with duplicate prevention
  automatedEmailMarketing(): {
    success: boolean;
    emailsSent: number;
    hotProducts: number;
    skippedDuplicates: number;
  } {
    try {
      // 1. Read sales data from CSV
      const salesData = this.readSalesData();

      // 2. Filter products sold more than 1000 times
      const hotProducts = salesData.filter((product) => product.sold > 1000);

      // 3. If no hot products, exit early
      if (hotProducts.length === 0) {
        console.log('No products with >1000 sales found');
        return {
          success: true,
          emailsSent: 0,
          hotProducts: 0,
          skippedDuplicates: 0,
        };
      }

      // 4. Generate unique campaign ID
      const campaignId = this.generateCampaignId(hotProducts);

      // 5. Check if this exact campaign was already sent
      const existingCampaign = this.campaigns.find((c) => c.id === campaignId);
      if (existingCampaign) {
        console.log(`Campaign ${campaignId} already sent, skipping...`);
        return {
          success: true,
          emailsSent: 0,
          hotProducts: hotProducts.length,
          skippedDuplicates: this.members.length,
        };
      }

      // 6. Create email content with hot products
      const productList = hotProducts
        .map(
          (p) =>
            `• Product ${p.product.substring(0, 8)}... - ${p.sold} sold at $${p.db}`,
        )
        .join('\n');

      const emailBody = `Hot Products Alert!
      
                        Our bestsellers this period:
                        ${productList}

                        Don't miss out on these popular items!

                        Best regards,
                        XXXLDigital Team`;

      // 7. Send emails only to eligible members (duplicate prevention)
      let emailsSent = 0;
      let skippedDuplicates = 0;
      const recipients: string[] = [];

      this.members.forEach((member) => {
        if (this.shouldReceiveEmail(member, campaignId)) {
          this.sendEmail(
            member.email,
            'Trending Products You Should Know About',
            `Hi ${member.name},\n\n${emailBody}`,
          );
          this.updateMemberHistory(member.email, campaignId);
          recipients.push(member.email);
          emailsSent++;
        } else {
          console.log(
            `Skipping ${member.email} - already received campaign or too recent`,
          );
          skippedDuplicates++;
        }
      });

      // 8. Save campaign history
      const campaign: EmailCampaign = {
        id: campaignId,
        productIds: hotProducts.map((p) => p.product),
        sentAt: new Date(),
        recipients,
      };
      this.campaigns.push(campaign);

      console.log(
        `Campaign ${campaignId}: Sent ${emailsSent} emails, skipped ${skippedDuplicates} duplicates`,
      );

      return {
        success: true,
        emailsSent,
        hotProducts: hotProducts.length,
        skippedDuplicates,
      };
    } catch (error) {
      console.error('Email marketing automation error:', error);
      return {
        success: false,
        emailsSent: 0,
        hotProducts: 0,
        skippedDuplicates: 0,
      };
    }
  }
}
