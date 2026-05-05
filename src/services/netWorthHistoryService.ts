import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { NET_WORTH_HISTORY_COLLECTION } from '@easy-csp/shared-types';
import type { NetWorthHistory } from '@easy-csp/shared-types';

export const NetWorthHistoryService = {
  async getHistory(): Promise<NetWorthHistory | null> {
    const uid = getAuth().currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');

    const snap = await getDoc(doc(getFirestore(), NET_WORTH_HISTORY_COLLECTION, uid));
    return snap.exists() ? (snap.data() as NetWorthHistory) : null;
  },
};
