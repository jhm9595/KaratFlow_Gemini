import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuthHeaders } from '../api/client';

export interface ProcessTemplateStep {
    id?: number;
    stepOrder: number;
    stageCode: string;
    stageName: string;
    isOptional?: boolean;
    isSubcontract?: boolean;
    colorHex?: string;
    colorGradient?: string;
}

export interface ProcessTemplate {
    id: number;
    templateCode: string;
    templateName: string;
    description?: string;
    isDefault?: boolean;
    steps: ProcessTemplateStep[];
}

export function useProcessTemplates() {
    const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:8888/api/process-templates', { headers: getAuthHeaders() });
            if (!res.ok) throw new Error('공정 템플릿 정보를 가져오는데 실패했습니다.');
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data.filter((t: ProcessTemplate) => t && t.templateName && t.templateName.trim() !== ''));
            }
        } catch (err: any) {
            console.error('Failed to fetch process templates:', err);
            setError(err.message || '공정 템플릿 로딩 오류');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const defaultTemplate = useMemo(() => {
        if (templates.length === 0) return null;
        return templates.find(t => Boolean(t.isDefault)) || templates[0];
    }, [templates]);

    const templatesById = useMemo(() => {
        const map: Record<number, ProcessTemplate> = {};
        templates.forEach(t => {
            if (t.id) map[t.id] = t;
        });
        return map;
    }, [templates]);

    return {
        templates,
        defaultTemplate,
        templatesById,
        refreshTemplates: fetchTemplates,
        loading,
        error
    };
}
