'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { getOptimizedImageUrl, getBlurPlaceholderUrl, isCloudinaryUrl, ImageTransformOptions } from '@/lib/cloudinary/client';

export interface CloudinaryImageProps extends Omit<ImageProps, 'src'> {
  src: string | undefined | null;
  transformOptions?: ImageTransformOptions;
  enableBlurPlaceholder?: boolean;
}

/**
 * High-performance, auto-optimized Cloudinary Image component for Nothingness.
 * Automatically injects WebP/AVIF formatting, responsive sizing, quality auto-tuning,
 * and low-quality blur placeholders (LQIP) to maximize Core Web Vitals and LCP scores.
 */
export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  transformOptions,
  enableBlurPlaceholder = true,
  className = '',
  priority = false,
  fill = false,
  sizes,
  ...restProps
}: CloudinaryImageProps) {
  if (!src) {
    return null;
  }

  // Derive width/height options
  const targetWidth = typeof width === 'number' ? width : transformOptions?.width;
  const targetHeight = typeof height === 'number' ? height : transformOptions?.height;

  // Auto-generate optimized URL
  const optimizedSrc = getOptimizedImageUrl(src, {
    width: targetWidth,
    height: targetHeight,
    quality: 'auto',
    format: 'auto',
    crop: transformOptions?.crop || 'fill',
    ...transformOptions,
  });

  const isCld = isCloudinaryUrl(src) || isCloudinaryUrl(optimizedSrc);
  const blurUrl = isCld && enableBlurPlaceholder && !priority ? getBlurPlaceholderUrl(src) : undefined;

  return (
    <Image
      src={optimizedSrc}
      alt={alt || 'Nothingness sanctuary media'}
      width={fill ? undefined : (width || 800)}
      height={fill ? undefined : (height || 600)}
      fill={fill}
      priority={priority}
      sizes={sizes || (fill ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined)}
      className={className}
      placeholder={blurUrl ? 'blur' : undefined}
      blurDataURL={blurUrl}
      {...restProps}
    />
  );
}
