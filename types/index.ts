export type Category = {
  id: string;
  name: string;
  color?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image?: string;
  tax?: number;
  status?: boolean;
  applicablePreparationTime?: boolean;
  showInApp?: boolean;
  ingredients?: string[]; // IDs der Standard-Ingredients (beim Kunden vorausgewählt)
  addOns?: string[]; // IDs der verfügbaren Add-Ons (optional)
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  total: number;
};

export type Ingredient = {
  id: string;
  name: string;
  price: number;
  createdOn: string;
  status: boolean;
};

export type AddOn = {
  id: string;
  name: string;
  price: number;
  createdOn: string;
  status: boolean;
};

export type Menu = {
  id: string;
  name: string;
  color: string;
  image?: string;
  applicablePreparationTime: boolean;
  status: boolean;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  tagLine: string;
  orderReadyIn: number;
  orderCancelBefore: number;
  bufferTime: number;
  rushHourDisplaySeconds?: number;
  regularDisplaySeconds?: number;
  status: boolean;
  openDays?: {
    day: string;
    isOpen: boolean;
    openTime: string;
    rushStart: string;
    rushEnd: string;
    closeTime: string;
  }[];
};

export type Order = {
  id: string;
  contact: string;
  time: string;
  pickupTime?: string;
  address?: string;
  products: { name: string; quantity: number; extras?: string; removedIngredients?: string }[];
  price: number;
  paymentStatus: "Paid" | "Unpaid";
  status: "READY" | "PENDING" | "COMPLETED" | "CANCELLED" | "BLOCKED";
  blockingLevel?: number;
  createdAt: string;
  locationId?: string;
};

