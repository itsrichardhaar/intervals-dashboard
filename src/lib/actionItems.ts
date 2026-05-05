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
