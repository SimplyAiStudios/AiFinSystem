
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon, FileIcon } from './icons';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, onFilesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = Array.from(e.target.files || []);
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
        ${isDragging ? 'border-teal-500 bg-teal-50/50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        multiple
        disabled={disabled}
      />
      <label htmlFor="file-upload" className={`flex flex-col items-center justify-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <UploadCloudIcon className={`h-16 w-16 mb-4 ${isDragging ? 'text-teal-600' : 'text-slate-400'}`} />
        <p className="text-xl font-bold text-slate-700">
          Upload one or more statements
        </p>
        <p className="text-slate-500 mt-1 font-medium">Drag & drop multiple PDF or image files here</p>
        <p className="text-xs text-slate-400 mt-6 bg-slate-200/50 px-3 py-1 rounded-full">Supports PDF, JPG, PNG • Batch extraction enabled</p>
      </label>
    </div>
  );
};

export default FileUpload;
