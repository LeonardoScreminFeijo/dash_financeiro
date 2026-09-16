import { auth } from "@/auth";
import { getTransactions } from "@/lib/transactions-api";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  return getTransactions(session?.user?.email);
}
