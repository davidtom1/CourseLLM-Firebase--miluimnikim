// Simple in-memory mock authentication (no Firebase required)

type MockUser = {
  uid: string;
  email: string;
  displayName: string;
  role: "student" | "teacher";
};

type Listener = (user: MockUser | null) => void;

class MockAuthService {
  private currentUser: MockUser | null = null;
  private listeners: Set<Listener> = new Set();

  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: Listener): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.currentUser);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  async signInMock(role: "student" | "teacher"): Promise<MockUser> {
    const uid = `mock-${role}-${Date.now()}`;
    const user: MockUser = {
      uid,
      email: `mock-${role}@example.com`,
      displayName: role === "student" ? "Mock Student" : "Mock Teacher",
      role,
    };

    this.currentUser = user;
    this.notifyListeners();

    // Store user profile in localStorage
    localStorage.setItem(`user-${uid}`, JSON.stringify({
      uid,
      email: user.email,
      displayName: user.displayName,
      role,
      department: "Mock Department",
      courses: ["Mock Course 101"],
      profileComplete: true,
    }));

    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  // Mock Firestore operations
  async getProfile(uid: string): Promise<any | null> {
    const stored = localStorage.getItem(`user-${uid}`);
    return stored ? JSON.parse(stored) : null;
  }

  async setProfile(uid: string, data: any): Promise<void> {
    localStorage.setItem(`user-${uid}`, JSON.stringify(data));
  }
}

export const mockAuth = new MockAuthService();
