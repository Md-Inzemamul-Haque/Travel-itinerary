export const shareLinkGenerator = (itinerary_id) => {
  const shareLink = `http://${process.env.HOST}:${process.env.PORT}/api/itineraries/share/${itinerary_id}`;
  return shareLink;
};
