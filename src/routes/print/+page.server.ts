import { listPages } from '$lib/server/pages';
import { listSections } from '$lib/server/sections';
import { getSettings } from '$lib/server/settings';

export function load() {
  const settings = getSettings();
  const sections = listSections().map((section) => ({
    id: section.id,
    name: section.name,
    icon: section.icon,
    description: section.description,
    pages: listPages(section.id).map((page) => ({
      id: page.id,
      title: page.title,
      pinned: page.pinned
    }))
  }));

  return {
    bookTitle: settings.book_title,
    sections,
    totalPages: sections.reduce((total, section) => total + section.pages.length, 0)
  };
}
