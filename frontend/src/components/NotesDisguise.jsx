import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';

const NotesDisguise = ({ onUnlock }) => {
    const [note, setNote] = useState('');
    const [viewMode, setViewMode] = useState(false); // Toggle between editor and file list
    const [savedFiles, setSavedFiles] = useState([]);

    // Load saved notes from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('stealth_app_notes');
        if (stored) {
            setSavedFiles(JSON.parse(stored));
        }
    }, []);

    const saveToStorage = (files) => {
        localStorage.setItem('stealth_app_notes', JSON.stringify(files));
        setSavedFiles(files);
    };

    const handleSave = () => {
        // Remove whitespace for secret code check
        const cleanNote = note.replace(/\s/g, '');

        // Check for secret code
        if (cleanNote === '#mychat=1809') {
            onUnlock();
            return;
        }

        if (!note.trim()) {
            alert('Cannot save empty note.');
            return;
        }

        // Prompt for filename
        const fileName = prompt("Enter a name for this note:", `Note ${new Date().toLocaleDateString()}`);
        if (fileName) {
            const newFile = {
                id: Date.now(),
                name: fileName,
                content: note,
                date: new Date().toISOString()
            };
            const newFiles = [newFile, ...savedFiles]; // Add to top
            saveToStorage(newFiles);
            alert('Note saved successfully!');
            setNote('');
        }
    };

    const handleCancel = () => {
        // Confirm exit
        if (window.confirm("Do you want to exit the app?")) {
            try {
                App.exitApp();
            } catch (e) {
                console.log("App exit failed (likely in browser mode)", e);
                window.close();
            }
        }
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm("Delete this note?")) {
            const newFiles = savedFiles.filter(f => f.id !== id);
            saveToStorage(newFiles);
        }
    };

    const loadFile = (file) => {
        setNote(file.content);
        setViewMode(false);
    };

    return (
        <div className="flex flex-col h-screen bg-[#fdf6e3] text-[#657b83] font-sans">
            {/* Header */}
            <header className="p-4 bg-[#eee8d5] border-b border-[#d3cbb8] flex items-center justify-between shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold tracking-tight">Quick Notes</h1>
                <button
                    onClick={() => setViewMode(!viewMode)}
                    className="text-sm text-[#cb4b16] font-semibold hover:underline"
                >
                    {viewMode ? "New Note" : "View Files"}
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-auto">
                {viewMode ? (
                    // File List View
                    <div className="space-y-3">
                        {savedFiles.length === 0 ? (
                            <p className="text-center text-gray-400 mt-10">No saved notes yet.</p>
                        ) : (
                            savedFiles.map(file => (
                                <div
                                    key={file.id}
                                    onClick={() => loadFile(file)}
                                    className="p-3 bg-white rounded-lg shadow-sm border border-[#d3cbb8] hover:bg-[#fafafa] cursor-pointer flex justify-between items-center transition-colors"
                                >
                                    <div>
                                        <div className="font-bold text-[#cb4b16]">{file.name}</div>
                                        <div className="text-xs text-gray-400">{new Date(file.date).toLocaleString()}</div>
                                        <div className="text-sm text-gray-600 truncate max-w-[200px]">{file.content.substring(0, 30)}...</div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(file.id, e)}
                                        className="text-red-500 hover:text-red-700 px-2 py-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // Note Editor View
                    <textarea
                        className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-lg leading-relaxed placeholder-[#93a1a1]"
                        placeholder="Type your note here..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        spellCheck="false"
                    />
                )}
            </main>

            {/* Footer */}
            {!viewMode && (
                <footer className="p-4 bg-[#eee8d5] border-t border-[#d3cbb8] flex justify-between items-center sticky bottom-0 z-10">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 rounded-full text-[#657b83] hover:bg-[#d3cbb8] transition-colors font-medium active:scale-95 transform duration-150"
                    >
                        Cancel
                    </button>
                    <div className="flex-1"></div>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2 rounded-full bg-[#cb4b16] text-white shadow-md hover:bg-[#bd380f] transition-colors font-bold active:scale-95 transform duration-150"
                    >
                        Save
                    </button>
                </footer>
            )}
        </div>
    );
};

export default NotesDisguise;
