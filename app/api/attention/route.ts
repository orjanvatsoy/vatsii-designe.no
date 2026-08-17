import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/requireUser";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.user.id;
  const customerEmail = authResult.user.email?.trim().toLowerCase();
  if (customerEmail) {
    await prisma.placeCardOrder.updateMany({
      where: {
        userId: null,
        customerEmail: { equals: customerEmail, mode: "insensitive" },
      },
      data: { userId },
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const customerAttentionCount = await prisma.orderMessage.count({
    where: {
      senderRole: "admin",
      customerReadAt: null,
      order: { userId },
    },
  });

  const adminAttentionCount =
    profile?.role === "King"
      ? await prisma.placeCardOrder.count({
          where: {
            archivedAt: null,
            OR: [
              { status: "new" },
              {
                messages: {
                  some: { senderRole: "customer", adminReadAt: null },
                },
              },
            ],
          },
        })
      : 0;

  return NextResponse.json({
    role: profile?.role ?? "",
    customerAttentionCount,
    adminAttentionCount,
  });
}
