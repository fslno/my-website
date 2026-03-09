'use client';

import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

class FirebaseErrorEmitter extends EventEmitter {
  emitPermissionError(error: FirestorePermissionError) {
    this.emit('permission-error', error);
  }
}

export const errorEmitter = new FirebaseErrorEmitter();
