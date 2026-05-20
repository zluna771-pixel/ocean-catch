import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db, auth, handleFirestoreError } from "../lib/firebase";

export interface HarvestRecord {
  id?: string;
  userId: string;
  speciesName: string;
  speciesNameZh: string;
  scientificName: string;
  description: string;
  descriptionZh: string;
  habitat: string;
  habitatZh: string;
  funFact: string;
  funFactZh: string;
  imageUrl: string;
  caughtAt: any; // Firestore Timestamp
  isPublic: boolean;
}

const COLLECTION_NAME = "harvests";

export const firebaseService = {
  async addHarvest(record: Omit<HarvestRecord, "id" | "userId" | "caughtAt">) {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in");

    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...record,
        userId: user.uid,
        caughtAt: serverTimestamp(),
        isPublic: false,
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, "create", COLLECTION_NAME);
    }
  },

  async getMyHarvests(): Promise<HarvestRecord[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", user.uid),
        orderBy("caughtAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HarvestRecord[];
    } catch (error) {
      handleFirestoreError(error, "list", COLLECTION_NAME);
    }
  },

  async deleteHarvest(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, "delete", `${COLLECTION_NAME}/${id}`);
    }
  },
};
