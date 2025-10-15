import CountryFlag from 'react-country-flag';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  countries: string[];
  selectedCountry: string;
  onCountryChange: (country: string) => void;
}

export const FilterBar = ({
  searchTerm,
  onSearchChange,
  countries,
  selectedCountry,
  onCountryChange,
}: FilterBarProps) => {
  const country = selectedCountry.toLowerCase()
  const flag =  (country === 'uk' ? 'gb' : country);
  return (
    
    <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg mb-6">
      

      {/* Country Filter Dropdown */}
      <div className="flex-shrink-0 relative">
        <select
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          className="px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
        >
          <option value="ALL">All Countries</option>
          {countries.map(country => (
            <option key={country} value={country} className='relative'>
              {country}
            </option>
          ))}
        </select>
        
      <div className="absolute top-1/2 right-6 transform -translate-y-1/2 pointer-events-none">
        {selectedCountry !== 'ALL' && <CountryFlag countryCode={flag} svg style={{ width: '2em', height: '2em' }} />}
      </div>
      </div>
      {/* Search Input */}
      <div className="flex-grow">
        <input
          type="text"
          placeholder="Search categories by name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
        />
      </div>
    </div>
  );
};