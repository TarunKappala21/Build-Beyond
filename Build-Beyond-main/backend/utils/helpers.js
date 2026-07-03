function calculateProgress(startDate, timeline) {
  if (!timeline) return 0;
  const start = new Date(startDate);
  const now = new Date();
  const end = new Date(start.setMonth(start.getMonth() + timeline));
  const totalDays = (end - start) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
  return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
}

function calculateDaysRemaining(startDate, timeline) {
  if (!timeline) return 'TBD';
  const start = new Date(startDate);
  const end = new Date(start.setMonth(start.getMonth() + timeline));
  const now = new Date();
  return Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));
}

function getTargetDate(createdAt, projectTimeline) {
  if (!createdAt || !projectTimeline || isNaN(parseInt(projectTimeline))) return 'June 2025';
  try {
    const targetDate = new Date(createdAt);
    targetDate.setMonth(targetDate.getMonth() + parseInt(projectTimeline));
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
  } catch (error) {
    return 'June 2025';
  }
}

module.exports = { calculateProgress, calculateDaysRemaining, getTargetDate };