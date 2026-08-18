'use client';
import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  homeHref?: string;
}

export function Breadcrumbs({ items, homeHref = '/dashboard' }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
      <Link
        href={homeHref}
        className="flex items-center gap-1 text-slate-500 hover:text-blue-900 transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            {isLast || !item.href ? (
              <span className="font-bold text-slate-900 truncate max-w-[200px]">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-slate-500 hover:text-blue-900 transition-colors font-medium truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
