"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProviderClient"
import { auth, db } from "@/features/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, Loader2, User, GraduationCap } from "lucide-react"

export default function LoginPage() {
  const { signInWithGoogle, loading, firebaseUser, refreshProfile, profile } = useAuth()
  const [navigating, setNavigating] = useState(false)
  const router = useRouter()

  const gotoAfterAuth = async () => {
    // Fast path: if profile already in memory use it
    if (profile && profile.role) return router.replace(profile.role === "teacher" ? "/teacher" : "/student")

    // Otherwise try to refresh but don't wait long — race against a short timeout
    const refreshPromise = refreshProfile()
    const res = await Promise.race([
      refreshPromise,
      new Promise<null>((r) => setTimeout(() => r(null), 700)),
    ])

    const resProfile = res as { role?: string } | null;
    if (resProfile?.role) return router.replace(resProfile.role === "teacher" ? "/teacher" : "/student")

    // Fallback: optimistic default. RoleGuard will correct if needed.
    return router.replace("/student")
  }

  const handleGoogle = async () => {
    try {
      setNavigating(true)
      await signInWithGoogle()
      // If this is the user's first sign-in, send them to onboarding immediately.
      const user = auth.currentUser
      const isNew = !!(user && user.metadata && user.metadata.creationTime === user.metadata.lastSignInTime)
      if (isNew) return router.replace("/onboarding")

      await gotoAfterAuth()
    } catch (err: unknown) {
      setNavigating(false)
      console.error(err)
    }
  }

  const handleMockLogin = async (role: "student" | "teacher") => {
    try {
      setNavigating(true)
      const email = role === "student" ? "student@test.com" : "teacher@test.com"
      const password = "password123"

      // Sign in with test account
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Create/update profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        displayName: role === "student" ? "Test Student" : "Test Teacher",
        role: role,
        department: "Test Department",
        courses: ["test-course-101"],
        profileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await refreshProfile()
      router.replace(role === "student" ? "/student" : "/teacher")
    } catch (err: unknown) {
      setNavigating(false)
      console.error("Mock login error:", err)
      const message = err instanceof Error ? err.message : String(err);
      alert(`Login failed: ${message}. Make sure Auth emulator is running.`)
    }
  }

  // Note: GitHub sign-in removed — only Google sign-in is supported.

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <Card>
        <CardHeader>
          <CardTitle>Sign in to CourseLLM</CardTitle>
          <CardDescription>Sign in with Google to continue &mdash; we&apos;ll only store the info needed for your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Button onClick={handleGoogle} disabled={loading} size="lg" variant="default">
              <LogIn className="mr-2" /> Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or use mock login (dev only)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleMockLogin("student")}
                disabled={loading}
                size="lg"
                variant="outline"
              >
                <User className="mr-2 h-4 w-4" /> Mock Student
              </Button>
              <Button
                onClick={() => handleMockLogin("teacher")}
                disabled={loading}
                size="lg"
                variant="outline"
              >
                <GraduationCap className="mr-2 h-4 w-4" /> Mock Teacher
              </Button>
            </div>

            {firebaseUser && (
              <div className="text-sm text-muted-foreground">Signed in as {firebaseUser.email}</div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
      {navigating && (
          <div className="fixed inset-0 z-50 bg-background/75 flex items-center justify-center">
            <div className="w-full max-w-sm px-6">
              <div className="rounded-lg bg-card p-6 shadow-lg text-center">
                <Loader2 className="mx-auto mb-4 animate-spin" />
                <div className="text-lg font-medium">Signing you in…</div>
                <div className="text-sm text-muted-foreground mt-1">We&apos;re taking you to your dashboard.</div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
