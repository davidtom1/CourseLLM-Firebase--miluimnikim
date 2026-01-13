"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { mockAuth } from "@/features/mockAuth";

type Profile = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: "student" | "teacher";
  department?: string;
  courses?: string[];
  authProviders?: string[];
  createdAt?: any;
  updatedAt?: any;
  profileComplete?: boolean;
};

type MockUser = {
  uid: string;
  email: string;
  displayName: string;
  role: "student" | "teacher";
};

type AuthContextValue = {
  firebaseUser: MockUser | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  onboardingRequired: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProviderMock");
  return ctx;
};

export const AuthProviderMock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  useEffect(() => {
    const unsubscribe = mockAuth.onAuthStateChanged(async (mockUser) => {
      setLoading(true);
      setUser(mockUser);
      if (mockUser) {
        await loadProfile(mockUser.uid);
      } else {
        setProfile(null);
        setOnboardingRequired(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loadProfile(uid: string): Promise<Profile | null> {
    try {
      const data = await mockAuth.getProfile(uid);
      if (!data) {
        setProfile(null);
        setOnboardingRequired(true);
        return null;
      }

      const isComplete = isProfileComplete(data);
      setProfile(data);
      setOnboardingRequired(!isComplete);
      return data;
    } catch (err) {
      console.error("Error loading profile:", err);
      setProfile(null);
      setOnboardingRequired(false);
      return null;
    }
  }

  function isProfileComplete(p: Profile | null | undefined) {
    if (!p) return false;
    const hasRole = p.role === "student" || p.role === "teacher";
    const hasDepartment = !!(p.department && p.department.toString().trim().length > 0);
    const hasCourses = Array.isArray(p.courses) && p.courses.length > 0;
    return hasRole && hasDepartment && hasCourses;
  }

  async function refreshProfile(): Promise<Profile | null> {
    const current = user || mockAuth.getCurrentUser();
    if (!current) return null;
    const p = await loadProfile(current.uid);
    return p || null;
  }

  async function handleSignInWithGoogle() {
    throw new Error("Google sign-in not available in mock mode");
  }

  async function handleSignOut() {
    await mockAuth.signOut();
    setProfile(null);
    setOnboardingRequired(false);
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser: user,
        profile,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        refreshProfile,
        onboardingRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProviderMock;
