import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Employee } from "@/models/Employee";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("payroll.read");
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const emp = (store.employees || []).find((e) => e._id === id);
      if (!emp) {
        return NextResponse.json({ error: "কর্মচারী পাওয়া যায়নি" }, { status: 404 });
      }
      return NextResponse.json({ success: true, employee: emp });
    }

    const employee = await Employee.findById(id).lean();
    if (!employee) {
      return NextResponse.json({ error: "কর্মচারী পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "কর্মচারীর বিবরণ লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("payroll.manage");
    const { id } = await params;
    const body = await req.json();

    const {
      name,
      phone,
      email,
      designation,
      nidNumber,
      address,
      basicSalaryPoisha,
      allowancePoisha,
      bankOrWalletDetails,
      status,
    } = body;

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const emp = (store.employees || []).find((e) => e._id === id);
      if (!emp) {
        return NextResponse.json({ error: "কর্মচারী পাওয়া যায়নি" }, { status: 404 });
      }

      if (name) emp.name = name.trim();
      if (phone) emp.phone = phone.trim();
      if (email !== undefined) emp.email = email.trim();
      if (designation) emp.designation = designation.trim();
      if (nidNumber !== undefined) emp.nidNumber = nidNumber.trim();
      if (address !== undefined) emp.address = address.trim();
      if (basicSalaryPoisha !== undefined) emp.basicSalaryPoisha = Math.round(basicSalaryPoisha);
      if (allowancePoisha !== undefined) emp.allowancePoisha = Math.round(allowancePoisha);
      if (bankOrWalletDetails !== undefined) emp.bankOrWalletDetails = bankOrWalletDetails.trim();
      if (status) emp.status = status;
      emp.updatedAt = new Date();

      return NextResponse.json({ success: true, message: "কর্মচারীর তথ্য আপডেট হয়েছে", employee: emp });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "কর্মচারী পাওয়া যায়নি" }, { status: 404 });
    }

    if (name) employee.name = name.trim();
    if (phone) employee.phone = phone.trim();
    if (email !== undefined) employee.email = email.trim();
    if (designation) employee.designation = designation.trim();
    if (nidNumber !== undefined) employee.nidNumber = nidNumber.trim();
    if (address !== undefined) employee.address = address.trim();
    if (basicSalaryPoisha !== undefined) employee.basicSalaryPoisha = Math.round(basicSalaryPoisha);
    if (allowancePoisha !== undefined) employee.allowancePoisha = Math.round(allowancePoisha);
    if (bankOrWalletDetails !== undefined) employee.bankOrWalletDetails = bankOrWalletDetails.trim();
    if (status) employee.status = status;

    await employee.save();
    return NextResponse.json({ success: true, message: "কর্মচারীর তথ্য আপডেট হয়েছে", employee });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "কর্মচারীর তথ্য আপডেট করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

