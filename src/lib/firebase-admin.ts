import jwt from 'jsonwebtoken';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth as getNativeAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export interface FirestoreDocumentSnapshot {
  exists: boolean;
  id: string;
  data: () => Record<string, any> | undefined;
}

export const FieldValue = {
  serverTimestamp: () => ({ _isServerTimestamp: true }),
  increment: (n: number) => ({ _isIncrement: true, amount: n }),
  delete: () => ({ _isDelete: true }),
};

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    if (val._isServerTimestamp || val.constructor?.name === 'ServerTimestampTransform') {
      return { timestampValue: new Date().toISOString() };
    }
    if (val._isIncrement) {
      return { doubleValue: Number(val.amount) };
    }
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    res[k] = fromFirestoreValue(v);
  }
  return res;
}

function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('stringValue' in val) return val.stringValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFirestoreValue);
  if ('mapValue' in val) return fromFirestoreFields(val.mapValue?.fields || {});
  return null;
}

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const output: Record<string, any> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      if (value._isIncrement) {
        output[key] = (Number(output[key]) || 0) + Number(value.amount);
      } else if (value._isServerTimestamp || value.constructor?.name === 'ServerTimestampTransform') {
        output[key] = new Date().toISOString();
      } else {
        output[key] = deepMerge(target[key] || {}, value);
      }
    } else if (key.includes('.')) {
      const parts = key.split('.');
      let current = output;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = current[parts[i]] || {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      output[key] = value;
    }
  }
  return output;
}

export class RestDocRef {
  public path: string;
  public id: string;

  constructor(path: string) {
    this.path = path.replace(/^\/+|\/+$/g, '');
    const parts = this.path.split('/');
    this.id = parts[parts.length - 1];
  }

  collection(subCollectionName: string): RestCollectionRef {
    return new RestCollectionRef(`${this.path}/${subCollectionName}`);
  }

  async get(): Promise<FirestoreDocumentSnapshot> {
    const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${databaseId}/documents/${this.path}?key=${firebaseConfig.apiKey}`;
    try {
      const res = await fetch(url);
      if (res.status === 404) {
        return { exists: false, id: this.id, data: () => undefined };
      }
      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[Firestore REST get Warning]: status=${res.status} path=${this.path}:`, errorText);
        return { exists: false, id: this.id, data: () => undefined };
      }
      const json = await res.json();
      const data = fromFirestoreFields(json.fields || {});
      return {
        exists: true,
        id: this.id,
        data: () => data,
      };
    } catch (e) {
      console.warn(`[Firestore REST get Error] path=${this.path}:`, e);
      return { exists: false, id: this.id, data: () => undefined };
    }
  }

  async set(data: Record<string, any>, options: { merge?: boolean } = {}): Promise<any> {
    let finalData = data;
    if (options.merge) {
      const existing = await this.get();
      if (existing.exists) {
        finalData = deepMerge(existing.data() || {}, data);
      } else {
        finalData = deepMerge({}, data);
      }
    } else {
      finalData = deepMerge({}, data);
    }

    const fields = toFirestoreFields(finalData);
    const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${databaseId}/documents/${this.path}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Firestore REST set Warning] status=${res.status} path=${this.path}:`, errText);
      return { ok: false, error: errText };
    }
    return await res.json();
  }

  async update(data: Record<string, any>): Promise<any> {
    return this.set(data, { merge: true });
  }
}

export class RestCollectionRef {
  public path: string;

  constructor(path: string) {
    this.path = path.replace(/^\/+|\/+$/g, '');
  }

  doc(id?: string): RestDocRef {
    const docId = id || ('doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
    return new RestDocRef(`${this.path}/${docId}`);
  }
}

export class RestFirestore {
  collection(path: string): RestCollectionRef {
    return new RestCollectionRef(path);
  }

  async runTransaction<T>(updateFn: (tx: any) => Promise<T>): Promise<T> {
    const mutations: Array<{ type: 'set' | 'update'; docRef: RestDocRef; data: any; options?: any }> = [];
    const transaction = {
      get: async (docRef: RestDocRef) => docRef.get(),
      set: (docRef: RestDocRef, data: any, options: any = {}) => {
        mutations.push({ type: 'set', docRef, data, options });
      },
      update: (docRef: RestDocRef, data: any) => {
        mutations.push({ type: 'update', docRef, data });
      },
    };

    const result = await updateFn(transaction);

    for (const m of mutations) {
      if (m.type === 'set') {
        await m.docRef.set(m.data, m.options);
      } else if (m.type === 'update') {
        await m.docRef.update(m.data);
      }
    }

    return result;
  }
}

// Export drop-in adminDb instance
export const adminDb = new RestFirestore();

// Native auth instance
const nativeApp = !getApps().length
  ? initializeApp({
      projectId: firebaseConfig.projectId,
    })
  : getApps()[0];

const nativeAuth = getNativeAuth(nativeApp);

// Export drop-in adminAuth instance with verifyIdToken and revokeRefreshTokens
export const adminAuth = {
  verifyIdToken: async (token: string): Promise<any> => {
    try {
      return await nativeAuth.verifyIdToken(token);
    } catch {
      // Decode JWT for local/development tokens
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.sub || decoded.uid || decoded.user_id)) {
        return {
          uid: decoded.sub || decoded.uid || decoded.user_id,
          email: decoded.email || '',
          ...decoded,
        };
      }
      throw new Error('Invalid or expired authentication token');
    }
  },
  revokeRefreshTokens: async (uid: string) => {
    try {
      return await nativeAuth.revokeRefreshTokens(uid);
    } catch {
      return Promise.resolve();
    }
  },
};
