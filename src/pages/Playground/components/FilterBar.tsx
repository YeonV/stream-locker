import CountryFlag from 'react-country-flag';
import { FiSearch } from 'react-icons/fi';

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
  const country = selectedCountry.toLowerCase();
  const flag =  (country === 'uk' ? 'gb' : country === 'en' ? 'us' : country);

  return (
    <div className="flex items-center flex-wrap gap-4 bg-background-secondary p-4 rounded-lg border border-border-primary mb-6">
      
      <div className="relative flex-shrink-0">
        <select
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          className="pl-3 pr-10 py-2 text-text-primary bg-background-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus appearance-none"
        >
          <option value="ALL">All Countries</option>
          {countries.map(country => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        
        <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
          {selectedCountry !== 'ALL' && <CountryFlag countryCode={flag} svg style={{ width: '1.5em', height: '1.5em' }} />}
        </div>
      </div>

      <div className="flex-grow relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search categories by name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 text-text-primary bg-background-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus"
        />
      </div>
    </div>
  );
};