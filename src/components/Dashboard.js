// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFolders } from '../context/FolderContext';
import { useNotes } from '../context/NoteContext';
import { FilePlus, FolderPlus, Search, Lightbulb, FileText, FolderIcon, Sparkles, Layers } from 'lucide-react';

const Dashboard = () => {
  const { folders } = useFolders();
  const { notes, generateFolderSuggestions } = useNotes();
  const [quickSuggestion, setQuickSuggestion] = useState(null);
  const [isLoadingQuickSuggestion, setIsLoadingQuickSuggestion] = useState(false);
  
  // Get recent notes
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  
  // Get recent folders
  const recentFolders = [...folders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  
  // Get unorganized notes
  const unorganizedNotes = notes.filter(note => !note.folderId);
  
  // Get a quick folder suggestion if there are enough unorganized notes
  useEffect(() => {
    const getQuickSuggestion = async () => {
      if (unorganizedNotes.length >= 3) {
        try {
          setIsLoadingQuickSuggestion(true);
          const suggestions = await generateFolderSuggestions(true);
          if (suggestions && suggestions.length > 0) {
            setQuickSuggestion(suggestions[0]);
          }
        } catch (error) {
          console.error('Error generating quick suggestion:', error);
        } finally {
          setIsLoadingQuickSuggestion(false);
        }
      }
    };
    
    getQuickSuggestion();
  }, [unorganizedNotes.length, generateFolderSuggestions]);
  
  // Render the Quick Suggestion Card
  const renderQuickSuggestion = () => {
    if (!quickSuggestion) return null;
    
    return (
      <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-100 mb-6">
        <div className="flex items-start">
          <div className="bg-blue-100 rounded-full p-2 mr-4">
            <Sparkles size={24} className="text-blue-600" />
          </div>
          
          <div className="flex-grow">
            <h3 className="text-lg font-medium text-blue-800">Folder Suggestion</h3>
            <p className="text-sm text-blue-700 mt-1">
              We found {quickSuggestion.noteCount} notes that could be organized into:
            </p>
            <div className="mt-2 mb-3">
              <div className="font-medium">{quickSuggestion.title}</div>
              <div className="text-sm">{quickSuggestion.description}</div>
            </div>
            <Link
              to="/folder-suggestions"
              className="text-blue-600 hover:underline text-sm"
            >
              View this and more suggestions
            </Link>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to SemanticNote</h1>
      
      {/* Quick Suggestion */}
      {!isLoadingQuickSuggestion && quickSuggestion && renderQuickSuggestion()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/create-note"
              className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <FilePlus size={20} className="mr-2" />
              Create Note
            </Link>
            <Link
              to="/create-folder"
              className="flex items-center justify-center p-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <FolderPlus size={20} className="mr-2" />
              Create Folder
            </Link>
            <Link
              to="/notes"
              className="flex items-center justify-center p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <Search size={20} className="mr-2" />
              Browse Notes
            </Link>
            <Link
              to="/folder-suggestions"
              className="flex items-center justify-center p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              <Lightbulb size={20} className="mr-2" />
              Get AI Suggestions
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{notes.length}</div>
              <div className="text-sm text-gray-600">Total Notes</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{folders.length}</div>
              <div className="text-sm text-gray-600">Total Folders</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">
                {folders.filter(f => f.summary).length}
              </div>
              <div className="text-sm text-gray-600">Summarized Folders</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {notes.filter(n => n.folderId).length}
              </div>
              <div className="text-sm text-gray-600">Organized Notes</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Organization Status */}
      {unorganizedNotes.length > 0 && (
        <div className="bg-amber-50 rounded-lg shadow-sm p-6 border border-amber-100 mb-6">
          <div className="flex items-start">
            <div className="mr-4">
              <Layers size={24} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Organization Status</h3>
              <p className="text-gray-700 mt-1">
                You have {unorganizedNotes.length} notes that aren't organized in any folder.
              </p>
              <div className="mt-3">
                <Link
                  to="/folder-suggestions"
                  className="inline-block px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Get Organization Suggestions
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Notes</h2>
            <Link to="/notes" className="text-blue-500 hover:underline text-sm">
              View All
            </Link>
          </div>
          
          {recentNotes.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              No notes yet. Create your first note to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map(note => (
                <Link
                  key={note.id}
                  to={`/notes/${note.id}`}
                  className="flex items-start p-3 rounded-md hover:bg-gray-50"
                >
                  <FileText size={16} className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-800 line-clamp-1">
                      {note.content.length > 60
                        ? note.content.substring(0, 60) + '...'
                        : note.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Folders</h2>
            <Link to="/folders" className="text-blue-500 hover:underline text-sm">
              View All
            </Link>
          </div>
          
          {recentFolders.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              No folders yet. Create your first folder to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {recentFolders.map(folder => (
                <Link
                  key={folder.id}
                  to={`/folders/${folder.id}`}
                  className="flex items-start p-3 rounded-md hover:bg-gray-50"
                >
                  <FolderIcon size={16} className="text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-800 font-medium">{folder.title}</div>
                    {folder.description && (
                      <div className="text-sm text-gray-600 line-clamp-1">
                        {folder.description}
                      </div>
                    )}
                    {folder.summary && (
                      <div className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                        {folder.summary}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 rounded-lg shadow-sm p-6 border border-blue-100">
        <h2 className="text-xl font-semibold mb-4">About SemanticNote</h2>
        <div className="text-gray-700">
          <p className="mb-2">
            SemanticNote is an AI-powered note-taking application that uses semantic analysis to:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Automatically organize your notes into relevant folders</li>
            <li>Generate intelligent summaries of your content</li>
            <li>Suggest folder categories based on your existing notes</li>
            <li>Create a hierarchical knowledge base that grows with you</li>
          </ul>
          <p>
            Get started by creating a note or folder, and let the AI handle the organization!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;