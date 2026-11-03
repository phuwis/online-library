"use client";

import { useState } from "react";
import { ReactReader } from "react-reader";
import { useReadingTracker } from "./use-reading-tracker";

export default function EpubReader({ bookId, url }: { bookId: string; url: string }) {
  const [location, setLocation] = useState<string | number>(0);
  const { setPercent } = useReadingTracker(bookId);

  return (
    <div className="h-[100dvh]">
      <ReactReader
        url={url}
        location={location}
        locationChanged={(loc: string) => setLocation(loc)}
        getRendition={(rendition) => {
          // ต้อง generate locations ก่อนถึงจะได้ค่า percentage
          rendition.book.ready
            .then(() => rendition.book.locations.generate(1000))
            .then(() => {
              rendition.on("relocated", (l: { start?: { percentage?: number } }) => {
                setPercent(l.start?.percentage ?? 0);
              });
            });
        }}
      />
    </div>
  );
}
