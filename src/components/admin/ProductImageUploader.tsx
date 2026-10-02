import React, { useState, useRef } from 'react';
import {
  ImagePlus, Trash2, Star, ArrowLeft, ArrowRight, RefreshCw,
  AlertCircle, CheckCircle2, UploadCloud, Eye
} from 'lucide-react';
import { api } from '../../services/api';

export interface UploadedImageItem {
  id?: string;
  image_url: string;
  is_primary: number | boolean;
  sort_order: number;
  isUploading?: boolean;
  error?: string;
}

interface ProductImageUploaderProps {
  images: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
  maxImages?: number;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 8
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // Client-side image resizer/compressor to ensure fast mobile uploads
  const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      // If already small or SVG, return as is
      if (file.size < 500 * 1024) {
        resolve(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP or JPEG
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          file.type === 'image/png' ? 'image/png' : 'image/webp',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    setUploadError(null);
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const selectedFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validExtensions.includes(file.type.toLowerCase())) {
        setUploadError(`File "${file.name}" has unsupported format. Only JPG, PNG, and WEBP are allowed.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 10MB limit.`);
        return;
      }
      selectedFiles.push(file);
    }

    if (selectedFiles.length === 0) return;

    if (images.length + selectedFiles.length > maxImages) {
      setUploadError(`You can upload a maximum of ${maxImages} images per product.`);
      return;
    }

    setIsProcessing(true);
    setUploadProgress(15);

    try {
      // Optimize images on client before upload
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        const optimizedBlob = await optimizeImage(selectedFiles[i]);
        const ext = selectedFiles[i].name.split('.').pop() || 'jpg';
        formData.append('images', optimizedBlob, `upload-${Date.now()}-${i}.${ext}`);
      }

      setUploadProgress(50);

      // Perform upload
      const res = await api.uploadImages(formData);
      setUploadProgress(90);

      if (res.success && res.data?.urls) {
        const newUploadedUrls = res.data.urls;
        const currentCount = images.length;
        const newItems: UploadedImageItem[] = newUploadedUrls.map((url, idx) => ({
          image_url: url,
          is_primary: currentCount === 0 && idx === 0 ? 1 : 0,
          sort_order: currentCount + idx
        }));

        onChange([...images, ...newItems]);
        setFailedFiles([]);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 800);
      } else {
        throw new Error(res.message || 'Failed to upload selected images');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Error uploading images. Please retry.');
      setFailedFiles(selectedFiles);
      setUploadProgress(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRetry = () => {
    if (failedFiles.length > 0) {
      handleFilesUpload(failedFiles);
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (replacingIndex === null || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (!validExtensions.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Only JPG, PNG, and WEBP are supported.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);

    try {
      const optimized = await optimizeImage(file);
      const formData = new FormData();
      formData.append('images', optimized, file.name);

      const res = await api.uploadImages(formData);
      if (res.success && res.data?.urls?.[0]) {
        const newUrl = res.data.urls[0];
        const updated = [...images];
        updated[replacingIndex] = {
          ...updated[replacingIndex],
          image_url: newUrl
        };
        onChange(updated);
      } else {
        throw new Error(res.message || 'Failed to replace image');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to replace image');
    } finally {
      setIsProcessing(false);
      setReplacingIndex(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  const setPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index ? 1 : 0
    }));
    onChange(updated);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    // If the removed image was primary and others exist, make the first one primary
    if (updated.length > 0 && !updated.some(img => img.is_primary === 1 || img.is_primary === true)) {
      updated[0].is_primary = 1;
    }
    // Reindex sort_orders
    const reindexed = updated.map((img, idx) => ({
      ...img,
      sort_order: idx
    }));
    onChange(reindexed);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reindexed = updated.map((img, idx) => ({
      ...img,
      sort_order: idx
    }));
    onChange(reindexed);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <label className="block font-bold text-slate-900 text-sm">
            Product Images &amp; Gallery <span className="text-purple-600 font-normal">({images.length}/{maxImages})</span>
          </label>
          <p className="text-[11px] text-slate-500">
            Select high-res photos from device gallery. Formats: JPG, PNG, WEBP (Max 10MB each).
          </p>
        </div>

        {/* Real HTML File Input for Android / Desktop Gallery Picker */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFilesUpload(e.target.files);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || images.length >= maxImages}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Choose Images from Gallery</span>
          </button>
        </div>
      </div>

      {/* Hidden input for Replacing single image */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-1.5 animate-fadeIn">
          <div className="flex justify-between text-xs font-semibold text-purple-900">
            <span className="flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 animate-bounce text-purple-700" />
              Uploading images to secure storage...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-700 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Error Banner & Retry Button */}
      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{uploadError}</p>
            {failedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Upload</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State / Gallery Drop Zone */}
      {images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-purple-400 bg-slate-50/70 hover:bg-purple-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
            <ImagePlus className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-sm">Tap here to choose product images</p>
            <p className="text-xs text-slate-500">
              Open your Android phone gallery, files, or camera to select multiple product photos.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>JPG / JPEG</span> · <span>PNG</span> · <span>WEBP</span> · <span>Max 10MB</span>
          </div>
        </div>
      ) : (
        /* Image Cards Grid with Controls */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => {
            const isCover = img.is_primary === 1 || img.is_primary === true;
            return (
              <div
                key={img.id || `${img.image_url}-${idx}`}
                className={`relative group bg-white border rounded-2xl overflow-hidden shadow-xs transition-all ${
                  isCover ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Thumbnail Image */}
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <img
                    src={img.image_url}
                    alt={`Product preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback placeholder if image load fails
                      (e.target as HTMLImageElement).src = '/src/assets/images/product_embroidered_kurti_1790877397139.jpg';
                    }}
                  />

                  {/* Primary Cover Badge */}
                  {isCover && (
                    <div className="absolute top-2 left-2 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>Cover Image</span>
                    </div>
                  )}

                  {/* Quick Zoom Overlay Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(img.image_url)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View Full Image"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Management Action Bar */}
                <div className="p-2 bg-slate-50 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
                  {/* Set Primary Button */}
                  {!isCover ? (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className="w-full text-center py-1 font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Star className="w-3 h-3" />
                      <span>Set as Cover</span>
                    </button>
                  ) : (
                    <div className="text-center py-1 font-bold text-emerald-700 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Main Display</span>
                    </div>
                  )}

                  {/* Reordering, Replace & Delete Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, 'left')}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => moveImage(idx, 'right')}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingIndex(idx);
                          replaceInputRef.current?.click();
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition-colors"
                        title="Replace Image"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50 transition-colors"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="max-w-2xl max-h-[85vh] bg-white rounded-3xl overflow-hidden p-2 relative shadow-2xl">
            <img
              src={previewModalUrl}
              alt="Enlarged preview"
              className="max-h-[75vh] w-auto mx-auto rounded-2xl object-contain"
            />
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
