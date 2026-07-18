"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { referralCodeFor, getStoredReferral, clearStoredReferral } from "@/lib/referral";

interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

interface UserDoc {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: "user" | "admin";
  isBlocked: boolean;
  referralCode?: string;
  referredBy?: string;
  referralCredits?: number;
  referralCount?: number;
  freeAddonCredits?: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const ref = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserDoc(snap.data() as UserDoc);
        }
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function createUserDoc(firebaseUser: User, name: string) {
    const ref = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // A referral code captured from ?ref= is consumed here. Guard against
      // self-referral (a user's own code shouldn't credit themselves).
      const ownCode = referralCodeFor(firebaseUser.uid);
      const referredByCode = getStoredReferral();
      const referredBy = referredByCode && referredByCode !== ownCode ? referredByCode : undefined;

      const data: UserDoc = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name,
        role: firebaseUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? "admin" : "user",
        isBlocked: false,
        referralCode: ownCode,
        referralCredits: 0,
      };
      if (firebaseUser.photoURL) data.photoURL = firebaseUser.photoURL;
      if (referredBy) data.referredBy = referredBy;
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
      clearStoredReferral();
      setUserDoc(data);
    }
  }

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createUserDoc(cred.user, name);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await createUserDoc(cred.user, cred.user.displayName ?? "User");
  };

  const logout = async () => {
    await signOut(auth);
    setUserDoc(null);
  };

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
