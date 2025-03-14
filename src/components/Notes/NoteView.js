import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useNotes } from '../../context/NoteContext';
import { useFolders } from '../../context/FolderContext';
import { Edit, Trash2, FolderIcon } from 'lucide-react';
import NoteList from './NoteList';

const NoteView = () => {
  const { noteId } = useParams();
  const { notes, setCurrentNote, removeNote } = useNotes();
  const { folders } = useFolders();
  const navigate = useNavigate();
  
  // Find the note to display
  const note = noteId 
    ? notes.find(n => n.id === parseInt(noteId))
    : null;
  
  // Get folder info if the note is in a folder
  const folder = note?.folderId
    ? folders.find(f => f.id === note.folderId)
    : null;
  
  // Set as current note when loaded - with proper dependency array
  useEffect(() => {
    if (note) {
      setCurrentNote(note);
    }
  }, [noteId, notes]); // Only run when noteId or notes change
  
  const handleDeleteNote = async () => {
    try {
      if (window.confirm('Are you sure you want to delete this note?')) {
        await removeNote(note.id);
        navigate('/notes');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };
  
  // If no noteId is provided, show all notes
  if (!noteId) {
    return <div className="p-6"><NoteList /></div>;
  }
  
  // If note not found
  if (!note) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Note Not Found</h2>
        <p className="text-gray-600 mb-4">
          The note you're looking for doesn't exist or has been deleted.
        </p>
        <Link 
          to="/notes" 
          className="text-blue-500 hover:underline"
        >
          Return to all notes
        </Link>
      </div>
    );
  }
  
  // Format date for display
  const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">{formattedDate}</div>
        <div className="flex space-x-2">
          <Link
            to={`/notes/${note.id}/edit`}
            className="flex items-center px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Link>
          <button
            onClick={handleDeleteNote}
            className="flex items-center px-3 py-1 bg-red-100 rounded hover:bg-red-200 text-red-700"
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </button>
        </div>
      </div>
      
      {folder && (
        <div className="mb-4 flex items-center text-sm text-gray-600">
          <FolderIcon size={16} className="text-yellow-500 mr-1" />
          <span>In folder: </span>
          <Link 
            to={`/folders/${folder.id}`}
            className="ml-1 text-blue-500 hover:underline"
          >
            {folder.title}
          </Link>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="prose max-w-none">
          {note.content.split('\n').map((paragraph, index) => (
            paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoteView;