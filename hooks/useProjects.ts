import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('legislative_projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedProjects: Project[] = (data || []).map(item => ({
                id: item.id,
                type: item.type,
                number: item.number,
                year: item.year,
                author: item.author,
                summary: item.summary,
                status: item.status,
                deadline: item.deadline || undefined,
                attachments: 0, // Placeholder
                document_url: item.document_url
            }));

            setProjects(formattedProjects);
        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (project: Omit<Project, 'id' | 'attachments'>) => {
        const { data, error } = await supabase
            .from('legislative_projects')
            .insert([{
                type: project.type,
                number: project.number,
                year: project.year,
                author: project.author,
                summary: project.summary,
                status: project.status,
                deadline: project.deadline || null,
                document_url: project.document_url
            }])
            .select()
            .single();

        if (error) throw error;

        const newProject: Project = {
            ...project,
            id: data.id,
            attachments: 0
        };
        setProjects(prev => [newProject, ...prev]);
        return data;
    };

    const updateProject = async (id: number, updates: Partial<Project>) => {
        const { error } = await supabase
            .from('legislative_projects')
            .update({
                type: updates.type,
                number: updates.number,
                year: updates.year,
                author: updates.author,
                summary: updates.summary,
                status: updates.status,
                deadline: updates.deadline || null,
                document_url: updates.document_url
            })
            .eq('id', id);

        if (error) throw error;

        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProject = async (id: number) => {
        const { error } = await supabase
            .from('legislative_projects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setProjects(prev => prev.filter(p => p.id !== id));
    };

    return {
        projects,
        loading,
        createProject,
        updateProject,
        deleteProject
    };
}
