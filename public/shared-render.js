// Shared rendering primitives used by Team pages.
const sharedRender = {
  dateFilter(container, currentMode, onChange) {
    renderDateFilterChips(container, currentMode, onChange);
  },

  categoryBadge(categories, categoryId) {
    return categoryBadge(categories, categoryId);
  },

  categoryFilter(container, categories, selectedIds, onChange) {
    renderCategoryFilterChips(container, categories, selectedIds, onChange);
  },

  subscribeBox(container, url, label) {
    renderSubscribeBox(container, url, label);
  },
};
