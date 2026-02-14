import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Project {
  id: string;
  name: string;
  address?: string;
  status?: string;
  projectType?: string;
}

interface ProjectAutocompleteProps {
  projects: Project[];
  value: string;
  onSelect: (projectId: string) => void;
  placeholder?: string;
  filterActive?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function ProjectAutocomplete({
  projects,
  value,
  onSelect,
  placeholder = 'Search projects...',
  filterActive = false,
  className,
  triggerClassName,
}: ProjectAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out completed projects and sort alphabetically
  const filteredByStatus = useMemo(() => {
    const filtered = filterActive
      ? projects.filter(p => p.status === 'active')
      : projects.filter(p => p.status !== 'complete');
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, filterActive]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByStatus;
    }

    const query = searchQuery.toLowerCase().trim();

    return filteredByStatus.filter(project => {
      const nameMatch = project.name.toLowerCase().includes(query);
      const addressMatch = project.address?.toLowerCase().includes(query);
      return nameMatch || addressMatch;
    });
  }, [filteredByStatus, searchQuery]);

  // Group projects by type
  const PROJECT_TYPE_GROUPS: { type: string; label: string }[] = [
    { type: 'fix_flip', label: 'Fix & Flips' },
    { type: 'rental', label: 'Rentals' },
    { type: 'new_construction', label: 'New Builds' },
    { type: 'wholesaling', label: 'Wholesaling' },
  ];

  const groupedProjects = useMemo(() => {
    return PROJECT_TYPE_GROUPS.map(group => ({
      ...group,
      projects: filteredProjects.filter(p => p.projectType === group.type),
    })).filter(g => g.projects.length > 0);
  }, [filteredProjects]);

  // Get selected project details
  const selectedProject = projects.find(p => p.id === value);

  const handleSelect = (projectId: string) => {
    onSelect(projectId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {selectedProject ? selectedProject.name : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          'w-[--radix-popover-trigger-width] p-0 bg-popover border-border z-50',
          className
        )}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search projects..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              <div className="py-4 text-center text-sm text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No projects found
              </div>
            </CommandEmpty>
            {groupedProjects.map((group) => (
              <CommandGroup key={group.type} heading={group.label}>
                {group.projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.id}
                    onSelect={() => handleSelect(project.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 flex-shrink-0',
                        value === project.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{project.name}</span>
                      {project.address && (
                        <span className="text-xs opacity-70 truncate">
                          {project.address}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
