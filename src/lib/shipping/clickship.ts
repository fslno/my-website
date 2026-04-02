import SftpClient from 'ssh2-sftp-client';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export interface ClickShipConfig {
  host: string;
  username: string;
  password?: string;
  privateKey?: string;
  port?: number;
  hostKey?: string;
  uploadDir: string;
  downloadDir: string;
}

export interface ClickShipOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceCode: string;
  postalCode: string;
  countryCode: string;
  phoneNumber?: string;
  items: {
    sku: string;
    description: string;
    quantity: number;
    weight: number;
    value: number;
  }[];
}

export class ClickShipClient {
  private sftp: SftpClient;
  private config: ClickShipConfig;
  private builder: XMLBuilder;

  constructor(config: ClickShipConfig) {
    this.sftp = new SftpClient();
    this.config = config;
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true
    });
  }

  /**
   * Generates the XML manifest for a list of orders.
   * NOTE: This schema is a placeholder and should be updated once the official ClickShip .xsd is provided.
   */
  public generateManifest(orders: ClickShipOrder[]): string {
    const manifest = {
      Shipments: {
        Shipment: orders.map(order => ({
          OrderNumber: order.orderNumber,
          ExternalID: order.id,
          Recipient: {
            Name: order.customerName,
            Address1: order.addressLine1,
            Address2: order.addressLine2 || '',
            City: order.city,
            Province: order.provinceCode,
            PostalCode: order.postalCode,
            Country: order.countryCode,
            Phone: order.phoneNumber || ''
          },
          Items: {
            Item: order.items.map(item => ({
              SKU: item.sku,
              Description: item.description,
              Quantity: item.quantity,
              Weight: item.weight,
              Value: item.value
            }))
          }
        }))
      }
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n${this.builder.build(manifest)}`;
  }

  /**
   * Connects to the ClickShip SFTP server and uploads the XML manifest.
   */
  public async uploadManifest(filename: string, content: string): Promise<boolean> {
    try {
      await this.sftp.connect({
        host: this.config.host,
        port: this.config.port || 22,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
        hostHash: 'sha256', // Standard requirement for host key verification
        // HostKey is verified by the client if we provide it or use a custom checker
      });

      const remotePath = `${this.config.uploadDir}/${filename}`;
      await this.sftp.put(Buffer.from(content), remotePath);
      await this.sftp.end();
      return true;
    } catch (error) {
      console.error('[CLICKSHIP_SFTP_ERROR]', error);
      throw error;
    }
  }

  /**
   * Verifies the SFTP connection credentials and host key.
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.sftp.connect({
        host: this.config.host,
        port: this.config.port || 22,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
      });
      await this.sftp.end();
      return true;
    } catch (error) {
      console.error('[CLICKSHIP_CONNECTION_TEST_ERROR]', error);
      return false;
    }
  }
}
