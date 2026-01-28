// src/constants/index.ts

import logo from "../assets/logo.jpg";

export const STORAGE_KEYS = {
  STOCK: "stockData",
  INVOICES: "invoices",
  DRAFT: "konsut_newinvoice_draft_vFinal",
  FREIGHT_RATE: "freightRate",
  CURRENCY_RATE: "currencyRate",
} as const;

export const COMPANY = {
  name: "KONSUT Ltd",
  address1: "P.O BOX 21162-00100",
  address2: "G.P.O NAIROBI",
  phone: "+254 700 420 897",
  email: "info@konsutltd.co.ke",
  pin: "P052435869T",
  logoPath: logo,
} as const;

export const DEFAULT_RATES = {
  FREIGHT: 50,
  CURRENCY: 130,
} as const;