import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Role } from "@/models/Role";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  try {
    // Enforce deny-by-default server permission
    await requirePermission("users.manage");
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      return NextResponse.json({
        success: true,
        users: store.users,
        roles: store.roles,
      });
    }

    const users = await User.find({})
      .populate("roleId")
      .select("-passwordHash -__v")
      .sort({ createdAt: -1 });

    const roles = await Role.find({}).sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      users,
      roles,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ইউজার তালিকা দেখার অনুমতি নেই।" },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentSession = await requirePermission("users.manage");
    const { displayName, email, username, password, roleId, phone } = await req.json();

    if (!displayName || !displayName.trim()) {
      return NextResponse.json({ error: "কর্মীর পূর্ণ নাম দেওয়া আবশ্যক।" }, { status: 400 });
    }

    if (!roleId) {
      return NextResponse.json({ error: "একটি দায়িত্ব/রোল নির্বাচন করা আবশ্যক।" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "কমপক্ষে ৬ অক্ষরের একটি শক্তিশালী পাসওয়ার্ড দিন।" }, { status: 400 });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    const cleanUsername = username ? username.trim().toLowerCase() : undefined;

    if (!cleanEmail && !cleanUsername) {
      return NextResponse.json(
        { error: "কর্মীর লগইনের জন্য ই-মেইল অথবা ইউজার আইডি দিতে হবে।" },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      // Check duplicate
      const exists = store.users.some(
        (u) =>
          (cleanEmail && u.email?.toLowerCase() === cleanEmail) ||
          (cleanUsername && (u as any).username?.toLowerCase() === cleanUsername)
      );

      if (exists) {
        return NextResponse.json(
          { error: "এই ই-মেইল বা ইউজার আইডি দিয়ে ইতিমধ্যে একজন ব্যবহারকারী নিবন্ধিত রয়েছে।" },
          { status: 400 }
        );
      }

      const role = store.roles.find((r) => r._id === roleId);
      if (!role) {
        return NextResponse.json({ error: "নির্বাচিত রোলটি সঠিক নয়।" }, { status: 400 });
      }

      const newUser: any = {
        _id: "usr-" + Date.now(),
        firebaseUid: "uid-" + Date.now(),
        email: cleanEmail,
        username: cleanUsername,
        passwordHash,
        displayName: displayName.trim(),
        phone: phone?.trim(),
        roleId: role,
        isActive: true,
        isOwner: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.users.unshift(newUser);

      return NextResponse.json({
        success: true,
        message: "নতুন কর্মী সফলভাবে সিস্টেমে যুক্ত করা হয়েছে।",
        user: newUser,
      });
    }

    // MongoDB duplicate check
    const duplicateQuery: any[] = [];
    if (cleanEmail) duplicateQuery.push({ email: cleanEmail });
    if (cleanUsername) duplicateQuery.push({ username: cleanUsername });

    const existingUser = await User.findOne({ $or: duplicateQuery });
    if (existingUser) {
      return NextResponse.json(
        { error: "এই ই-মেইল বা ইউজার আইডি দিয়ে ইতিমধ্যে একজন ব্যবহারকারী নিবন্ধিত রয়েছে।" },
        { status: 400 }
      );
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json({ error: "নির্বাচিত রোলটি সিস্টেমে খুঁজে পাওয়া যায়নি।" }, { status: 400 });
    }

    const createdUser = await User.create({
      displayName: displayName.trim(),
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      phone: phone?.trim(),
      roleId: role._id,
      isActive: true,
      isOwner: false,
      firebaseUid: `uid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    });

    const populatedUser = await User.findById(createdUser._id)
      .populate("roleId")
      .select("-passwordHash -__v");

    return NextResponse.json({
      success: true,
      message: "নতুন কর্মী সফলভাবে যুক্ত করা হয়েছে।",
      user: populatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "নতুন কর্মী যুক্ত করার অনুমতি নেই।" },
      { status: 403 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentSession = await requirePermission("users.manage");
    const { userId, roleId, isActive, newPassword, displayName, phone } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "ইউজার আইডি আবশ্যক।" }, { status: 400 });
    }

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const targetUser = store.users.find((u) => u._id === userId);
      if (!targetUser) {
        return NextResponse.json({ error: "ইউজার খুঁজে পাওয়া যায়নি।" }, { status: 404 });
      }

      if (targetUser.isOwner && !currentSession.isOwner) {
        return NextResponse.json(
          { error: "স্টোর ওনারের তথ্য পরিবর্তন করার ক্ষমতা কেবল ওনারের রয়েছে।" },
          { status: 403 }
        );
      }

      if (roleId) {
        const role = store.roles.find((r) => r._id === roleId);
        if (!role) {
          return NextResponse.json({ error: "অবৈধ রোল আইডি।" }, { status: 400 });
        }
        targetUser.roleId = role;
      }

      if (typeof isActive === "boolean") {
        targetUser.isActive = isActive;
      }

      if (newPassword && newPassword.length >= 6) {
        targetUser.passwordHash = hashPassword(newPassword);
      }

      if (displayName) targetUser.displayName = displayName.trim();
      if (phone !== undefined) targetUser.phone = phone?.trim();

      targetUser.updatedAt = new Date();

      return NextResponse.json({
        success: true,
        message: "ইউজারের তথ্য সফলভাবে আপডেট করা হয়েছে।",
        user: targetUser,
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "ইউজার খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    // Protection: Prevent demoting or disabling the store owner
    if (targetUser.isOwner && !currentSession.isOwner) {
      return NextResponse.json(
        { error: "স্টোর ওনারের তথ্য পরিবর্তন করার ক্ষমতা কেবল ওনারের রয়েছে।" },
        { status: 403 }
      );
    }

    if (roleId) {
      const roleExists = await Role.findById(roleId);
      if (!roleExists) {
        return NextResponse.json({ error: "অবৈধ রোল আইডি।" }, { status: 400 });
      }
      targetUser.roleId = roleId;
    }

    if (typeof isActive === "boolean") {
      targetUser.isActive = isActive;
    }

    if (newPassword && newPassword.trim().length >= 6) {
      targetUser.passwordHash = hashPassword(newPassword.trim());
    }

    if (displayName) {
      targetUser.displayName = displayName.trim();
    }

    if (phone !== undefined) {
      targetUser.phone = phone?.trim();
    }

    await targetUser.save();
    const updated = await User.findById(userId)
      .populate("roleId")
      .select("-passwordHash -__v");

    return NextResponse.json({
      success: true,
      message: "ইউজারের তথ্য সফলভাবে আপডেট করা হয়েছে।",
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ইউজার আপডেট করার অনুমতি নেই।" },
      { status: 403 }
    );
  }
}
