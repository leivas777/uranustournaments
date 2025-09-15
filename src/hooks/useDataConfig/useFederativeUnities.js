import { useEffect, useState } from "react";
import axios from "axios";

let cachedFederativeUnities = null;
let cachedCities = {}

function useFederativeUnitiesList() {
  const [data, setData] = useState(cachedFederativeUnities || []);
  const [loading, setLoading] = useState(!cachedFederativeUnities);
  const [error, setError] = useState(null);

  useEffect(() => {
    if(!cachedFederativeUnities){
        setLoading(true)
        axios
        .get("http://localhost:3001/api/locations/federative-unities")
        .then((res) => {
          const statesData = res.data.data || res.data| []
          cachedFederativeUnities = statesData
          setData(statesData)
          setLoading(false)
        })
        .catch((err) => {
          console.log("Erro ao buscar estados:", err)
            setError(err)
            setLoading(false)
        })
    }

  }, []);
  return {data, loading, error};
}

function useCities(stateId) {
    const [data, setData] = useState(cachedCities[stateId] || []);
  const [loading, setLoading] = useState(!cachedCities[stateId]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if(!stateId){
        setData([])
        setLoading(false)
        setError(null)
        return
    }
    if(cachedCities[stateId]){
        setData(cachedCities[stateId])
        setLoading(false)
        setError(null)
        return
    }

    setLoading(true)

    axios
    .get(`http://localhost:3001/api/locations/cities/${stateId}`)
    .then((res) => {
      const citiesData = res.data.data || res.data || []
        cachedCities = citiesData
        setData(cachedCities)
        setLoading(false)
    })
    .catch((err) => {
        setError(err)
        setLoading(false)
    })
  }, [stateId]);
  return {data, loading, error};
}

export { useFederativeUnitiesList, useCities };
