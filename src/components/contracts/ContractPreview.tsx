import { useMemo } from "react";

interface ContractPreviewProps {
  content: string;
  className?: string;
}

export function ContractPreview({ content, className = "" }: ContractPreviewProps) {
  // Simple Markdown-like rendering
  const renderedContent = useMemo(() => {
    let html = content;
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-center">$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');
    
    // Horizontal rules (signature lines)
    html = html.replace(/^---$/gm, '<hr class="my-6 border-t-2 border-dashed border-border" />');
    
    // Line breaks -> paragraphs
    html = html.split('\n\n').map(p => {
      if (p.startsWith('<h') || p.startsWith('<li') || p.startsWith('<hr')) {
        return p;
      }
      return `<p class="mb-4">${p}</p>`;
    }).join('');
    
    // Wrap consecutive li elements in ul
    html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, '<ul class="list-disc mb-4">$&</ul>');
    
    return html;
  }, [content]);

  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
