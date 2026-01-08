/**
 * Offline Queue Manager using Dexie.js
 * Stores failed requests when offline and retries them when back online
 */

import Dexie, { Table } from "dexie";

export interface QueuedRequest {
  id?: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

/**
 * Dexie database class for offline queue
 */
class OfflineQueueDB extends Dexie {
  queuedRequests!: Table<QueuedRequest, string>;

  constructor() {
    super("offlineQueueDB");
    this.version(1).stores({
      queuedRequests: "id, timestamp, retryCount",
    });
  }
}

// Create database instance
const db = new OfflineQueueDB();

/**
 * Generate unique ID for queued request
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

class OfflineQueueManager {
  /**
   * Add request to queue
   */
  async queueRequest(
    method: QueuedRequest["method"],
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
    params?: Record<string, unknown>
  ): Promise<string> {
    const id = generateId();
    const queuedRequest: QueuedRequest = {
      id,
      method,
      url,
      data,
      headers,
      params,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await db.queuedRequests.add(queuedRequest);
    return id;
  }

  /**
   * Get all queued requests, ordered by timestamp (oldest first)
   */
  async getQueuedRequests(): Promise<QueuedRequest[]> {
    return await db.queuedRequests.orderBy("timestamp").toArray();
  }

  /**
   * Get queued request by ID
   */
  async getQueuedRequest(id: string): Promise<QueuedRequest | null> {
    const request = await db.queuedRequests.get(id);
    return request || null;
  }

  /**
   * Remove request from queue
   */
  async removeRequest(id: string): Promise<void> {
    await db.queuedRequests.delete(id);
  }

  /**
   * Update request retry count
   */
  async updateRetryCount(id: string, retryCount: number): Promise<void> {
    await db.queuedRequests.update(id, { retryCount });
  }

  /**
   * Clear all queued requests
   */
  async clearAll(): Promise<void> {
    await db.queuedRequests.clear();
  }

  /**
   * Get queue count
   */
  async getQueueCount(): Promise<number> {
    return await db.queuedRequests.count();
  }
}

export const offlineQueue = new OfflineQueueManager();
