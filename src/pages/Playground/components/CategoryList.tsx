import { useMemo } from 'react';
import ReactCountryFlag from "react-country-flag";
import { SiNetflix, SiHbo, SiSky, SiF1, SiParamountplus, SiZdf, SiDaserste } from "react-icons/si";
import { TbBrandDisney } from "react-icons/tb";
import { FaAmazon, FaGooglePlay, FaApple } from "react-icons/fa";
import { FcBbc } from "react-icons/fc";

import type { Category } from '../../../types/playlist';

interface CategoryListProps {
  categories: Category[];
  onCategoryClick: (categoryId: string, categoryName: string) => void;
}

// Badge configuration is unchanged and perfect
const BADGE_CONFIG = [
  { key: 'netflix', keyword: 'netflix', Icon: SiNetflix, color: '#E50914' },
  { key: 'disney', keyword: 'disney', Icon: TbBrandDisney, color: '#0063E5' },
  { key: 'amazon', keyword: 'amazon', Icon: FaAmazon, color: '#FF9900' },
  { key: 'prime', keyword: 'prime serien', Icon: FaAmazon, color: '#FF9900' },
  { key: 'google', keyword: 'google', Icon: FaGooglePlay, color: '#4285F4' },
  { key: 'apple', keyword: 'apple', Icon: FaApple, color: '#A2AAAD' },
  { key: 'hbo', keyword: 'hbo', Icon: SiHbo, color: '#000000' },
  { key: 'sky', keyword: 'sky', Icon: SiSky, color: '#0070D2' },
  { key: 'f1', keyword: 'f1', Icon: SiF1, color: '#fc240b' },
  { key: 'paramount', keyword: 'paramount', Icon: SiParamountplus, color: '#0969ff' },
  { key: 'bbc', keyword: 'bbc', Icon: FcBbc, color: '#000000' },
  { key: 'zdf', keyword: 'zdf', Icon: SiZdf, color: '#fa7d19' },
  { key: 'ard', keyword: 'ard', Icon: SiDaserste, color: '#083a84' },
];

const Badge = ({ Icon, color }: { Icon: React.ElementType, color: string }) => (
  <span 
    className="flex items-center justify-center w-8 h-5 rounded" // Slightly smaller badges
    style={{ backgroundColor: color }}
  >
    <Icon className="w-3 h-3 text-white" />
  </span>
);

export const CategoryList = ({ categories, onCategoryClick }: CategoryListProps) => {

  // Your data processing logic is unchanged
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
    // Themed main container
    <div className="bg-background-secondary p-4 rounded-lg border border-border-primary">
      <h2 className="text-xl font-bold mb-4 text-text-primary">Categories <span className="text-text-tertiary">({categories.length})</span></h2>
      {categories.length > 0 ? (
        <ul className="space-y-2">
          {processedCategories.map(category => (
            // The list item is now a button for better accessibility and focus handling
            <li key={category.category_id}>
              <button
                className="w-full p-3 bg-background-primary rounded-lg hover:bg-background-glass focus:outline-none focus:ring-2 focus:ring-primary-focus focus:scale-[1.02] transition-all duration-150 flex justify-between items-center text-left"
                onClick={() => onCategoryClick(category.category_id, category.category_name)}
              >
                <p className="font-semibold flex items-center text-text-primary">
                  <ReactCountryFlag countryCode={category.flag} svg style={{ width: '1.2em', height: '1.em', marginRight: '0.75em' }} />
                  {category.displayName}
                </p>
                <div className="flex items-center space-x-1">
                  {category.badges}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-tertiary">No categories found matching your filters.</p>
      )}
    </div>
  );
};