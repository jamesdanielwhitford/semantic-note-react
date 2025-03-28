import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderIcon, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

const FolderItem = ({ folder, level = 0, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
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

export default FolderItem;