import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { categoryLabels, formatCategory } from "../../../lib/search/searchUtils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const normalizeTerm = (value: string) =>
  value.toLowerCase().replace(/[(),]/g, " ").trim();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const termRaw = searchParams.get("term") || "";
  const term = normalizeTerm(termRaw);

  if (term.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const safeTerm = term.replace(/\s+/g, " ");

  const { data, error } = await supabase
    .from("listings")
    .select("title, category, location")
    .eq("is_draft", false)
    .neq("is_sold", true)
    .or(`title.ilike.%${safeTerm}%,location.ilike.%${safeTerm}%`)
    .limit(24);

  if (error) {
    return NextResponse.json({ suggestions: [] });
  }

  const titleMatches = new Set<string>();
  const categoryMatches = new Set<string>();
  const locationMatches = new Set<string>();

  (data || []).forEach((item) => {
    if (item.title && item.title.toLowerCase().includes(term)) {
      titleMatches.add(item.title);
    }
    const categoryLabel = formatCategory(item.category);
    if (categoryLabel && categoryLabel.toLowerCase().includes(term)) {
      categoryMatches.add(categoryLabel);
    }
    if (item.location && item.location.toLowerCase().includes(term)) {
      locationMatches.add(item.location);
    }
  });

  const categoryFromInput = Object.values(categoryLabels).filter((label) =>
    label.toLowerCase().includes(term)
  );

  categoryFromInput.forEach((label) => categoryMatches.add(label));

  const suggestions = [
    ...Array.from(titleMatches).map((value) => ({
      value,
      label: value,
      type: "Title",
    })),
    ...Array.from(categoryMatches).map((value) => ({
      value,
      label: value,
      type: "Category",
    })),
    ...Array.from(locationMatches).map((value) => ({
      value,
      label: value,
      type: "Location",
    })),
  ];

  return NextResponse.json({ suggestions: suggestions.slice(0, 12) });
}
