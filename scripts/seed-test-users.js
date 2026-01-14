/**
 * Seeds test users in Firebase Auth Emulator
 * Run this after starting emulators: node scripts/seed-test-users.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, doc, setDoc } = require('firebase/firestore');

// Initialize Firebase with dummy config (emulator doesn't validate)
const app = initializeApp({
  apiKey: 'demo-key',
  projectId: 'coursewise-f2421',
});

const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
connectFirestoreEmulator(db, 'localhost', 8080);

const testUsers = [
  {
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    displayName: 'Test Student',
  },
  {
    email: 'teacher@test.com',
    password: 'password123',
    role: 'teacher',
    displayName: 'Test Teacher',
  },
];

async function seedUsers() {
  console.log('Seeding test users in Auth emulator...\n');

  for (const user of testUsers) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );

      console.log(`✓ Created auth user: ${user.email} (${userCredential.user.uid})`);

      // Create profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        department: 'Test Department',
        courses: ['test-course-101'],
        profileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✓ Created Firestore profile for ${user.email}\n`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠ User ${user.email} already exists\n`);
      } else {
        console.error(`✗ Error creating ${user.email}:`, error.message, '\n');
      }
    }
  }

  console.log('Done! Test users:');
  console.log('  Student: student@test.com / password123');
  console.log('  Teacher: teacher@test.com / password123');
  process.exit(0);
}

seedUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
