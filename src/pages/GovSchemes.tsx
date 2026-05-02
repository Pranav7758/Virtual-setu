import React, { useState, useMemo, useCallback } from 'react';
import GovLayout, { GovCard, GovPageHeader } from '@/components/GovLayout';
import {
  Search, X, Bookmark, BookmarkCheck, ExternalLink, ChevronDown, ChevronUp,
  Filter, Sparkles, Globe, Calendar, CheckCircle, XCircle, BadgeInfo,
  Building2, Layers,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  GOV_SCHEMES, CATEGORIES, CATEGORY_ICONS,
  type GovScheme, type SchemeCategory, type TargetGender, type TargetIncome,
} from '@/data/govSchemes';

const BOOKMARK_KEY = 'vs_scheme_bookmarks';

function getBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function saveBookmarks(set: Set<string>) {
  try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...set])); } catch {}
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return status === 'active'
    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide"><CheckCircle className="h-2.5 w-2.5" /> Active</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide"><XCircle className="h-2.5 w-2.5" /> Inactive</span>;
}

function NewBadge() {
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#FF6200] text-white uppercase tracking-wide"><Sparkles className="h-2.5 w-2.5" /> New</span>;
}

function LevelBadge({ level }: { level: 'central' | 'state' }) {
  return level === 'central'
    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-blue-50 text-[#003580] border border-blue-200"><Building2 className="h-2.5 w-2.5" /> Central</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 border border-purple-200"><Globe className="h-2.5 w-2.5" /> State</span>;
}

interface SchemeDetailProps {
  scheme: GovScheme;
  onClose: () => void;
  bookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

function SchemeDetail({ scheme, onClose, bookmarked, onToggleBookmark }: SchemeDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-2xl rounded-sm border border-[#cdd3da] shadow-2xl my-4">

        {/* Modal header */}
        <div className="bg-[#003580] text-white px-6 py-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-sm">{CATEGORY_ICONS[scheme.category]} {scheme.category}</span>
              <StatusBadge status={scheme.status} />
              {scheme.isNew && <NewBadge />}
              <LevelBadge level={scheme.level} />
            </div>
            <h2 className="text-lg font-bold leading-tight">{scheme.name}</h2>
            <p className="text-blue-200 text-xs mt-0.5">{scheme.nameHindi}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <button onClick={() => onToggleBookmark(scheme.id)} className="p-1.5 rounded-sm bg-white/10 hover:bg-white/20 transition-colors" title="Bookmark">
              {bookmarked ? <BookmarkCheck className="h-4 w-4 text-amber-300" /> : <Bookmark className="h-4 w-4 text-white" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-sm bg-white/10 hover:bg-white/20 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[75vh] overflow-y-auto">

          {/* Ministry + Launch */}
          <div className="px-6 py-3 bg-[#f0f4fa] flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-[#003580]" /> {scheme.ministry}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#003580]" /> Launched: {new Date(scheme.launchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          {/* Description */}
          <div className="px-6 py-4">
            <p className="text-sm text-slate-700 leading-relaxed">{scheme.description}</p>
            <p className="text-xs text-slate-500 mt-2 italic">{scheme.objective}</p>
          </div>

          {/* Eligibility */}
          <Section title="Eligibility Criteria" icon="✅">
            <ul className="space-y-1">
              {scheme.eligibility.map((e, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="text-green-500 mt-0.5 shrink-0">•</span>{e}</li>)}
            </ul>
          </Section>

          {/* Benefits */}
          <Section title="Benefits & Support" icon="🎁">
            <ul className="space-y-1">
              {scheme.benefits.map((b, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="text-[#003580] mt-0.5 shrink-0">▸</span>{b}</li>)}
            </ul>
          </Section>

          {/* Required Documents */}
          <Section title="Required Documents" icon="📄">
            <div className="flex flex-wrap gap-1.5">
              {scheme.requiredDocuments.map((d, i) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-sm">{d}</span>
              ))}
            </div>
          </Section>

          {/* Application Process */}
          <Section title="How to Apply" icon="📝">
            <ol className="space-y-2">
              {scheme.applicationProcess.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#003580] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Section>

          {/* Official Link */}
          <div className="px-6 py-4">
            <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#003580] hover:bg-[#002060] text-white text-sm font-semibold rounded-sm transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Apply / Visit Official Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4">
      <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

interface SchemeCardProps {
  scheme: GovScheme;
  bookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onClick: () => void;
}

function SchemeCard({ scheme, bookmarked, onToggleBookmark, onClick }: SchemeCardProps) {
  return (
    <div className="bg-white border border-[#cdd3da] rounded-sm shadow-sm hover:shadow-md hover:border-[#003580]/40 transition-all group flex flex-col">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1">
            <StatusBadge status={scheme.status} />
            {scheme.isNew && <NewBadge />}
            <LevelBadge level={scheme.level} />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(scheme.id); }}
            className="p-1 rounded-sm text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors shrink-0"
            title={bookmarked ? 'Remove bookmark' : 'Bookmark this scheme'}
          >
            {bookmarked ? <BookmarkCheck className="h-4 w-4 text-amber-500" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">{CATEGORY_ICONS[scheme.category]}</span>
          <p className="font-bold text-slate-900 text-sm leading-tight group-hover:text-[#003580] transition-colors">{scheme.name}</p>
        </div>
        <p className="text-[11px] text-slate-400 mb-2">{scheme.nameHindi}</p>
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{scheme.description}</p>
      </div>

      {/* Card footer */}
      <div className="px-4 pb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          <span className="truncate max-w-[140px]">{scheme.ministry.replace('Ministry of ', '')}</span>
        </span>
        <button
          onClick={onClick}
          className="text-xs font-semibold text-[#003580] hover:underline flex items-center gap-1 shrink-0"
        >
          View Details <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function GovSchemes() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<SchemeCategory | 'All' | 'Bookmarked' | 'New'>('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'central' | 'state'>('all');
  const [filterGender, setFilterGender] = useState<TargetGender | 'all'>('all');
  const [filterIncome, setFilterIncome] = useState<TargetIncome | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(getBookmarks);
  const [selected, setSelected] = useState<GovScheme | null>(null);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveBookmarks(next);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = GOV_SCHEMES;

    if (activeCategory === 'Bookmarked') list = list.filter((s) => bookmarks.has(s.id));
    else if (activeCategory === 'New') list = list.filter((s) => s.isNew);
    else if (activeCategory !== 'All') list = list.filter((s) => s.category === activeCategory);

    if (filterStatus !== 'all') list = list.filter((s) => s.status === filterStatus);
    if (filterLevel !== 'all') list = list.filter((s) => s.level === filterLevel);
    if (filterGender !== 'all') list = list.filter((s) => s.targetGender === 'all' || s.targetGender === filterGender);
    if (filterIncome !== 'all') list = list.filter((s) => s.targetIncome === 'any' || s.targetIncome === filterIncome);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameHindi.includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.eligibility.some((e) => e.toLowerCase().includes(q)) ||
        s.benefits.some((b) => b.toLowerCase().includes(q)) ||
        s.ministry.toLowerCase().includes(q)
      );
    }

    return list;
  }, [search, activeCategory, filterStatus, filterLevel, filterGender, filterIncome, bookmarks]);

  const activeCount = GOV_SCHEMES.filter((s) => s.status === 'active').length;
  const newCount = GOV_SCHEMES.filter((s) => s.isNew).length;

  const QUICK_TABS = [
    { key: 'All' as const, label: `All (${GOV_SCHEMES.length})` },
    { key: 'New' as const, label: `🆕 New (${newCount})` },
    { key: 'Bookmarked' as const, label: `🔖 Saved (${bookmarks.size})` },
  ];

  const hasActiveFilters = filterStatus !== 'all' || filterLevel !== 'all' || filterGender !== 'all' || filterIncome !== 'all';

  return (
    <GovLayout>
      <GovPageHeader
        breadcrumb="Citizen Portal · Government Schemes"
        title="Government Schemes Directory"
        subtitle="Browse all central and state government schemes, benefits and programmes"
      />

      <section className="container mx-auto max-w-7xl px-4 py-6 space-y-5">

        {/* Stats bar */}
        <GovCard className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
          {[
            { value: GOV_SCHEMES.length, label: 'Total Schemes' },
            { value: activeCount, label: 'Active Schemes' },
            { value: newCount, label: 'Newly Launched' },
            { value: CATEGORIES.length, label: 'Categories' },
          ].map((s) => (
            <div key={s.label} className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-[#003580]">{s.value}+</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </GovCard>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schemes by name, category, eligibility, benefit..."
              className="pl-9 pr-9 h-9 text-sm bg-white border-[#cdd3da] rounded-sm focus-visible:ring-[#003580]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-sm transition-colors h-9 ${
              hasActiveFilters || showFilters
                ? 'bg-[#003580] text-white border-[#003580]'
                : 'bg-white text-slate-700 border-[#cdd3da] hover:border-[#003580] hover:text-[#003580]'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters {hasActiveFilters && <span className="bg-white text-[#003580] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">!</span>}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <GovCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-900 text-sm">Advanced Filters</p>
              {hasActiveFilters && (
                <button onClick={() => { setFilterStatus('all'); setFilterLevel('all'); setFilterGender('all'); setFilterIncome('all'); }}
                  className="text-xs text-red-600 hover:underline">Clear all filters</button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FilterGroup label="Status" value={filterStatus} onChange={(v) => setFilterStatus(v as any)}
                options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
              <FilterGroup label="Level" value={filterLevel} onChange={(v) => setFilterLevel(v as any)}
                options={[{ value: 'all', label: 'All' }, { value: 'central', label: 'Central Govt' }, { value: 'state', label: 'State Govt' }]} />
              <FilterGroup label="For Gender" value={filterGender} onChange={(v) => setFilterGender(v as any)}
                options={[{ value: 'all', label: 'All' }, { value: 'female', label: 'Women Only' }, { value: 'male', label: 'Men Only' }]} />
              <FilterGroup label="Income Group" value={filterIncome} onChange={(v) => setFilterIncome(v as any)}
                options={[{ value: 'all', label: 'All' }, { value: 'bpl', label: 'BPL / Poor' }, { value: 'low', label: 'Low Income' }, { value: 'middle', label: 'Middle Income' }]} />
            </div>
          </GovCard>
        )}

        {/* Quick tab row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {QUICK_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveCategory(tab.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-sm border transition-colors ${
                activeCategory === tab.key
                  ? 'bg-[#003580] text-white border-[#003580]'
                  : 'bg-white text-slate-700 border-[#cdd3da] hover:border-[#003580] hover:text-[#003580]'
              }`}>
              {tab.label}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-sm border transition-colors ${
                activeCategory === cat
                  ? 'bg-[#003580] text-white border-[#003580]'
                  : 'bg-white text-slate-700 border-[#cdd3da] hover:border-[#003580] hover:text-[#003580]'
              }`}>
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> scheme{filtered.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' && <span className="text-[#003580]"> in <span className="font-semibold">{activeCategory}</span></span>}
            {search && <span className="text-[#003580]"> matching <span className="font-semibold">"{search}"</span></span>}
          </p>
          {(activeCategory !== 'All' || search || hasActiveFilters) && (
            <button onClick={() => { setSearch(''); setActiveCategory('All'); setFilterStatus('all'); setFilterLevel('all'); setFilterGender('all'); setFilterIncome('all'); }}
              className="text-xs text-[#003580] hover:underline flex items-center gap-1">
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>

        {/* Scheme grid */}
        {filtered.length === 0 ? (
          <GovCard className="py-16 text-center">
            <BadgeInfo className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No schemes found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); setFilterStatus('all'); setFilterLevel('all'); setFilterGender('all'); setFilterIncome('all'); }}
              className="mt-4 text-sm text-[#003580] font-semibold hover:underline">View all schemes</button>
          </GovCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                bookmarked={bookmarks.has(scheme.id)}
                onToggleBookmark={toggleBookmark}
                onClick={() => setSelected(scheme)}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="text-[11px] text-slate-400 text-center pb-2">
          Information sourced from official government portals. For most current details, always verify at the official scheme website. Last updated: May 2025.
        </div>
      </section>

      {/* Detail modal */}
      {selected && (
        <SchemeDetail
          scheme={selected}
          onClose={() => setSelected(null)}
          bookmarked={bookmarks.has(selected.id)}
          onToggleBookmark={toggleBookmark}
        />
      )}
    </GovLayout>
  );
}

function FilterGroup({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-col gap-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={label} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)}
              className="accent-[#003580] h-3 w-3" />
            <span className={`text-xs ${value === o.value ? 'font-semibold text-[#003580]' : 'text-slate-600'}`}>{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
