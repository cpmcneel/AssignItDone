export function toAssignment(task) {
  return {
    id: task.id,
    classId: task.classId,
    course: task.className,
    title: task.title,
    dueDate: task.dueDate,
    minutes: task.estimatedMinutes,
    priority: task.priority[0] + task.priority.slice(1).toLowerCase(),
    details: task.note,
    completed: task.completed,
  };
}

export function toTaskRequest(assignment) {
  return {
    classId: assignment.classId,
    title: assignment.title,
    dueDate: assignment.dueDate,
    estimatedMinutes: Number(assignment.minutes),
    priority: assignment.priority.toUpperCase(),
    note: assignment.details || null,
    completed: assignment.completed ?? false,
  };
}
