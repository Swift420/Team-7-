import React from 'react';
import { Headphones, Mail, Video, Layers, ListFilter, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { LiquidDerivativesPayload } from '../../types/liquid';

export type FormatTabId = 'audio' | 'newsletter' | 'video' | 'carousel' | 'factbox' | 'faq';

interface FormatTabsProps {
  activeTab: FormatTabId;
  onSelectTab: (tab: FormatTabId) => void;
  derivatives: LiquidDerivativesPayload | null;
}

export const FormatTabs: React.FC<FormatTabsProps> = ({
  activeTab,
  onSelectTab,
  derivatives,
}) => {
  const tabs = [
    {
      id: 'audio' as FormatTabId,
      name: 'Audio Brief (60s)',
      subtext: 'Commuter Express',
      icon: Headphones,
      approved: derivatives?.audioBrief?.approved ?? false,
    },
    {
      id: 'newsletter' as FormatTabId,
      name: 'Executive Brief',
      subtext: '3-Bullet Intelligence',
      icon: Mail,
      approved: derivatives?.executiveNewsletter?.approved ?? false,
    },
    {
      id: 'video' as FormatTabId,
      name: '60s Video (TikTok/Reels)',
      subtext: '9:16 Storyboard + Veo',
      icon: Video,
      approved: derivatives?.socialStoryboard?.approved ?? false,
    },
    {
      id: 'carousel' as FormatTabId,
      name: 'Instagram Carousel',
      subtext: '6-Slide Swipe Deck',
      icon: Layers,
      approved: derivatives?.instagramCarousel?.approved ?? false,
    },
    {
      id: 'factbox' as FormatTabId,
      name: 'Fact Box',
      subtext: 'Key Metrics Strip',
      icon: ListFilter,
      approved: derivatives?.factBox?.approved ?? false,
    },
    {
      id: 'faq' as FormatTabId,
      name: 'Dialectical FAQ',
      subtext: 'Deep-Dive Context',
      icon: HelpCircle,
      approved: derivatives?.dialecticalFaq?.approved ?? false,
    },
  ];

  return (
    <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-3 px-5 py-3.5 border-b-2 text-left transition-all whitespace-nowrap min-w-[190px] ${
              isActive
                ? 'border-red-600 bg-slate-900/90 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                isActive ? 'bg-red-600/20 text-red-400' : 'bg-slate-800/80 text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-semibold tracking-tight">{tab.name}</span>
                {tab.approved && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{tab.subtext}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

