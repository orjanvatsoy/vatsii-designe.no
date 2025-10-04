import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!file || !title) {
    return NextResponse.json(
      { error: "Missing file or title" },
      { status: 400 }
    );
  }

  // Upload image to Supabase Storage
  const fileName = `${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("carousel")
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL (for preview, but you will use signed URL for display)
  const image_url = `${supabaseUrl}/storage/v1/object/public/carousel/${fileName}`;

  // Insert metadata into DB
  const { data: dbData, error: dbError } = await supabase
    .from("carousel_images")
    .insert([{ image_url, title, description }]);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, image_url });
}
