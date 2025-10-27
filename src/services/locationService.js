export const detectLocation = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported");
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        const district = data.address?.county || data.address?.state_district || data.address?.state;
        resolve(district);
      },
      (err) => reject(err.message)
    );
  });
};
