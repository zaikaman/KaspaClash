'use client';

import { useEffect, useRef } from 'react';

interface MermaidDiagramProps {
    chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!containerRef.current) return;

            try {
                const mermaid = (await import('mermaid')).default;
                
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    themeVariables: {
                        primaryColor: '#ffd700',
                        primaryTextColor: '#fff',
                        primaryBorderColor: '#ffd700',
                        lineColor: '#00d4ff',
                        secondaryColor: '#9d4edd',
                        tertiaryColor: '#00ff88',
                        background: '#0a0a0f',
                        mainBkg: '#1a1a2e',
                        secondBkg: '#16213e',
                        tertiaryBkg: '#0f3460',
                        textColor: '#ffffff',
                        border1: '#ffd700',
                        border2: '#00d4ff',
                        fontSize: '14px',
                    },
                });

                const { svg } = await mermaid.render('mermaid-diagram', chart);
                containerRef.current.innerHTML = svg;
            } catch (error) {
                console.error('Mermaid rendering error:', error);
                containerRef.current.innerHTML = '<p class="text-red-400">Failed to render diagram</p>';
            }
        };

        renderDiagram();
    }, [chart]);

    return <div ref={containerRef} className="mermaid-container" />;
}
