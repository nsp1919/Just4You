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
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { getStoredReferral, clearStoredReferral } from "@/lib/referral";

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
  walletBalance?: number;
  walletWithdrawableBalance?: number;
  pendingWalletWithdrawalId?: string;
  referralJoinBonusGranted?: boolean;
  /** Legacy balance migrated into walletBalance on profile initialization. */
  referralCredits?: number;
  referralCount?: number;
  freeAddonCredits?: number;
  referralRedeemed?: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await createUserDoc(firebaseUser, firebaseUser.displayName ?? "");
          unsubscribeProfile = onSnapshot(
            doc(db, COLLECTIONS.USERS, firebaseUser.uid),
            (snapshot) => {
              if (snapshot.exists()) setUserDoc(snapshot.data() as UserDoc);
            },
            (error) => console.error("Failed to sync user wallet:", error),
          );
        } catch (error) {
          console.error("Failed to initialize user profile:", error);
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => {
      unsub();
      unsubscribeProfile?.();
    };
  }, []);

  async function createUserDoc(firebaseUser: User, name: string) {
    const token = await firebaseUser.getIdToken();
    const response = await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, referralCode: getStoredReferral() }),
    });
    if (!response.ok) throw new Error("Profile initialization failed");
    const result = await response.json();
    if (result.profile) {
      clearStoredReferral();
      setUserDoc(result.profile as UserDoc);
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
