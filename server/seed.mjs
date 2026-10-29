import { getAuth, getFirestore } from "./admin.mjs";

export async function seedInitialAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;

  const auth = getAuth();
  const user = await auth.getUserByEmail(email).catch(async (error) => {
    if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
      return auth.createUser({ email, password });
    }
    throw error;
  });
  if (user.uid) await auth.updateUser(user.uid, { email, password });
  await getFirestore().doc(`staff/${user.uid}`).set({ email, role: "admin", active: true });
  console.log(`Usuario inicial listo: ${email}`);
}
