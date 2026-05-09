import React, { useState } from 'react';
import { FiImage } from 'react-icons/fi';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallback?: React.ReactNode;
}

/**
 * A robust image component with error handling, lazy loading, and fallback UI.
 */
export const SafeImage: React.FC<SafeImageProps> = ({ 
    src, 
    alt, 
    className, 
    fallback,
    ...props 
}) => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    const handleError = () => {
        if (!error) {
            console.warn(`⚠️ Failed to load image: ${src}`);
            setError(true);
        }
    };

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-300 ${className}`}>
                {fallback || <FiImage size={24} />}
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {loading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <FiImage className="text-gray-200" size={24} />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onError={handleError}
                onLoad={() => setLoading(false)}
                className={`w-full h-full object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
                {...props}
            />
        </div>
    );
};

export default SafeImage;
