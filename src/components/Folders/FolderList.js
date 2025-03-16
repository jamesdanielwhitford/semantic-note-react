import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFolders } from '../../context/FolderContext';
import { FolderIcon, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

const FolderItem = ({ folder, level = 0, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const { setCurrentFolder } = useFolders();
  const navigate = useNavigate();
  
  const hasChildren = folder.children && folder.children.length > 0;
  const paddingLeft = `${(level * 16) + 8}px`;
  
  const toggleExpand = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent navigation
    setExpanded(!expanded);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete) {
      onDelete(folder.id);
    }
  };
  
  const navigateToFolder = (e) => {
    // Don't navigate if clicking on the expand/collapse button or delete button
    if (e.target.closest('button')) {
      return;
    }
    setCurrentFolder(folder);
    navigate(`/folders/${folder.id}`);
  };
  
  return (
    <div>
      <div
        className="flex items-center py-2 px-2 hover:bg-gray-100 rounded text-gray-700 text-sm group cursor-pointer"
        style={{ paddingLeft }}
        onClick={navigateToFolder}
      >
        {hasChildren ? (
          <button onClick={toggleExpand} className="mr-1 z-10">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-4 mr-1"></span>
        )}
        
        <FolderIcon size={16} className="mr-2 text-yellow-500" />
        <span className="flex-grow truncate">{folder.title}</span>
        
        {folder.summary && (
          <span className="text-xs text-gray-500 italic hidden group-hover:inline mr-2">
            {folder.summary.length > 30 ? folder.summary.substring(0, 30) + '...' : folder.summary}
          </span>
        )}
        
        <button 
          onClick={handleDelete}
          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      {hasChildren && expanded && (
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderList = () => {
  const { getFolderTree, removeFolder, loading, error } = useFolders();
  const folderTree = getFolderTree();
  
  const handleDeleteFolder = async (folderId) => {
    try {
      if (window.confirm('Are you sure you want to delete this folder? Notes will be unassigned.')) {
        await removeFolder(folderId);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Loading folders...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="font-medium text-gray-700">Folders</h3>
        <Link to="/create-folder" className="text-blue-500 hover:text-blue-700">
          <Plus size={18} />
        </Link>
      </div>
      
      <div className="p-1">
        {folderTree.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No folders yet. Create one to get started!
          </div>
        ) : (
          folderTree.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              onDelete={handleDeleteFolder}
            />
          ))
        )}
      </div>
      
      <div className="mt-4 p-2">
        <Link 
          to="/folder-suggestions" 
          className="text-sm text-blue-500 hover:text-blue-700 block text-center"
        >
          Get Folder Suggestions
        </Link>
      </div>
    </div>
  );
};

export default FolderList;