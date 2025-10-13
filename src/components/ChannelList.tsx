import { useState } from 'react';
import VirtualList from 'react-tiny-virtual-list';

// Define the types for props
interface Channel {
  name: string;
  url: string;
  logo?: string;
}

interface GroupedChannels {
  [groupName: string]: Channel[];
}

interface ChannelListProps {
  groupedChannels: GroupedChannels;
  onChannelClick: (url: string, index: number) => void;
}

const ChannelList = ({ groupedChannels, onChannelClick }: ChannelListProps) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const handleGroupClick = (groupName: string) => {
    // Toggle the accordion: if the clicked group is already open, close it. Otherwise, open it.
    setOpenGroup(prevOpenGroup => (prevOpenGroup === groupName ? null : groupName));
  };

  const sortedGroupNames = Object.keys(groupedChannels).sort();

  return (
    <div className="h-full overflow-y-auto">
      {sortedGroupNames.map(groupName => {
        const channelsInGroup = groupedChannels[groupName];
        const isGroupOpen = openGroup === groupName;

        return (
          <div key={groupName} className="border-b border-gray-700">
            <button
              onClick={() => handleGroupClick(groupName)}
              className="w-full flex justify-between items-center p-2 text-left font-semibold hover:bg-gray-700"
            >
              <span>{groupName} ({channelsInGroup.length})</span>
              {/* Chevron icon indicating open/closed state */}
              <span className={`transform transition-transform ${isGroupOpen ? 'rotate-90' : ''}`}>
                &gt;
              </span>
            </button>
            {/* Conditionally render the virtualized list for the open group */}
            {isGroupOpen && (
              <div className="bg-gray-900" style={{ height: '400px' }}> {/* Container with fixed height for VirtualList */}
                <VirtualList
                  width='100%'
                  height={400} // This height should match the container
                  itemCount={channelsInGroup.length}
                  itemSize={44} // The height of each channel item (h-11)
                  renderItem={({ index, style }) => {
                    const channel = channelsInGroup[index];
                    return (
                      <div key={channel.url} style={style}>
                        <button 
                          onClick={() => onChannelClick(channel.url, index)}
                          className="w-full text-left p-2 rounded hover:bg-gray-600 text-sm flex items-center space-x-2 h-11"
                        >
                          <img 
                            src={channel.logo} 
                            alt="" 
                            className="w-8 h-8 object-contain rounded-sm bg-gray-700"
                            loading="lazy"
                            // Add a placeholder or error handler for broken image links
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          <span className="flex-1 truncate">{channel.name}</span>
                        </button>
                      </div>
                    );
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChannelList;