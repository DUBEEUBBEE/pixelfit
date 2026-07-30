"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { publicPath } from "@/config/brand";
import { getSampleGallery } from "@/config/samples";
import styles from "./SampleGallery.module.css";

export function SampleGallery({ toolId }: { toolId: string }) {
  const gallery = getSampleGallery(toolId);
  const galleryRef = useRef<HTMLElement>(null);
  const [shouldLoadImages, setShouldLoadImages] = useState(false);

  useEffect(() => {
    const element = galleryRef.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setShouldLoadImages(true);
      observer.disconnect();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (!gallery) return null;
  const headingId = `${gallery.toolId}-sample-gallery-title`;

  return (
    <section ref={galleryRef} className={styles.gallery} aria-labelledby={headingId}>
      <div className={styles.heading}>
        <span className="eyebrow">{gallery.eyebrow}</span>
        <h2 id={headingId}>{gallery.heading}</h2>
        <p>{gallery.description}</p>
        {!shouldLoadImages && (
          <button className={styles.loadButton} type="button" onClick={() => setShouldLoadImages(true)}>
            샘플 이미지 불러오기
          </button>
        )}
      </div>
      <div className={styles.grid}>
        {gallery.items.map((item) => (
          <figure className={styles.card} key={item.id}>
            <div className={styles.media}>
              {shouldLoadImages ? (
                item.thumbnailSrc ? (
                  <a
                    className={styles.previewLink}
                    href={publicPath(item.src)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${item.title} 원본 크기로 새 창에서 보기`}
                  >
                    <Image
                      src={publicPath(item.thumbnailSrc)}
                      alt={item.alt}
                      width={item.thumbnailWidth}
                      height={item.thumbnailHeight}
                      loading="lazy"
                      decoding="async"
                      unoptimized
                    />
                    <span>원본 크기로 보기</span>
                  </a>
                ) : (
                  <Image
                    src={publicPath(item.src)}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                    decoding="async"
                    unoptimized
                  />
                )
              ) : (
                <span className={styles.placeholder} aria-hidden="true">샘플 이미지</span>
              )}
            </div>
            <figcaption className={styles.caption}>
              <strong>{item.title}</strong>
              <span>{item.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
