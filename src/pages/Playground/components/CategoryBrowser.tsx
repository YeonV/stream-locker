import { useState, useMemo } from 'react';
import { FilterBar } from './FilterBar';
import { CategoryList, type Category } from './CategoryList';

// Define the shape of a category object


interface CategoryBrowserProps {
  title: string;
  categories: Category[];
  onCategoryClick: (categoryId: string, categoryName: string) => void;
}

export const CategoryBrowser = ({ title, categories, onCategoryClick }: CategoryBrowserProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');

  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    categories.forEach(category => {
      const match = category.category_name.match(/^([A-Z]{2,3})\s\|/);
      if (match) {
        countrySet.add(match[1]);
      }
    });
    return Array.from(countrySet).sort();
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const countryMatch = selectedCountry === 'ALL' || category.category_name.startsWith(`${selectedCountry} |`);
      const searchMatch = category.category_name.toLowerCase().includes(searchTerm.toLowerCase());
      return countryMatch && searchMatch;
    });
  }, [categories, selectedCountry, searchTerm]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        countries={countries}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
      />
      <CategoryList 
        categories={filteredCategories} 
        onCategoryClick={onCategoryClick} 
      />
    </div>
  );
};
