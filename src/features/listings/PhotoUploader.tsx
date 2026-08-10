import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../lib/supabase';
import { stripExif, validateImageMagicBytes } from '../../utils/imageUtils';
import { Camera, Image as ImageIcon, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export interface PhotoItem {
 id: string;
 file?: File;
 previewUrl: string;
 storagePath?: string;
 progress: number;
 error?: string;
}

export interface PhotoUploaderProps {
 userId: string;
 listingId: string;
 photos: PhotoItem[];
 onChange: (photos: PhotoItem[]) => void;
}

async function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file as Data URL'));
    reader.readAsDataURL(file);
  });
}

async function uploadToSupabase(file: Blob, userId: string, listingId: string, photoId: string): Promise<string> {
 const path = `${userId}/${listingId}/${photoId}.webp`;
 const { data, error } = await supabase.storage.from('listing-photos').upload(path, file, {
 contentType: 'image/webp',
 upsert: true,
 });

 if (error) {
 throw new Error(error.message);
 }

 return data.path;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
 userId,
 listingId,
 photos,
 onChange,
}) => {
 const [isCompressing, setIsCompressing] = useState<boolean>(false);
 const cameraInputRef = useRef<HTMLInputElement>(null);
 const galleryInputRef = useRef<HTMLInputElement>(null);
 const photosRef = useRef<PhotoItem[]>(photos);
 React.useEffect(() => {
 photosRef.current = photos;
 }, [photos]);

 const updatePhotoState = (photoId: string, changes: Partial<PhotoItem>) => {
 photosRef.current = photosRef.current.map((p) =>
 p.id === photoId ? { ...p, ...changes } : p
 );
 onChange([...photosRef.current]);
 };

 const processAndUploadFile = async (file: File, photoId: string) => {
 let safePreviewUrl = '';
 try {
 // 1. Validate magic bytes to ensure it's a real image (P1 fix)
 const isValid = await validateImageMagicBytes(file);
 if (!isValid) {
 throw new Error('Invalid image file format');
 }

 // 2. Strip EXIF and convert to WebP using Canvas (P1 privacy fix)
 const safeFile = await stripExif(file);

 // 3. Compress image if it's too large
 let compressedFile: File | Blob = safeFile;
 try {
 const options = {
 maxSizeMB: 1.5,
 maxWidthOrHeight: 1600,
 useWebWorker: true,
 fileType: 'image/webp',
 };
 compressedFile = await imageCompression(safeFile, options);
 } catch (cErr) {
 console.warn('Image compression fallback to raw file:', cErr);
 }

  // Update progress to 50% and fix preview URL for mobile
  safePreviewUrl = await fileToDataURL(compressedFile);
  updatePhotoState(photoId, { progress: 50, error: undefined, previewUrl: safePreviewUrl });

 // 4. Upload to Supabase Storage
 const finalPath = await uploadToSupabase(compressedFile, userId, listingId, photoId);

 // 5. Success - update state with finalPath
 updatePhotoState(photoId, { storagePath: finalPath, progress: 100, error: undefined, previewUrl: safePreviewUrl });
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Processing failed';
 updatePhotoState(photoId, { progress: 0, error: msg, ...(safePreviewUrl ? { previewUrl: safePreviewUrl } : {}) });
 }
 };

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.target.files || []);
 if (!files.length) return;

 const availableSlots = 4 - photosRef.current.length;
 const selectedFiles = files.slice(0, availableSlots);

 setIsCompressing(true);

  const newPhotos: PhotoItem[] = await Promise.all(
    selectedFiles.map(async (file, idx) => {
      const id = `${Date.now()}_${idx}`;
      let previewUrl = '';
      try {
        previewUrl = await fileToDataURL(file);
      } catch (err) {
        console.warn('Failed to generate preview URL', err);
      }
      return {
        id,
        file,
        previewUrl,
        progress: 10,
      };
    })
  );

 photosRef.current = [...photosRef.current, ...newPhotos];
 onChange([...photosRef.current]);

 // Process each new photo independently without awaiting in loop
 // so they process concurrently and don't block the UI
 newPhotos.forEach((photo) => {
 if (photo.file) {
 processAndUploadFile(photo.file, photo.id);
 }
 });

 setIsCompressing(false);
 e.target.value = '';
 };

 const handleRetry = async (photo: PhotoItem) => {
 if (!photo.file) return;
 updatePhotoState(photo.id, { progress: 10, error: undefined });
 processAndUploadFile(photo.file, photo.id);
 };

 const handleRemove = async (id: string) => {
 const target = photosRef.current.find((p) => p.id === id);
 if (target?.storagePath) {
 supabase.storage.from('listing-photos').remove([target.storagePath]).catch(console.error);
 }
 photosRef.current = photosRef.current.filter((p) => p.id !== id);
 onChange([...photosRef.current]);
 };

 return (
 <div className="flex flex-col gap-2 text-left">
 <div className="text-sm font-medium text-ink">
 Photos (1–4 images)
 </div>

 {/* Hidden File Inputs */}
 <input
 ref={cameraInputRef}
 type="file"
 accept="image/*"
 capture="environment"
 onChange={handleFileSelect}
 disabled={isCompressing}
 className="hidden"
 />
 <input
 ref={galleryInputRef}
 type="file"
 accept="image/*"
 multiple
 onChange={handleFileSelect}
 disabled={isCompressing}
 className="hidden"
 />

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
 {photos.map((photo, index) => (
 <div
 key={photo.id}
 draggable
 onDragStart={(e) => {
 e.dataTransfer.setData('text/plain', index.toString());
 }}
 onDragOver={(e) => e.preventDefault()}
 onDrop={(e) => {
 e.preventDefault();
 const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
 if (dragIndex === index || isNaN(dragIndex)) return;
 const newPhotos = [...photos];
 const draggedItem = newPhotos.splice(dragIndex, 1)[0];
 if (draggedItem) {
 newPhotos.splice(index, 0, draggedItem);
 onChange(newPhotos);
 }
 }}
 className="relative aspect-[4/5] rounded-xl bg-surface-2 border border-line overflow-hidden group cursor-move"
 >
 <img src={photo.previewUrl} alt="Preview" className="w-full h-full object-cover" />

 {/* Remove Button */}
 <button
 type="button"
 onClick={() => handleRemove(photo.id)}
 className="absolute top-1.5 right-1.5 w-6 h-6 rounded bg-ink/70 text-white flex items-center justify-center hover:bg-danger transition-colors z-10"
 aria-label="Remove photo"
 >
 <X className="w-3.5 h-3.5" />
 </button>

 {/* Upload Progress Overlay */}
 {photo.progress < 100 && !photo.error && (
 <div aria-live="polite" aria-atomic="true" className="absolute inset-0 bg-ink/40  flex flex-col items-center justify-center text-white">
 <Loader2 className="w-5 h-5 animate-spin mb-1" aria-hidden="true" />
 <span className="text-[10px] font-medium">Uploading: {photo.progress}%</span>
 </div>
 )}

 {/* Upload Error Overlay & Retry */}
 {photo.error && (
 <div aria-live="assertive" aria-atomic="true" className="absolute inset-0 bg-danger/80 p-2 flex flex-col items-center justify-center text-white text-center">
 <AlertCircle className="w-5 h-5 text-danger-wash mb-1" aria-hidden="true" />
 <span className="text-[10px] line-clamp-2 leading-tight mb-1.5">{photo.error}</span>
 {photo.file && (
 <button
 type="button"
 onClick={() => handleRetry(photo)}
 className="px-2 py-0.5 bg-surface/20 hover:bg-surface/30 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
 >
 <RefreshCw className="w-3 h-3" /> Retry
 </button>
 )}
 </div>
 )}
 </div>
 ))}

 {/* Upload Action Card */}
 {photos.length < 4 && (
 <div className="aspect-[4/5] rounded-xl border-2 border-dashed border-line-strong bg-bg flex flex-col items-center justify-center p-2 gap-2 text-subtle">
 <span className="text-[11px] font-semibold text-subtle uppercase tracking-wider mt-2">
 Add Photo
 </span>
 <div className="flex flex-col gap-1.5 w-full px-1">
 <button
 type="button"
 onClick={() => cameraInputRef.current?.click()}
 disabled={isCompressing}
 className="w-full py-1.5 px-1 bg-accent text-white rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-medium hover:bg-accent/90 transition-colors shadow-1"
 title="Take photo with device camera"
 >
 <Camera className="w-3.5 h-3.5" />
 <span>Camera</span>
 </button>
 <button
 type="button"
 onClick={() => galleryInputRef.current?.click()}
 disabled={isCompressing}
 className="w-full py-1.5 px-1 bg-surface-2 text-ink rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-medium hover:bg-line transition-colors shadow-1"
 title="Select photo from library"
 >
 <ImageIcon className="w-3.5 h-3.5 text-ink" />
 <span>Gallery</span>
 </button>
 </div>
 </div>
 )}
 </div>

 <span className="text-xs text-subtle">
 Select Camera to snap directly or Gallery to pick existing images. Images are automatically converted to WebP (≤1600px) with EXIF metadata stripped.
 </span>
 </div>
 );
};

