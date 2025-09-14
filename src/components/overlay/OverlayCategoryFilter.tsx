import React from "react";

interface OverlayCategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onChange: (cat: string) => void;
}

const OverlayCategoryFilter: React.FC<OverlayCategoryFilterProps> = ({
  categories,
  selectedCategory,
  onChange,
}) => (
  <div className="overlay-category-filter">
    <span>Kategorie:</span>
    <select value={selectedCategory} onChange={e => onChange(e.target.value)}>
      <option value="">Alle Kategorien</option>
      {categories.map(cat => (
        <option value={cat} key={cat}>
          {cat}
        </option>
      ))}
    </select>
  </div>
);

export default OverlayCategoryFilter;
