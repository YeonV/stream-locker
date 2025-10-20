import * as Select from '@radix-ui/react-select';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import type { M3uPlaylist } from '../../../types/playlist';

interface CustomSelectProps {
  playlists: M3uPlaylist[];
  selectedValue: string | null;
  onValueChange: (value: string) => void;
}

export const CustomSelect = ({ playlists, selectedValue, onValueChange }: CustomSelectProps) => {
  return (
    <Select.Root value={selectedValue || ''} onValueChange={onValueChange}>
      <Select.Trigger 
        className="flex items-center justify-between w-full md:w-64 px-3 py-2 text-text-primary bg-background-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus"
        aria-label="Select Playlist"
      >
        <Select.Value placeholder="Select a playlist..." />
        <Select.Icon className="text-text-secondary">
          <FiChevronDown />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content 
          className="overflow-hidden bg-background-secondary rounded-md shadow-lg border border-border-primary z-50 animate-in fade-in-0 zoom-in-95"
          position="popper"
          sideOffset={5}
        >
          <Select.ScrollUpButton className="flex items-center justify-center h-6 cursor-default"><FiChevronUp /></Select.ScrollUpButton>
          <Select.Viewport className="p-1">
            {playlists.map((p) => (
              <Select.Item 
                key={p.id} 
                value={p.id}
                className="relative flex items-center px-6 py-2 text-sm rounded-md select-none text-text-primary data-[highlighted]:bg-primary data-[highlighted]:text-white data-[highlighted]:outline-none"
              >
                <Select.ItemText>{p.name}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex items-center justify-center h-6 cursor-default"><FiChevronDown /></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};