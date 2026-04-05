import type { Transaction } from "@easy-csp/shared-types";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export type ListTransactionsRequest = {
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData, DocumentData>;
  startDate?: number;         // Optional start date as UTC epoch timestamp
  endDate?: number;           // Optional end date as UTC epoch timestamp
  category?: string;          // Optional category filter
  fundId?: string;            // Optional fund filter
};

export type ListTransactionsResponse = {
  lastFetchSnapshot?: QueryDocumentSnapshot<DocumentData, DocumentData> | "NEXT_TOKEN_END";
  transactions?: Transaction[];
};
