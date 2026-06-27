export interface Product {
  _id: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  expiryDate: string; // YYYY-MM-DD
  lowStockThreshold: number;
  createdAt?: string;
}

export interface Sale {
  _id: string;
  productId: string;
  productName: string;
  qtySold: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  soldAt: string;
}

export interface DBStatus {
  connected: boolean;
  mode: string;
  info: string;
}
