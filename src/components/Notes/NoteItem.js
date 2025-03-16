import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Edit, Trash2, FolderIcon, Image } from 'lucide-react';

const NoteItem = ({ note, onDelete, folders }) => {
  // Get folder name if the note is in a folder
  const folderName = note.folderId
    ? folders.find(f => f.id === note.folderId)?.title || 'Unknown Folder'
    : 'Unassigned';
  
  // Format date for display
  const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Determine if this is an image note
  const isImageNote = note.type === 'image' && note.imageData;
  
  // Create a snippet of the note content
  const snippet = note.content.length > 100
    ? note.content.substring(0, 100) + '...'
    : note.content;
  
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(note.id);
    }
  };
  
  return (
    <Link
      to={`/notes/${note.id}`}
      className="block border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow group bg-white"
    >
      <div className="flex items-start">
        {isImageNote ? (
          <div className="mr-3 flex-shrink-0 w-16 h-16 relative bg-gray-100 rounded overflow-hidden">
            {note.imageData.dataUrl ? (
              <img 
                src={note.imageData.dataUrl} 
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Image size={18} className="text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            )}
          </div>
        ) : (
          <FileText size={18} className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
        )}
        
        <div className="flex-grow">
          <div className="text-sm text-gray-500 flex items-center mb-1">
            <span className="mr-3">{formattedDate}</span>
            <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
              <FolderIcon size={12} className="text-yellow-500 mr-1" />
              <span>{folderName}</span>
            </div>
            {isImageNote && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Image
              </span>
            )}
          </div>
          <p className="text-gray-800">{snippet}</p>
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isImageNote && (
            <Link
              to={`/notes/${note.id}/edit`}
              className="text-gray-500 hover:text-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit size={16} />
            </Link>
          )}
          <button
            onClick={handleDelete}
            className="text-gray-500 hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default NoteItem;