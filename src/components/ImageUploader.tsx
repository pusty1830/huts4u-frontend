import React, { useCallback, useState, useEffect } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Box, Typography, IconButton, Alert, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

interface ImageUploaderProps {
  label: string;
  onFileSelect: (files: File | File[] | null) => void;
  onRemoveExisting?: (index?: number) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  existingImages?: string | string[] | null;
  disabled?: boolean;
  showPreviews?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  onFileSelect,
  onRemoveExisting,
  multiple = false,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
  existingImages = null,
  disabled = false,
  showPreviews = true,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingPreviews, setExistingPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize existing images
  useEffect(() => {
    if (existingImages) {
      if (Array.isArray(existingImages)) {
        setExistingPreviews(existingImages);
      } else {
        setExistingPreviews([existingImages]);
      }
    } else {
      setExistingPreviews([]);
    }
  }, [existingImages]);

  // Update total previews when files or existing images change
  useEffect(() => {
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    
    // Cleanup URLs when component unmounts or files change
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const totalImages = existingPreviews.length + selectedFiles.length;
  const canUploadMore = multiple ? totalImages < maxFiles : totalImages === 0;

  const handleDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (disabled) return;
      
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errorMsg = rejection.errors[0]?.code === 'file-too-large' 
          ? `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
          : rejection.errors[0]?.code === 'file-invalid-type'
          ? 'Invalid file type. Please upload images only (JPEG, PNG, WEBP)'
          : 'Some files were rejected. Please check size and format.';
        setError(errorMsg);
        return;
      }

      if (!multiple && acceptedFiles.length > 1) {
        setError("Only one file is allowed");
        return;
      }

      if (totalImages + acceptedFiles.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} files. Current: ${totalImages}`);
        return;
      }

      setError(null);
      
      // Add new files to selected files
      const newFiles = [...selectedFiles, ...acceptedFiles];
      setSelectedFiles(newFiles);
      
      // Notify parent about new files
      if (multiple) {
        onFileSelect(newFiles);
      } else {
        onFileSelect(newFiles[0]);
      }
    },
    [onFileSelect, selectedFiles, multiple, maxFiles, totalImages, disabled, maxSize]
  );

  const handleDeleteNewFile = (index: number) => {
    if (disabled) return;
    
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    
    if (multiple) {
      onFileSelect(updatedFiles);
    } else {
      onFileSelect(updatedFiles[0] || null);
    }
  };

  const handleDeleteExisting = (index: number) => {
    if (disabled || !onRemoveExisting) return;
    
    const updatedExisting = [...existingPreviews];
    updatedExisting.splice(index, 1);
    setExistingPreviews(updatedExisting);
    
    onRemoveExisting(index);
  };

  const handleDeleteAll = () => {
    if (disabled) return;
    
    setSelectedFiles([]);
    if (onRemoveExisting) {
      onRemoveExisting();
    }
    if (!multiple) {
      onFileSelect(null);
    } else {
      onFileSelect([]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 
      "image/jpeg": [".jpg", ".jpeg"], 
      "image/png": [".png"], 
      "image/webp": [".webp"],
      "image/gif": [".gif"]
    },
    multiple,
    maxFiles: canUploadMore ? maxFiles - existingPreviews.length : 0,
    maxSize,
    disabled: disabled || !canUploadMore,
  });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Label */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        {label}
      </Typography>
      
      {/* Existing Images Display */}
      {existingPreviews.length > 0 && showPreviews && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="textSecondary" display="block" mb={1}>
            Existing Images:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {existingPreviews.map((src, index) => (
              <Box key={`existing-${index}`} sx={{ position: "relative" }}>
                <img
                  src={src}
                  alt={`existing-${index}`}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: "1px solid #ddd",
                  }}
                />
                {!disabled && onRemoveExisting && (
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      bgcolor: "error.main",
                      color: "white",
                      width: 24,
                      height: 24,
                      '&:hover': { bgcolor: "error.dark" }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteExisting(index);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    textAlign: "center",
                    fontSize: "0.6rem",
                    py: 0.25,
                  }}
                >
                  Existing
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* New Files Display */}
      {previews.length > 0 && showPreviews && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="textSecondary" display="block" mb={1}>
            New Images to Upload:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {previews.map((src, index) => (
              <Box key={`new-${index}`} sx={{ position: "relative" }}>
                <img
                  src={src}
                  alt={`new-${index}`}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: "1px solid #4CAF50",
                  }}
                />
                {!disabled && (
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      bgcolor: "error.main",
                      color: "white",
                      width: 24,
                      height: 24,
                      '&:hover': { bgcolor: "error.dark" }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNewFile(index);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: "rgba(76, 175, 80, 0.8)",
                    color: "white",
                    textAlign: "center",
                    fontSize: "0.6rem",
                    py: 0.25,
                  }}
                >
                  New
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Upload Area */}
      <Box
        {...getRootProps()}
        sx={{
          border: `2px dashed ${disabled ? '#ccc' : canUploadMore ? '#1976d2' : '#ff9800'}`,
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          cursor: disabled || !canUploadMore ? 'default' : 'pointer',
          position: "relative",
          backgroundColor: disabled ? '#f5f5f5' : canUploadMore ? '#e3f2fd' : '#fff3e0',
          opacity: disabled ? 0.7 : 1,
          '&:hover': {
            backgroundColor: disabled || !canUploadMore ? undefined : '#bbdefb',
          }
        }}
      >
        <input {...getInputProps()} />
        
        {canUploadMore ? (
          <>
            <CloudUploadIcon 
              fontSize="large" 
              color={disabled ? "disabled" : "primary"} 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {isDragActive ? "Drop files here..." : `Click or drag to upload ${label}`}
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              {multiple ? `Up to ${maxFiles - totalImages} more files` : "Single file"}, 
              Max {maxSize / (1024 * 1024)}MB each
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              Formats: JPEG, PNG, WEBP, GIF
            </Typography>
          </>
        ) : (
          <>
            <AddPhotoAlternateIcon 
              fontSize="large" 
              color="warning" 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Maximum {maxFiles} files reached
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              Remove some files to upload more
            </Typography>
          </>
        )}
      </Box>

      {/* Status and Error Messages */}
      <Box sx={{ mt: 1 }}>
        {totalImages > 0 && (
          <Typography variant="caption" color="textSecondary">
            Total: {totalImages} image{totalImages !== 1 ? 's' : ''} 
            ({existingPreviews.length} existing, {selectedFiles.length} new)
          </Typography>
        )}
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 1 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
      </Box>

      {/* Clear All Button */}
      {totalImages > 0 && !disabled && (
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteAll}
          sx={{ mt: 1 }}
        >
          Clear All
        </Button>
      )}
    </Box>
  );
};

export default ImageUploader;