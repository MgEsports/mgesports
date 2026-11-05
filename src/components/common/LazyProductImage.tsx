import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";

interface LazyProductImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
}

export const LazyProductImage: React.FC<LazyProductImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className = "max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]",
  width = 800,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const initialUrl = optimizeCloudinaryUrl(src, width);
  const [currentSrc, setCurrentSrc] = useState(initialUrl || fallbackSrc || "");

  const handleError = () => {
    if (!imageError && fallbackSrc && currentSrc !== fallbackSrc) {
      setImageError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Loading Skeleton Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 animate-pulse">
          <Loader2 className="h-6 w-6 text-[#FFBE32]/60 animate-spin" />
        </div>
      )}

      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`${className} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
};
