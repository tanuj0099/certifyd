import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Map, ArrowRight, Sparkles } from 'lucide-react';
import { ROADMAP_INDEX, ROADMAP_CATEGORIES } from '../data/roadmapIndex';

export default function RoadmapsHub() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoadmaps = ROADMAP_INDEX.filter((roadmap) => {
    const matchesCategory = activeCategory === 'All' || roadmap.category === activeCategory;
    const matchesSearch = roadmap.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    /*
      ── Root wrapper ──────────────────────────────────────────────────
      BEFORE: bg-slate-50 — hardcoded light colour, breaks dark theme
      AFTER:  bg-[var(--bg)] — follows the CSS variable theme system

      overflow-x-hidden prevents any child from causing horizontal scroll.
      page-top-pad (defined in index.css) gives correct nav clearance:
        mobile: 104px, desktop: 112px
    */
    <div
      className="min-h-screen overflow-x-hidden page-top-pad pb-20"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/*
        ── Page inner ────────────────────────────────────────────────
        Mobile:  px-4  (16px) — tight but breathable on 375px
        Tablet:  px-6  (24px)
        Desktop: px-8  (32px) — generous
        max-w-6xl keeps content from stretching too wide on ultrawide
      */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="mb-8 md:mb-12">
          {/*
            BEFORE: text-4xl — 36px on mobile, wraps on 375px
            AFTER:  text-2xl → text-3xl → text-4xl — smooth scale
          */}
          <h1
            className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 md:mb-4"
            style={{ color: 'var(--text)' }}
          >
            Career Roadmaps
          </h1>
          <p
            className="text-sm md:text-lg max-w-2xl leading-relaxed"
            style={{ color: 'var(--text-3)' }}
          >
            Step-by-step career paths, verified by industry data. Choose your target role and
            let our engine calculate your fastest route to production-ready skills.
          </p>
        </div>

        {/* ── Filters & Search ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">

          {/*
            Filter pills — horizontally scrollable on mobile.
            min-h-[44px] on each pill meets Apple/Google 44px touch target.
          */}
          <div
            className="flex overflow-x-auto gap-2 pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {ROADMAP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  flex-shrink-0 min-h-[44px] px-4 py-2 rounded-full text-sm font-bold
                  transition-all whitespace-nowrap
                  ${activeCategory === cat
                    ? 'text-white shadow-md'
                    : 'border hover:border-slate-300 hover:bg-slate-50/10'
                  }
                `}
                style={
                  activeCategory === cat
                    ? { background: 'var(--text)', color: 'var(--bg)', border: '1px solid var(--text)' }
                    : { background: 'transparent', color: 'var(--text-3)', border: '1px solid var(--border)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/*
            Search input — full width on mobile, fixed width on desktop.
            min-h-[48px] meets the 48px fat-finger minimum for form inputs.
            font-size: 16px prevents iOS auto-zoom on focus.
          */}
          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={18}
              style={{ color: 'var(--text-4)' }}
            />
            <input
              type="text"
              placeholder="Search careers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 rounded-xl text-sm focus:outline-none transition-all"
              style={{
                minHeight: '48px',
                background: 'var(--bg-alt)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '16px', /* prevents iOS zoom */
              }}
            />
          </div>
        </div>

        {/* ── Roadmap grid ── */}
        {/*
          grid-cols-1 on mobile — full-width cards, easy to tap
          md:grid-cols-2 on tablet
          lg:grid-cols-3 on desktop
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredRoadmaps.map((roadmap) => (
            <Link
              key={roadmap.id}
              to={`/roadmap/${roadmap.id}`}
              className="group flex flex-col h-full relative overflow-hidden rounded-2xl transition-all duration-300"
              style={{
                background: 'var(--bg-alt)',
                border: '1px solid var(--border)',
                padding: '20px',
              }}
              /*
                hover:shadow-xl and hover:border change — desktop only via md: prefix
                to avoid jarring layout shifts when scrolling on touch screens.
              */
            >
              {/* Popular badge */}
              {roadmap.isPopular && (
                <div
                  className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                >
                  <Sparkles size={12} /> Hot
                </div>
              )}

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 md:group-hover:scale-110 transition-transform duration-300"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <Map style={{ color: 'var(--text-2)' }} size={22} />
              </div>

              {/* Title */}
              <h3
                className="text-base md:text-lg font-bold mb-2 leading-snug"
                style={{ color: 'var(--text)' }}
              >
                {roadmap.title}
              </h3>

              {/* Description */}
              <p
                className="text-sm leading-relaxed mb-5 flex-grow line-clamp-3"
                style={{ color: 'var(--text-3)' }}
              >
                {roadmap.description}
              </p>

              {/* CTA row — min-h-[44px] for touch target */}
              <div
                className="flex items-center text-sm font-bold mt-auto min-h-[44px]"
                style={{ color: 'var(--accent)' }}
              >
                View Roadmap
                <ArrowRight
                  className="ml-1 md:group-hover:translate-x-1 transition-transform"
                  size={16}
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {filteredRoadmaps.length === 0 && (
          <div className="text-center py-16 md:py-20">
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>
              No roadmaps found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
