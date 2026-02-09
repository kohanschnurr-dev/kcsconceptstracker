import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Check, Building2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasteableTextarea } from '@/components/PasteableTextarea';

interface Project {
  id: string;
  name: string;
  address?: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  bucketName: string;
  folderPath?: string;
  uploadedImages: string[];
  onImagesChange: (images: string[]) => void;
  projects: Project[];
  label?: string;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  bucketName,
  folderPath = '',
  uploadedImages,
  onImagesChange,
  projects,
  label,
}: MentionTextareaProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Filter projects based on mention query (exclude email-like patterns)
  const filteredProjects = useMemo(() => {
    const activeProjects = projects
      .filter(p => (p as any).status !== 'complete')
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!mentionQuery.trim()) {
      return activeProjects.slice(0, 8);
    }

    const query = mentionQuery.toLowerCase().trim();
    return activeProjects.filter(project => {
      const nameMatch = project.name.toLowerCase().includes(query);
      const addressMatch = project.address?.toLowerCase().includes(query);
      return nameMatch || addressMatch;
    }).slice(0, 8);
  }, [projects, mentionQuery]);

  // Reset selected index when filtered projects change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProjects.length]);

  // Check if the @ is part of an email pattern
  const isEmailPattern = useCallback((text: string, atIndex: number) => {
    // Check if there are non-space characters before the @
    const beforeAt = text.substring(0, atIndex);
    const lastSpaceIndex = beforeAt.lastIndexOf(' ');
    const wordBeforeAt = beforeAt.substring(lastSpaceIndex + 1);
    
    // If there's a word directly before @, it's likely an email
    if (wordBeforeAt.length > 0 && /^[a-zA-Z0-9._-]+$/.test(wordBeforeAt)) {
      return true;
    }
    
    return false;
  }, []);

  // Handle text changes and detect @ mentions
  const handleTextChange = useCallback((newValue: string) => {
    onChange(newValue);

    // Find the textarea element
    const textarea = containerRef.current?.querySelector('textarea');
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if this @ is at the start or after a space (not part of email)
      const charBefore = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
      const isStartOfMention = charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0;
      
      if (isStartOfMention && !isEmailPattern(newValue, lastAtIndex)) {
        const queryAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        
        // If query doesn't contain spaces (active mention)
        if (!queryAfterAt.includes(' ') && !queryAfterAt.includes('\n')) {
          setMentionQuery(queryAfterAt);
          setMentionStartIndex(lastAtIndex);
          setShowMentions(true);
          
          // Calculate position for dropdown
          calculateDropdownPosition(textarea, lastAtIndex);
          return;
        }
      }
    }
    
    // No active mention
    setShowMentions(false);
    setMentionQuery('');
    setMentionStartIndex(null);
  }, [onChange, isEmailPattern]);

  // Calculate dropdown position near the @ symbol
  const calculateDropdownPosition = (textarea: HTMLTextAreaElement, atIndex: number) => {
    // Simple approach: position below the textarea
    const rect = textarea.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setCursorPosition({
        top: rect.bottom - containerRect.top + 4,
        left: 0,
      });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showMentions || filteredProjects.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredProjects.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredProjects.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        if (showMentions && filteredProjects[selectedIndex]) {
          e.preventDefault();
          selectProject(filteredProjects[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowMentions(false);
        break;
    }
  }, [showMentions, filteredProjects, selectedIndex]);

  // Insert selected project name
  const selectProject = useCallback((project: Project) => {
    if (mentionStartIndex === null) return;

    const textarea = containerRef.current?.querySelector('textarea');
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterCursor = value.substring(cursorPos);
    
    // Insert project name with @ prefix and a space after
    const newValue = `${beforeMention}@${project.name} ${afterCursor}`;
    onChange(newValue);
    
    // Close mentions
    setShowMentions(false);
    setMentionQuery('');
    setMentionStartIndex(null);

    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = mentionStartIndex + project.name.length + 2; // +2 for @ and space
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange, mentionStartIndex]);

  // Close mentions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div onKeyDown={handleKeyDown}>
        <PasteableTextarea
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={rows}
          className={className}
          bucketName={bucketName}
          folderPath={folderPath}
          uploadedImages={uploadedImages}
          onImagesChange={onImagesChange}
          label={label}
        />
      </div>

      {/* Mention dropdown */}
      {showMentions && (
        <div 
          className="absolute z-50 w-full max-h-[200px] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
          style={{
            top: cursorPosition?.top ?? '100%',
            left: cursorPosition?.left ?? 0,
          }}
        >
          {filteredProjects.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-1 opacity-40" />
              No projects found
            </div>
          ) : (
            <div className="p-1">
              {filteredProjects.map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => selectProject(project)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-sm text-sm cursor-pointer transition-colors",
                    index === selectedIndex 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-accent/50"
                  )}
                >
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium truncate">{project.name}</span>
                    {project.address && (
                      <span className="text-xs text-muted-foreground truncate">
                        {project.address}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
