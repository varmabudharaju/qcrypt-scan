import { useState, useEffect } from 'react';
import { browsePath, type BrowseResult } from '../api.ts';

interface FolderPickerProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export default function FolderPicker({ onSelect, onClose }: FolderPickerProps) {
  const [browse, setBrowse] = useState<BrowseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = async (dirPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await browsePath(dirPath);
      setBrowse(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to browse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigate();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl w-[500px] max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-[#333]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">Select Folder</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg">
              &times;
            </button>
          </div>
          {browse && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-[#111] px-2 py-1.5 rounded overflow-x-auto">
              {browse.path}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading && (
            <div className="text-sm text-slate-400 p-4 text-center">Loading...</div>
          )}

          {error && (
            <div className="text-sm text-red-500 p-4 text-center">{error}</div>
          )}

          {browse && !loading && (
            <>
              {browse.path !== browse.parent && (
                <button
                  onClick={() => navigate(browse.parent)}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-[#252525] flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span className="text-slate-400">..</span>
                  <span className="text-slate-400 text-xs">parent folder</span>
                </button>
              )}
              {browse.entries.length === 0 && (
                <div className="text-sm text-slate-400 p-4 text-center">No subdirectories</div>
              )}
              {browse.entries.map((name) => (
                <button
                  key={name}
                  onClick={() => navigate(browse.path + '/' + name)}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-[#252525] flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span className="text-accent">&#128193;</span>
                  {name}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-[#333] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-[#333] text-sm hover:bg-slate-100 dark:hover:bg-[#252525] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => browse && onSelect(browse.path)}
            disabled={!browse}
            className="px-3 py-1.5 rounded bg-accent text-black font-medium text-sm hover:bg-accent/80 disabled:opacity-50 transition-colors"
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
}
