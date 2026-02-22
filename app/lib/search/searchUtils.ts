export const categoryLabels: Record<string, string> = {
  furniture: "Furniture",
  subleases: "Subleases",
  tech: "Tech",
  vehicles: "Vehicles",
  textbooks: "Textbooks",
  clothing: "Clothing",
  kitchen: "Kitchen",
  other: "Other",
};

export const formatCategory = (value?: string | null) => {
  if (!value) return "";
  const key = value.toLowerCase();
  return categoryLabels[key] || value;
};

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "without",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "at",
  "from",
  "your",
  "new",
  "used",
  "like",
  "this",
  "that",
]);

const normalizeTerm = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (value: string) =>
  value.replace(/\b\w/g, (char) => char.toUpperCase());

type ListingSearchSource = {
  title?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

export const derivePopularSearches = (
  listings: ListingSearchSource[],
  maxResults = 8
) => {
  const counts = new Map<string, { count: number; label: string }>();

  const addTerm = (raw: string, weight: number, label?: string) => {
    const normalized = normalizeTerm(raw);
    if (!normalized) return;
    const existing = counts.get(normalized);
    if (existing) {
      existing.count += weight;
      return;
    }
    counts.set(normalized, {
      count: weight,
      label: label || titleCase(normalized),
    });
  };

  listings.forEach((listing) => {
    if (listing.category) {
      const label = formatCategory(listing.category);
      if (label) addTerm(label, 6, label);
    }

    if (Array.isArray(listing.tags)) {
      listing.tags.forEach((tag) => {
        if (!tag) return;
        const cleaned = tag.replace(/^#/, "");
        addTerm(cleaned, 4);
      });
    }

    if (listing.title) {
      const normalizedTitle = normalizeTerm(listing.title);
      if (!normalizedTitle) return;
      normalizedTitle.split(" ").forEach((token) => {
        if (token.length < 3 || stopWords.has(token)) return;
        addTerm(token, 2);
      });
    }
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map((entry) => entry.label)
    .slice(0, maxResults);
};
