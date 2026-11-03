import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Role } from "@/models/Role";
import { seedDefaultRoles } from "@/lib/rbac/seed";
import { hashPassword } from "@/lib/auth/password";
import { getMockStore } from "@/lib/db/memoryStore";

export const OWNER_CONFIG = {
  name: "Md. Sohel Sikder & Md. Alam",
  email: "luggage.baggage26@gmail.com",
  defaultPassword: "@24272920",
  firebaseUid: "owner-luggage-baggage-official",
};

/**
 * Ensures the official Store Owner is provisioned with all permissions and password
 */
export async function ensureOwnerConfigured(): Promise<void> {
  const db = await connectToDatabase();
  const passwordHash = hashPassword(OWNER_CONFIG.defaultPassword);

  if (!db) {
    const store = getMockStore();
    const ownerRole = store.roles.find((r) => r.slug === "owner");
    if (!ownerRole) return;

    let owner = store.users.find(
      (u) => u.email === OWNER_CONFIG.email || u.isOwner === true
    );

    if (!owner) {
      owner = {
        _id: "mock-official-owner-001",
        firebaseUid: OWNER_CONFIG.firebaseUid,
        email: OWNER_CONFIG.email,
        displayName: OWNER_CONFIG.name,
        passwordHash,
        roleId: ownerRole,
        isActive: true,
        isOwner: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.users.unshift(owner);
    } else {
      owner.displayName = OWNER_CONFIG.name;
      owner.email = OWNER_CONFIG.email;
      owner.passwordHash = passwordHash;
      owner.roleId = ownerRole;
      owner.isOwner = true;
      owner.isActive = true;
    }
    return;
  }

  try {
    await seedDefaultRoles();
    const ownerRole = await Role.findOne({ slug: "owner" });
    if (!ownerRole) return;

    let owner = await User.findOne({
      $or: [
        { email: OWNER_CONFIG.email },
        { firebaseUid: OWNER_CONFIG.firebaseUid },
        { isOwner: true },
      ],
    });

    if (!owner) {
      await User.create({
        firebaseUid: OWNER_CONFIG.firebaseUid,
        email: OWNER_CONFIG.email,
        displayName: OWNER_CONFIG.name,
        passwordHash,
        roleId: ownerRole._id,
        isActive: true,
        isOwner: true,
        lastLoginAt: new Date(),
      });
    } else {
      owner.displayName = OWNER_CONFIG.name;
      owner.email = OWNER_CONFIG.email;
      owner.passwordHash = passwordHash;
      owner.roleId = ownerRole._id as any;
      owner.isOwner = true;
      owner.isActive = true;
      await owner.save();
    }
  } catch (error) {
    console.error("Error ensuring store owner is provisioned:", error);
  }
}
