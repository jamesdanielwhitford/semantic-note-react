// src/components/Notes/CreateImageNote.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../../context/NoteContext';
import { useFolders } from '../../context/FolderContext';
import { processImage, generateImageDescription, getDataUrlSize } from '../../services/imageService';
import { ImageIcon, Upload, X, Loader, AlertCircle } from 'lucide-react';

const CreateImageNote = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userDescription, setUserDescription] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [folderId, setFolderId] = useState('');
  const [autoAssign, setAutoAssign] = useState(true);
  
  const fileInputRef = useRef(null);
  const { createNote } = useNotes();
  const { folders } = useFolders();
  const navigate = useNavigate();
  
  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }
    
    setImageFile(file);
    setError('');
    
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };
  
  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Clear selected image
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError('Please select an image');
      return;
    }
    
    setIsProcessing(true);
    setProcessingStatus('Processing image...');
    setError('');
    
    try {
      // Process and resize image
      setProcessingStatus('Resizing image...');
      const { dataUrl, width, height } = await processImage(imageFile);
      
      // Get storage size estimate
      const sizeInBytes = getDataUrlSize(dataUrl);
      const sizeInKB = Math.round(sizeInBytes / 1024);
      
      // Generate AI description
      setProcessingStatus('Analyzing image with AI...');
      const { visibleDescription, aiDescription } = await generateImageDescription(dataUrl, userDescription);
      
      // Create the note
      setProcessingStatus('Saving note...');
      const noteData = {
        type: 'image',
        title: imageFile.name.split('.')[0] || 'Image Note',
        content: visibleDescription,
        imageData: {
          dataUrl,
          width,
          height,
          originalName: imageFile.name,
          sizeKB: sizeInKB,
          aiDescription
        },
        folderId: autoAssign ? null : (folderId ? parseInt(folderId) : null)
      };
      
      const newNote = await createNote(noteData);
      navigate(`/notes/${newNote.id}`);
    } catch (err) {
      console.error('Error creating image note:', err);
      setError(err.message || 'Failed to create image note');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Create Image Note</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Image Upload Area */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Image*
          </label>
          
          {!imagePreview ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              <ImageIcon size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Drag and drop an image here, or click to select</p>
              <p className="text-xs text-gray-400">
                Supports: JPG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>
          ) : (
            <div className="relative border rounded-lg overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-96 mx-auto"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        
        {/* Description Field */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Add a description to help organize this image"
          />
          <p className="text-sm text-gray-500 mt-1">
            AI will analyze the image to generate additional details for better organization
          </p>
        </div>
        
        {/* Folder Assignment */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <label className="flex items-center text-gray-700">
              <input
                type="checkbox"
                checked={autoAssign}
                onChange={() => setAutoAssign(!autoAssign)}
                className="mr-2"
              />
              Auto-assign to best matching folder
            </label>
          </div>
          
          {!autoAssign && (
            <div>
              <label htmlFor="folderId" className="block text-gray-700 mb-1">
                Folder
              </label>
              <select
                id="folderId"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Unassigned)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {autoAssign && (
            <p className="text-sm text-gray-600">
              Image will be automatically assigned to the most relevant folder based on AI analysis
            </p>
          )}
        </div>
        
        {/* Processing Status */}
        {isProcessing && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded flex items-center">
            <Loader size={18} className="animate-spin mr-2" />
            <span>{processingStatus}</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 mr-2 text-gray-600 hover:text-gray-800"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing || !imageFile}
          >
            {isProcessing ? 'Processing...' : 'Create Image Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateImageNote;