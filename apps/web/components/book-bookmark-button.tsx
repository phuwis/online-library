"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

export function BookBookmarkButton({ slug }: { slug: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bookmarked_slugs");
    if (saved) {
      try {
        const slugs: string[] = JSON.parse(saved);
        setIsBookmarked(slugs.includes(slug));
      } catch (e) {
        console.error(e);
      }
    }
  }, [slug]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const saved = localStorage.getItem("bookmarked_slugs");
    let slugs: string[] = saved ? JSON.parse(saved) : [];

    if (slugs.includes(slug)) {
      slugs = slugs.filter((s) => s !== slug);
      setIsBookmarked(false);
    } else {
      slugs.push(slug);
      setIsBookmarked(true);
    }

    localStorage.setItem("bookmarked_slugs", JSON.stringify(slugs));
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      className="absolute top-2 left-3 z-20 p-1.5 hover:scale-110 transition-transform bg-background/60 backdrop-blur-sm rounded-full shadow-md"
      title={isBookmarked ? "เอาบุ๊กมาร์กออก" : "เพิ่มบุ๊กมาร์ก"}
    >
      <Bookmark
        className={`size-6 ${
          isBookmarked
            ? "text-yellow-500 fill-yellow-500"
            : "text-muted-foreground hover:text-yellow-500"
        }`}
      />
    </button>
  );
}
