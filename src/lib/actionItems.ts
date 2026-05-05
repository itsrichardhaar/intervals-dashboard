export function validateActionItemInput(data: {
  description: string;
  assigneeId: string;
}): string | null {
  if (!data.description?.trim()) {
    return "Description is required";
  }
  if (!data.assigneeId) {
    return "Assignee is required";
  }
  return null;
}

function startOfCurrentWeek(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-based
  now.setDate(now.getDate() + diff);
  return now;
}

export function isCarriedOver(item: {
  createdAt: Date;
  completedAt: Date | null;
}): boolean {
  if (item.completedAt) return false;
  return item.createdAt < startOfCurrentWeek();
}

export function isActionItemOverdue(item: {
  dueDate: Date | null;
  completedAt: Date | null;
}): boolean {
  if (item.completedAt) return false;
  if (!item.dueDate) return false;
  return item.dueDate < new Date();
}
