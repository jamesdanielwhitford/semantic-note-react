import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Layout Components
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MainContent from './components/Layout/MainContent';

// Context Providers
import { FolderProvider } from './context/FolderContext';
import { NoteProvider } from './context/NoteContext';

// Page Components
import Dashboard from './components/Dashboard';
import FolderList from './components/Folders/FolderList';
import FolderView from './components/Folders/FolderView';
import CreateFolder from './components/Folders/CreateFolder';
import FolderSuggestions from './components/Folders/FolderSuggestions';
import NoteList from './components/Notes/NoteList';
import NoteView from './components/Notes/NoteView';
import CreateNote from './components/Notes/CreateNote';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <FolderProvider>
        <NoteProvider>
          <div className="app-container">
            <Header toggleSidebar={toggleSidebar} />
            <div className="content-container">
              <Sidebar isOpen={sidebarOpen} />
              <MainContent>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/folders" element={<FolderList />} />
                  <Route path="/folders/:folderId" element={<FolderView />} />
                  <Route path="/create-folder" element={<CreateFolder />} />
                  <Route path="/create-folder/:folderId" element={<CreateFolder />} />
                  <Route path="/folder-suggestions" element={<FolderSuggestions />} />
                  <Route path="/folder-suggestions/:folderId" element={<FolderSuggestions />} />
                  <Route path="/notes" element={<NoteList />} />
                  <Route path="/notes/:noteId" element={<NoteView />} />
                  <Route path="/create-note" element={<CreateNote />} />
                  <Route path="/notes/:noteId/edit" element={<CreateNote />} />
                </Routes>
              </MainContent>
            </div>
          </div>
        </NoteProvider>
      </FolderProvider>
    </Router>
  );
}

export default App;