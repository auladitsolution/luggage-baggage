import { connectToDatabase } from "@/lib/db/mongodb";
import { Role } from "@/models/Role";
import { User } from "@/models/User";
import { DEFAULT_ROLES } from "@/lib/constants/permissions";
import { RoleSlug } from "@/types/auth";
import { getMockStore } from "@/lib/db/memoryStore";

/**
 * Seed default roles into MongoDB Atlas or In-Memory Mock Store
 */
export async function seedDefaultRoles() {
  const db = await connectToDatabase();
  if (!db) {
    const store = getMockStore();
    return store.roles;
  }

  const results = [];
  for (const slug of Object.keys(DEFAULT_ROLES) as RoleSlug[]) {
    const config = DEFAULT_ROLES[slug];
    const role = await Role.findOneAndUpdate(
      { slug: config.slug },
      {
        name: config.name,
        nameBangla: config.nameBangla,
        slug: config.slug,
        permissions: config.permissions,
        description: config.description,
        isSystem: true,
      },
      { upsert: true, new: true }
    );
    results.push(role);
  }

  return results;
}

/**
 * Provision Initial Store Owner
 * Requires correct setup token from environment variables
 */
export async function provisionInitialOwner(params: {
  firebaseUid: string;
  email: string;
  displayName: string;
  setupToken: string;
}) {
  const expectedToken =
    process.env.INITIAL_OWNER_SETUP_TOKEN ||
    "lumina_secure_owner_setup_token_change_in_production_2026";

  if (!expectedToken || params.setupToken !== expectedToken) {
    throw new Error("ভুল সেটআপ টোকেন! স্টোর ওনার তৈরি করার অনুমতি নেই।");
  }

  const db = await connectToDatabase();
  if (!db) {
    const store = getMockStore();
    const ownerRole = store.roles.find((r) => r.slug === "owner")!;
    let user = store.users.find((u) => u.firebaseUid === params.firebaseUid);
    if (!user) {
      user = {
        _id: `mock-owner-${Date.now()}`,
        firebaseUid: params.firebaseUid,
        email: params.email.toLowerCase(),
        displayName: params.displayName,
        roleId: ownerRole,
        isActive: true,
        isOwner: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.users.push(user);
    } else {
      user.isOwner = true;
      user.roleId = ownerRole;
      user.isActive = true;
      user.lastLoginAt = new Date();
    }
    return user;
  }

  await seedDefaultRoles();

  const ownerRole = await Role.findOne({ slug: "owner" });
  if (!ownerRole) {
    throw new Error("ওনার রোল খুঁজে পাওয়া যায়নি।");
  }

  const user = await User.findOneAndUpdate(
    { firebaseUid: params.firebaseUid },
    {
      firebaseUid: params.firebaseUid,
      email: params.email.toLowerCase(),
      displayName: params.displayName,
      roleId: ownerRole._id,
      isActive: true,
      isOwner: true,
      lastLoginAt: new Date(),
    },
    { upsert: true, new: true }
  ).populate("roleId");

  return user;
}
