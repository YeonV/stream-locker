import { useMemo } from 'react';
import ReactCountryFlag from "react-country-flag";
import { SiNetflix, SiHbo, SiSky, SiF1 } from "react-icons/si";
import { TbBrandDisney } from "react-icons/tb";
import { FaAmazon, FaGooglePlay, FaApple } from "react-icons/fa";
import type { Category } from '../../../types/playlist';

interface CategoryListProps {
  categories: Category[];
  // --- THIS IS THE FIX ---
  // The signature now correctly accepts both id and name.
  onCategoryClick: (categoryId: string, categoryName: string) => void;
}

const BADGE_CONFIG = [
  { key: 'netflix', keyword: 'netflix', Icon: SiNetflix, color: '#E50914' },
  { key: 'disney', keyword: 'disney', Icon: TbBrandDisney, color: '#0063E5' },
  { key: 'amazon', keyword: 'amazon', Icon: FaAmazon, color: '#FF9900' },
  { key: 'google', keyword: 'google', Icon: FaGooglePlay, color: '#4285F4' },
  { key: 'apple', keyword: 'apple', Icon: FaApple, color: '#A2AAAD' },
  { key: 'hbo', keyword: 'hbo', Icon: SiHbo, color: '#8A2BE2' },
  { key: 'sky', keyword: 'sky', Icon: SiSky, color: '#0070D2' },
  { key: 'f1', keyword: 'f1', Icon: SiF1, color: '#E10600' },
];

const Badge = ({ Icon, color }: { Icon: React.ElementType, color: string }) => (
  <span 
    className="flex items-center justify-center w-10 h-6 rounded"
    style={{ backgroundColor: color }}
  >
    <Icon className="w-4 h-4 text-white" />
  </span>
);

export const CategoryList = ({ categories, onCategoryClick }: CategoryListProps) => {

  const processedCategories = useMemo(() => {
    return categories
      .map(category => {
        const lowerCaseName = category.category_name.toLowerCase();
        let country = 'eu';
        let displayName = category.category_name;
        if (category.category_name.includes(" | ")) {
          const parts = category.category_name.split(" | ");
          country = parts[0].toLowerCase();
          displayName = parts[1];
        }
        const flag = (country === 'en' ? 'us' : country === 'uk' ? 'gb' : country === 'all' ? 'eu' : country === 'ws' ? 'eu' : country === 'usa' ? 'us' : country);
        const badges = BADGE_CONFIG
          .filter(config => lowerCaseName.includes(config.keyword))
          .map(config => <Badge key={config.key} Icon={config.Icon} color={config.color} />);

        return { ...category, displayName, flag, badges };
      })
      .sort((a, b) => b.badges.length - a.badges.length);
  }, [categories]);


  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Categories ({categories.length})</h2>
      {categories.length > 0 ? (
        <ul className="space-y-2">
          {processedCategories.map(category => (
            <li
              key={category.category_id}
              className="p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors flex justify-between items-center cursor-pointer"
              // --- THIS IS THE FIX ---
              // The onClick handler now passes both the ID and the original, full name.
              onClick={() => onCategoryClick(category.category_id, category.category_name)}
            >
              <p className="font-semibold flex items-center">
                <ReactCountryFlag countryCode={category.flag} svg style={{ width: '1.2em', height: '1.2em', marginRight: '0.75em' }} />
                {category.displayName}
              </p>
              <div className="flex items-center space-x-1">
                {category.badges}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No categories found matching your filters.</p>
      )}
    </div>
  );
};