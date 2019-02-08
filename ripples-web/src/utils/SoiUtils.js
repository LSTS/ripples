const apiURL = process.env.REACT_APP_API_URL

export function fetchSoiData() {
  return fetch(`${apiURL}/soi`)
    .then(response => response.json())
    .then((data) => {
      let vehicles = [];
      let spots = [];
      data.forEach(system => {
        if (system.name.startsWith('spot')) {
          spots.push(system)
        } else {
          vehicles.push(system)
        }
      })
      return { vehicles: vehicles, spots: spots };
    });
}

export function fetchProfileData(){
  return fetch(`${apiURL}/soi/profiles`)
    .then(response => response.json())
    .then((data) => {
      console.log('profile data:', data)
      return data;
    })
}