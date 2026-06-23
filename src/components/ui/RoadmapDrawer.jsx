import React from 'react';
import { X, CheckCircle, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function RoadmapDrawer({ isOpen, onClose, nodeData, isCompleted, onToggleComplete }) {
  if (!nodeData) return null;

  const hasContent = nodeData.description && 
                     nodeData.description.trim().length > 0 && 
                     nodeData.description !== "No detailed content available for this skill yet.";

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out flex flex-col pt-20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-medium text-slate-600 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                isCompleted ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'
              }`}>
                {isCompleted ? 'Completed' : (nodeData.variant === 'checkpoint' ? 'Core Skill' : 'Standard Skill')}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{nodeData.label}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Markdown Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {hasContent ? (
            <div className="prose prose-slate prose-headings:font-bold prose-a:text-indigo-600 hover:prose-a:text-indigo-700 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{nodeData.description}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Documentation Pending</h3>
              <p className="text-sm text-slate-500 max-w-sm">We are currently compiling the standard resources and study materials for this specific skill.</p>
            </div>
          )}
        </div>

        {/* Interactive Footer */}
        <div className="p-6 bg-white border-t border-slate-100">
          <button 
            onClick={() => onToggleComplete(nodeData.id)}
            className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg ${
              isCompleted 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <CheckCircle size={18} />
            {isCompleted ? 'Completed' : 'Mark as Completed'}
          </button>
        </div>
      </div>
    </>
  );
}