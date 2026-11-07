import Image from "next/image";
import { photo } from "@/lib/photos";

/** A cropped, rounded photo. Parent sets the size; the image fills it. */
export default function Photo({
  id,
  alt,
  className = "",
  priority,
  sizes = "(max-width: 448px) 100vw, 448px",
  children,
}: {
  id: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden bg-line ${className}`}>
      <Image src={photo(id)} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      {children}
    </div>
  );
}
