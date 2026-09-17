export function getTrailerVideos(game) {
  const videos = game?.videos || [];

  return videos.filter(
    (video) =>
      String(video.category || '').toLowerCase() === 'trailer'
  );
}