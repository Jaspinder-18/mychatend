import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, ChevronLeft, Save, Shield } from 'lucide-react';

const NotesDisguise = ({ onUnlock }) => {
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('stealth_notes_v2');
        return saved ? JSON.parse(saved) : [
            { id: 1, title: 'Grocery List', content: 'Milk, Eggs, Bread, Coffee', date: new Date().toISOString() },
            { id: 2, title: 'Project Ideas', content: 'Build a privacy-focused chat app with a notes disguise.', date: new Date().toISOString() }
        ];
    });
    const [selectedNote, setSelectedNote] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        localStorage.setItem('stealth_notes_v2', JSON.stringify(notes));
    }, [notes]);

    const handleCreateNote = () => {
        const newNote = {
            id: Date.now(),
            title: '',
            content: '',
            date: new Date().toISOString()
        };
        setSelectedNote(newNote);
    };

    const handleSaveNote = (noteData) => {
        // Trigger check: if the title or content contains the secret pattern
        const triggerPattern = '#unlock'; // Default trigger for now
        if (noteData.title.toLowerCase().includes(triggerPattern) || noteData.content.toLowerCase().includes(triggerPattern)) {
            onUnlock();
            return;
        }

        if (notes.find(n => n.id === noteData.id)) {
            setNotes(notes.map(n => n.id === noteData.id ? noteData : n));
        } else {
            setNotes([noteData, ...notes]);
        }
        setSelectedNote(null);
    };

    const handleDeleteNote = (id) => {
        setNotes(notes.filter(n => n.id !== id));
        if (selectedNote?.id === id) setSelectedNote(null);
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-indigo-500/30">
            <AnimatePresence mode="wait">
                {!selectedNote ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6 max-w-2xl mx-auto"
                    >
                        <header className="flex justify-between items-center mb-8">
                            <h1 className="text-4xl font-bold tracking-tight">Notes</h1>
                            <div className="flex gap-4">
                                <button className="p-2 bg-zinc-900 rounded-full text-zinc-400">
                                    <Shield size={20} />
                                </button>
                            </div>
                        </header>

                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900/50 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-zinc-700 transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            {filteredNotes.map((note) => (
                                <motion.div
                                    layoutId={note.id}
                                    key={note.id}
                                    onClick={() => setSelectedNote(note)}
                                    className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5 hover:bg-zinc-800/50 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-lg">{note.title || 'Untitled'}</h3>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-zinc-500 line-clamp-1">{note.content || 'No additional text'}</p>
                                    <p className="text-xs text-zinc-600 mt-2">{new Date(note.date).toLocaleDateString()}</p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCreateNote}
                            className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40"
                        >
                            <Plus size={28} />
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 bg-black flex flex-col"
                    >
                        <header className="p-4 flex justify-between items-center border-b border-zinc-900">
                            <button onClick={() => setSelectedNote(null)} className="flex items-center text-indigo-400 font-medium">
                                <ChevronLeft size={24} />
                                <span>Notes</span>
                            </button>
                            <button
                                onClick={() => handleSaveNote(selectedNote)}
                                className="px-4 py-2 bg-zinc-900 rounded-xl text-white font-semibold hover:bg-zinc-800"
                            >
                                Done
                            </button>
                        </header>
                        <main className="flex-1 p-6 flex flex-col">
                            <input
                                type="text"
                                placeholder="Title"
                                value={selectedNote.title}
                                onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                                className="text-3xl font-bold bg-transparent border-none focus:ring-0 mb-4 placeholder:text-zinc-700"
                            />
                            <textarea
                                placeholder="Start writing..."
                                value={selectedNote.content}
                                onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-zinc-700"
                            />
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotesDisguise;

