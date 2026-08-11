import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { signImageUrl } from "../../lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  // Fetch all carousel images
  const data = await prisma.carouselImage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const images = await Promise.all(
    data.map(async (image) => ({
      id: image.id.toString(),
      image_url: image.imageUrl,
      title: image.title,
      description: image.description,
      created_at: image.createdAt,
      signed_url: await signImageUrl(image.imageUrl, "carousel"),
      signed_url_error: null,
    })),
  );

  return NextResponse.json(images);
}
