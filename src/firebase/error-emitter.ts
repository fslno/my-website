'use client';

import { FirestorePermissionError } from './errors';

type Listener = (error: FirestorePermissionError) => void;

/**
 * A lightweight, browser-compatible event emitter for Firebase errors.
 * Replaces the Node.js 'events' module to avoid polyfill issues in Next.js.
 */
class FirebaseErrorEmitter {
  private listeners: Set<Listener> = new Set();

  on(event: 'permission-error', listener: Listener) {
    this.listeners.add(listener);
  }

  off(event: 'permission-error', listener: Listener) {
    this.listeners.delete(listener);
  }

  emit(event: 'permission-error', error: FirestorePermissionError) {
    this.listeners.forEach(listener => listener(error));
  }
}

export const errorEmitter = new FirebaseErrorEmitter();
