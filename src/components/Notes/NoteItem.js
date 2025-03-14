import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Edit, Trash2, FolderIcon } from 'lucide-react';

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
        <FileText size={18} className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
        <div className="flex-grow">
          <div className="text-sm text-gray-500 flex items-center mb-1">
            <span className="mr-3">{formattedDate}</span>
            <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
              <FolderIcon size={12} className="text-yellow-500 mr-1" />
              <span>{folderName}</span>
            </div>
          </div>
          <p className="text-gray-800">{snippet}</p>
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            to={`/notes/${note.id}/edit`}
            className="text-gray-500 hover:text-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit size={16} />
          </Link>
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