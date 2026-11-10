/* Small, deterministic helpers shared by the screen and printable guide. */
(() => {
  'use strict';
  const japanDate = timestamp => new Date(timestamp + 9 * 60 * 60 * 1000);
  const period = timestamp => {
    const hour = japanDate(timestamp).getUTCHours();
    return hour >= 5 && hour < 10 ? 'morning' : hour >= 10 && hour < 16 ? 'day' : hour >= 16 && hour < 18 ? 'evening' : 'night';
  };
  const japanDay = timestamp => japanDate(timestamp).toISOString().slice(0, 10);
  const mapURL = query => typeof query === 'string' && query.trim()
    ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query.trim()) : null;
  const stampState = (raw, validIds) => {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.collected)) return [];
      return [...new Set(parsed.collected.filter(id => validIds.includes(id)))];
    } catch (_) { return []; }
  };
  const guideDays = data => (data.itinerary || []).map((day, i) => {
    const route = data.drivePlan?.schedules?.find(item => item.day === i + 1)?.options?.find(item => item.roadId === day.defaultRoadId);
    const stops = (route?.stops || []).map(stop => ({time: stop.time, name: stop.name, status: '仮案'}));
    if (i === 0) stops.push({time: data.booking?.dinner?.startTime || '未確認', name: '家族で夕食', status: data.booking?.dinner?.startTime ? '予約指定' : '未確認'});
    return {label: day.tabLabel, route: route?.title || 'ルート未確認', stops};
  });
  window.TRAVEL_UTILS = Object.freeze({period, japanDay, mapURL, stampState, guideDays});
})();
