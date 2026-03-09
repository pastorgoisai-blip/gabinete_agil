import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Loader2 } from 'lucide-react';

interface VoterAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const VoterAutocomplete: React.FC<VoterAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Nome do munícipe',
    className = '',
}) => {
    const [suggestions, setSuggestions] = useState<{ id: number | string; name: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchVoters = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('voters')
                .select('id, name')
                .ilike('name', `%${query}%`)
                .order('name')
                .limit(10);

            if (error) throw error;

            setSuggestions(data || []);
            setIsOpen(true);
        } catch (err) {
            console.error('Error searching voters:', err);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setActiveIndex(-1);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            searchVoters(newValue);
        }, 300);
    };

    const handleSelect = (name: string) => {
        onChange(name);
        setIsOpen(false);
        setSuggestions([]);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIndex].name);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setActiveIndex(-1);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <input
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
                placeholder={placeholder}
                className={className || 'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white'}
                autoComplete="off"
            />

            {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
            )}

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {suggestions.length === 0 && !isLoading ? (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">
                            Nenhum eleitor encontrado
                        </div>
                    ) : (
                        suggestions.map((voter, index) => (
                            <button
                                key={voter.id}
                                type="button"
                                onClick={() => handleSelect(voter.name)}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors
                  ${index === activeIndex
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }
                  ${index !== suggestions.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''}
                `}
                            >
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                    {voter.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate">{voter.name}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default VoterAutocomplete;
