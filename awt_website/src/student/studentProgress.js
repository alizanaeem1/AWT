export function getProgressRecord(records, type, contentId) {
  return records.find((record) => record.content_type === type && record.content_id === contentId)
}

export function getItemProgress(records, type, contentId, readIds) {
  const record = getProgressRecord(records, type, contentId)
  if (record) return Number(record.percent) || 0
  return readIds?.has(contentId) ? 100 : 0
}

export function getItemStatus(percent) {
  return percent >= 100 ? 'Completed' : percent > 0 ? 'In Progress' : 'Not Started'
}

export function calculateStudentStats({ lectures, labs, records, readIds }) {
  const completedLectures = lectures.filter((lecture) => getItemProgress(records, 'lecture', lecture.id, readIds) >= 100)
  const completedLabs = labs.filter((lab) => getItemProgress(records, 'lab', lab.id, readIds) >= 100)
  const totalTrackable = lectures.length + labs.length
  const completedTotal = completedLectures.length + completedLabs.length

  return {
    totalLectures: lectures.length,
    totalLabs: labs.length,
    completedLectures: completedLectures.length,
    completedLabs: completedLabs.length,
    overallProgress: totalTrackable ? Math.round((completedTotal / totalTrackable) * 100) : 0,
    recentCompleted: records.filter((record) => record.status === 'completed' || record.percent === 100).slice(0, 5)
  }
}
