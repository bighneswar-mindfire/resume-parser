import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import ErrorAlert from './ErrorAlert';

interface FileItem {
  id: string;
  dbId?: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface BackendResponse {
  message: string;
  data: Array<{
    _id: string;
    fileName: string;
    status: string;
  }>;
}

interface UploadDashboardProps {
  onUploadComplete?: () => void;
}

export default function UploadDashboard({ onUploadComplete }: UploadDashboardProps) {
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dismissError = (index: number) => {
    setErrorMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const validateFile = (file: File): boolean => {
    const allowedExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    return allowedExtensions.includes(fileExtension);
  };

  const handleFilesAdded = (files: FileList) => {
    const newFiles: FileItem[] = [];
    const newErrors: string[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        newFiles.push({
          id: generateId(),
          file,
          status: 'pending',
        });
      } else {
        newErrors.push(`File "${file.name}" is not supported. Please upload PDF, DOCX, or Images.`);
      }
    });

    if (newErrors.length > 0) {
      setErrorMessages((prev) => [...prev, ...newErrors]);
    }

    setFileList((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadFiles = async () => {
    const pendingFiles = fileList.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setFileList((prev) =>
      prev.map((f) => (f.status === 'pending' ? { ...f, status: 'uploading' } : f))
    );

    const formData = new FormData();
    pendingFiles.forEach((fileItem) => {
      formData.append('resumes', fileItem.file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to upload files.');
      }

      const responseData = (await response.json()) as BackendResponse;

      setFileList((prev) =>
        prev.map((f) => {
          if (f.status === 'uploading') {
            const dbRecord = responseData.data.find((doc) => doc.fileName === f.file.name);
            return {
              ...f,
              status: 'success',
              dbId: dbRecord?._id, // Assign Atlas generated ID
            };
          }
          return f;
        })
      );

      onUploadComplete?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setFileList((prev) =>
        prev.map((f) => (f.status === 'uploading' ? { ...f, status: 'error', errorMessage } : f))
      );
    }
  };

  const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 border-gray-200',
    uploading: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="max-w-2xl mx-auto my-10 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <ErrorAlert messages={errorMessages} onDismiss={dismissError} />
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Upload multiple resumes (PDF, DOCX, JPEG, PNG)
      </p>

      {/* Drag drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <span className="text-4xl mb-3">📁</span>
        <p className="text-gray-700 font-medium">
          Drag & drop your files here, or <span className="text-indigo-600 underline">browse</span>
        </p>
        <span className="text-xs text-gray-500 mt-1">Max file size: 10MB</span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept=".pdf,.docx,.png,.jpg,.jpeg"
        />
      </div>

      {/* Selected file list */}
      {fileList.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Selected Files ({fileList.length})
          </h3>
          <ul className="space-y-3">
            {fileList.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {item.file.name}
                  </div>
                  <div className="flex flex-wrap items-center text-xs text-gray-500 mt-1 gap-2">
                    <span>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>•</span>
                    <span
                      className={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${statusStyles[item.status]}`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                    {item.dbId && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 border border-indigo-100 bg-indigo-50 text-indigo-700 text-[9px] font-mono rounded">
                          Doc ID: {item.dbId}
                        </span>
                      </>
                    )}
                  </div>
                  {item.errorMessage && (
                    <div className="text-xs text-red-600 mt-1 font-medium">{item.errorMessage}</div>
                  )}
                </div>
                {item.status === 'pending' && (
                  <button
                    onClick={() => removeFile(item.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>

          {fileList.some((f) => f.status === 'pending') && (
            <button
              onClick={uploadFiles}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Start Parsing Files
            </button>
          )}
        </div>
      )}
    </div>
  );
}
