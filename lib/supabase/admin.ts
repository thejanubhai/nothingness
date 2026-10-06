"use server";
import { adminDb, adminAuth } from '@/lib/firebase/admin';

// GOD MODE: Supabase-to-Firestore Monolithic Adapter (Admin)
// Bypasses RLS by running directly on Firebase Admin SDK

class SupabaseQueryBuilder {
  collection: string;
  _select: string = '*';
  _limit?: number;
  _eq: { key: string, val: any }[] = [];

  constructor(collection: string) {
    this.collection = collection;
  }

  select(cols: string) {
    this._select = cols;
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  eq(key: string, val: any) {
    this._eq.push({ key, val });
    return this;
  }
  
  or(clause: string) { return this; }
  in(key: string, vals: any[]) { return this; }
  lte(key: string, val: any) { return this; }
  gte(key: string, val: any) { return this; }
  order(key: string, opts: any) { return this; }

  async single() {
    const res = await this.execute();
    return { data: res.data?.[0] || null, error: res.error };
  }
  
  async maybeSingle() { return this.single(); }

  async execute() {
    try {
      let ref: any = adminDb.collection(this.collection);
      for (const cond of this._eq) {
        if (cond.key === 'id') {
          const doc = await ref.doc(cond.val).get();
          if (doc.exists) {
            return { data: [{ id: doc.id, ...doc.data() }], error: null };
          }
          return { data: [], error: null };
        }
        ref = ref.where(cond.key, '==', cond.val);
      }
      
      if (this._limit) ref = ref.limit(this._limit);
      const snap = await ref.get();
      const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async insert(payload: any) {
    try {
      if (Array.isArray(payload)) {
        const batch = adminDb.batch();
        const results = [];
        for (const item of payload) {
          const ref = adminDb.collection(this.collection).doc(item.id || adminDb.collection(this.collection).doc().id);
          batch.set(ref, item, { merge: true });
          results.push({ id: ref.id, ...item });
        }
        await batch.commit();
        return { data: results, error: null };
      } else {
        const ref = adminDb.collection(this.collection).doc(payload.id || adminDb.collection(this.collection).doc().id);
        await ref.set(payload, { merge: true });
        return { data: [{ id: ref.id, ...payload }], error: null };
      }
    } catch (error) { return { data: null, error }; }
  }

  async update(payload: any) {
    try {
      let ref: any = adminDb.collection(this.collection);
      let docsToUpdate = [];
      
      const idCond = this._eq.find(c => c.key === 'id');
      if (idCond) {
        docsToUpdate.push(ref.doc(idCond.val));
      } else {
        for (const cond of this._eq) ref = ref.where(cond.key, '==', cond.val);
        const snap = await ref.get();
        docsToUpdate = snap.docs.map((d: any) => d.ref);
      }

      const batch = adminDb.batch();
      docsToUpdate.forEach((dRef: any) => batch.update(dRef, payload));
      await batch.commit();
      
      return { data: docsToUpdate.map((d: any) => ({ id: d.id, ...payload })), error: null };
    } catch (error) { return { data: null, error }; }
  }

  async upsert(payload: any) { return this.insert(payload); }
  
  async delete() {
    try {
      const idCond = this._eq.find(c => c.key === 'id');
      if (idCond) {
        await adminDb.collection(this.collection).doc(idCond.val).delete();
      }
      return { data: null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  then(resolve: any, reject: any) { return this.execute().then(resolve, reject); }
}

export const createAdminClient = async () => {
  return {
    auth: {
      admin: {
        generateLink: async () => ({ data: null, error: null }),
        deleteUser: async () => ({ data: null, error: null }),
      }
    },
    from: (table: string) => new SupabaseQueryBuilder(table),
  };
};


