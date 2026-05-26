import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Map, ArrowRight, Sparkles } from 'lucide-react';
import { ROADMAP_INDEX, ROADMAP_CATEGORIES } from '../data/roadmapIndex';

export default function RoadmapsHub() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter logic
  const filteredRoadmaps = ROADMAP_INDEX.filter((roadmap) => {
    const matchesCategory = activeCategory === "All" || roadmap.category === activeCategory;
    const matchesSearch = roadmap.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Career Roadmaps
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Step-by-step career paths, verified by industry data. Choose your target role and let our engine calculate your fastest route to production-ready skills.
          </p>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 hide-scrollbar">
            {ROADMAP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search careers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoadmaps.map((roadmap) => (
            <Link 
              key={roadmap.id} 
              to={`/roadmap/${roadmap.id}`}
              className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
            >
              {/* Popular Badge */}
              {roadmap.isPopular && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <Sparkles size={12} /> Hot
                </div>
              )}

              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Map className="text-slate-700" size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">{roadmap.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">
                {roadmap.description}
              </p>
              
              <div className="flex items-center text-sm font-bold text-indigo-600 group-hover:text-indigo-700 mt-auto">
                View Roadmap <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" size={16} />
              </div>
            </Link>
          ))}
        </div>

        {filteredRoadmaps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium">No roadmaps found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}