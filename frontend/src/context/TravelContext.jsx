import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const TravelContext = createContext();

export function TravelProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("travelmate_user") || "null"));
  const [destinations, setDestinations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [d, p] = await Promise.all([api.get("/destinations"), api.get("/packages")]);
      setDestinations(d.data || []);
      setPackages(p.data || []);
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError("Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadData(); }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("travelmate_token", data.token);
    localStorage.setItem("travelmate_user", JSON.stringify(data.user));
    setUser(data.user);
  }
  async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("travelmate_token", data.token);
    localStorage.setItem("travelmate_user", JSON.stringify(data.user));
    setUser(data.user);
  }
  function logout() {
    localStorage.removeItem("travelmate_token");
    localStorage.removeItem("travelmate_user");
    setUser(null);
  }
  return <TravelContext.Provider value={{ user, destinations, packages, loading, error, loadData, login, register, logout }}>{children}</TravelContext.Provider>;
}
export const useTravel = () => useContext(TravelContext);
