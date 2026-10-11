/**
 * Formats a raw image URL string into a fully qualified URL for rendering in img src.
 */
export const formatImageUrl = (url?: string | null): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    if (trimmed.startsWith('/api/')) {
        return `http://localhost:8888${trimmed}`;
    }
    if (trimmed.startsWith('/uploads/')) {
        return `http://localhost:8888/api${trimmed}`;
    }
    if (trimmed.startsWith('uploads/')) {
        return `http://localhost:8888/api/${trimmed}`;
    }
    const filename = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;
    return `http://localhost:8888/api/uploads/${filename}`;
};

/**
 * Handles image load errors by hiding broken img tags or displaying placeholder icons.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    if (target.nextSibling && target.nextSibling instanceof HTMLElement) {
        target.nextSibling.style.display = 'inline-block';
    }
};
