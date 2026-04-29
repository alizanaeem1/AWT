/**
 * Shared CGPA display (same on Semesters + Dashboard). Uses server cumulative
 * from graded courses when available; else weighted over all terms with a GPA.
 */

export function termGpaNum(s) {
  if (s?.gpa == null || s.gpa === "") return null;
  const n = Number(s.gpa);
  return Number.isNaN(n) ? null : n;
}

export function termWeightForOverall(s) {
  const fromCourses = Number(s.creditsFromSubjects) || 0;
  if (fromCourses > 0) return fromCourses;
  const planned = s.totalCreditHours;
  if (planned != null) {
    const p = Number(planned);
    if (Number.isFinite(p) && p > 0) return p;
  }
  return 1;
}

/**
 * @param {Array<object>|undefined} semesters
 * @param {number|null|undefined} overallCgpa - from semester list API (pooled graded courses)
 * @returns {string} e.g. "3.50" or "—"
 */
export function computeCgpaDisplay(semesters, overallCgpa) {
  if (overallCgpa != null && Number.isFinite(overallCgpa)) {
    return overallCgpa.toFixed(2);
  }
  const list = semesters || [];
  const termsWithGpa = list.filter((s) => termGpaNum(s) != null);
  if (!termsWithGpa.length) return "—";
  const num = termsWithGpa.reduce((a, s) => a + termGpaNum(s) * termWeightForOverall(s), 0);
  const den = termsWithGpa.reduce((a, s) => a + termWeightForOverall(s), 0);
  if (den <= 0) return "—";
  return (num / den).toFixed(2);
}
