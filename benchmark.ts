const tasks = Array.from({ length: 10000 }, (_, i) => ({
  status: ["done", "in-progress", "todo"][i % 3],
}));

const subjects = Array.from({ length: 100 }, (_, i) => ({
  id: `sub_${i}`,
  name: `Subject ${i}`,
  total_classes: 20,
}));

const absences = Array.from({ length: 5000 }, (_, i) => ({
  subject_id: `sub_${i % 100}`,
  calculated_value: 1,
}));

console.time("Baseline");
for (let i = 0; i < 100; i++) {
  const taskStatusData = [
    {
      name: "Completadas",
      value: tasks.filter((t) => t.status === "done").length,
      fill: "success",
    },
    {
      name: "En Proceso",
      value: tasks.filter((t) => t.status === "in-progress").length,
      fill: "info",
    },
    {
      name: "Pendientes",
      value: tasks.filter((t) => t.status === "todo").length,
      fill: "warning",
    },
  ].filter((d) => d.value > 0);

  const attendanceData = subjects.map((s) => {
    const subjectAbsences = absences.filter((a) => a.subject_id === s.id);
    const totalAbsenceValue = subjectAbsences.reduce(
      (sum, a) => sum + (a.calculated_value || 0),
      0,
    );
    const percentage =
      s.total_classes > 0
        ? Math.max(0, Math.round(((s.total_classes - totalAbsenceValue) / s.total_classes) * 100))
        : 100;
    return { name: s.name, asistencia: percentage };
  });
}
console.timeEnd("Baseline");

console.time("Optimized");
for (let i = 0; i < 100; i++) {
  let doneCount = 0;
  let inProgressCount = 0;
  let todoCount = 0;

  for (const t of tasks) {
    if (t.status === "done") doneCount++;
    else if (t.status === "in-progress") inProgressCount++;
    else if (t.status === "todo") todoCount++;
  }

  const taskStatusData = [
    {
      name: "Completadas",
      value: doneCount,
      fill: "success",
    },
    {
      name: "En Proceso",
      value: inProgressCount,
      fill: "info",
    },
    {
      name: "Pendientes",
      value: todoCount,
      fill: "warning",
    },
  ].filter((d) => d.value > 0);

  const absencesBySubject: Record<string, number> = {};
  for (const a of absences) {
    absencesBySubject[a.subject_id] =
      (absencesBySubject[a.subject_id] || 0) + (a.calculated_value || 0);
  }

  const attendanceData = subjects.map((s) => {
    const totalAbsenceValue = absencesBySubject[s.id] || 0;
    const percentage =
      s.total_classes > 0
        ? Math.max(0, Math.round(((s.total_classes - totalAbsenceValue) / s.total_classes) * 100))
        : 100;
    return { name: s.name, asistencia: percentage };
  });
}
console.timeEnd("Optimized");
