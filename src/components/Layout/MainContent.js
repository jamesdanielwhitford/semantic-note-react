// MainContent.js
import React from 'react';

const MainContent = ({ children }) => {
  return (
    <main className="flex-grow overflow-y-auto bg-gray-50 min-h-screen">
      <div className="container mx-auto">
        {children}
      </div>
    </main>
  );
};

export default MainContent;