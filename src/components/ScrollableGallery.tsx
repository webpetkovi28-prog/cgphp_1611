import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Image {
  id: string;
  image_url: string;
  alt_text?: string;
}

interface ScrollableGalleryProps {
  images: Image[];
  currentImageIndex: number;
  onImageSelect: (index: number) => void;
  propertyTitle: string;
}

export const ScrollableGallery: React.FC<ScrollableGalleryProps> = ({
  images: imagesProp,
  currentImageIndex,
  onImageSelect,
  propertyTitle
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Ensure images is always an array
  const images = Array.isArray(imagesProp) ? imagesProp : [];

  // Check for overflow and update arrow visibility
  const checkOverflow = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const hasOverflow = container.scrollWidth > container.clientWidth;
    const isAtStart = container.scrollLeft <= 0;
    const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 1;

    setShowLeftArrow(hasOverflow && !isAtStart);
    setShowRightArrow(hasOverflow && !isAtEnd);
  };

  // Check overflow on mount and when images change
  useEffect(() => {
    checkOverflow();
    
    // Recheck after a slight delay to ensure DOM is updated
    const timer = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timer);
  }, [images]);

  // Add resize listener to recheck overflow
  useEffect(() => {
    const handleResize = () => checkOverflow();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll handlers
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200; // Scroll by ~2.5 thumbnails (80px each + 12px gap)
    scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Handle scroll events to update arrow visibility
  const handleScroll = () => {
    checkOverflow();
  };

  // Handle wheel/trackpad scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollContainerRef.current) return;
    
    // Only handle horizontal scrolling or when shift is held
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      e.preventDefault();
      scrollContainerRef.current.scrollBy({ left: e.deltaX + e.deltaY, behavior: 'smooth' });
    }
  };

  // Handle touch drag for mobile
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setScrollLeftStart(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    scrollContainerRef.current.scrollLeft = scrollLeftStart + diff;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    checkOverflow();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollLeft();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollRight();
    }
  };

  if (images.length <= 1) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-50">
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Scroll left"
            data-testid="gallery-scroll-left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Scroll right"
            data-testid="gallery-scroll-right"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          onScroll={handleScroll}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="listbox"
          aria-label="Property image thumbnails"
          data-testid="gallery-container"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => onImageSelect(index)}
              className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                index === currentImageIndex 
                  ? 'border-blue-500 scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`View image ${index + 1} of ${images.length}`}
              data-testid={`gallery-thumbnail-${index}`}
              role="option"
              aria-selected={index === currentImageIndex}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `${propertyTitle} - Снимка ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder.jpg';
                }}
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};