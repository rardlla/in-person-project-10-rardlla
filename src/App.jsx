
import React, { useState, useEffect, useRef, useCallback } from 'react';
import WeatherCard from './components/WeatherCard';
import ForecastCard from './components/ForecastCard';
import NewsCard from './components/NewsCard';
import AlertsCard from './components/AlertsCard';
import SearchBar from './components/SearchBar';
import StatusBar from './components/StatusBar';
import { fetchDashboardData } from './services/dashboardService';
import { usePolling } from './hooks/usePolling';

function App() {
  const [city, setCity] = useState('San Francisco');

  const [dashboardData, setDashboardData] = useState({
    weather: null,
    forecast: null,
    news: null,
    alerts: null
  });

  const [loading, setLoading] = useState({
    weather: false,
    forecast: false,
    news: false,
    alerts: false
  });

  const [errors, setErrors] = useState({
    weather: null,
    forecast: null,
    news: null,
    alerts: null
  });

  // Track active requests to avoid overlapping fetches
  const activeRequests = useRef(new Set());

  // Track the latest selected city
  const currentCityRef = useRef(city);
  currentCityRef.current = city;

  // Fetch dashboard data
  const fetchAllData = useCallback(async (cityName) => {
    // Prevent duplicate requests for the same city
    if (activeRequests.current.has(cityName)) {
      return;
    }

    activeRequests.current.add(cityName);

    setLoading({
      weather: true,
      forecast: true,
      news: true,
      alerts: true
    });

    try {
      const { data, errors: fetchErrors } =
        await fetchDashboardData(cityName);

      // Only update if this is still the selected city
      if (currentCityRef.current === cityName) {
        setDashboardData(prev => ({
          ...prev,
          ...data
        }));

        setErrors(fetchErrors);
      }
    } catch (error) {
      console.error('Dashboard fetch failed:', error);

      if (currentCityRef.current === cityName) {
        setErrors({
          weather: error.message,
          forecast: error.message,
          news: error.message,
          alerts: error.message
        });
      }
    } finally {
      activeRequests.current.delete(cityName);

      if (currentCityRef.current === cityName) {
        setLoading({
          weather: false,
          forecast: false,
          news: false,
          alerts: false
        });
      }
    }
  }, []);

  // Poll automatically every 30 seconds
  const { refresh } = usePolling(
    () => fetchAllData(city),
    30000,
    true
  );

  // Fetch immediately when the selected city changes
  // The polling hook handles the initial fetch
  const previousCityRef = useRef(city);

  useEffect(() => {
    if (previousCityRef.current !== city) {
      previousCityRef.current = city;

      setDashboardData({
        weather: null,
        forecast: null,
        news: null,
        alerts: null
      });

      fetchAllData(city);
    }
  }, [city, fetchAllData]);

  const handleRefresh = () => {
    refresh();
  };

  const handleCityChange = (newCity) => {
    setCity(newCity);
  };

  const isAnyLoading = Object.values(loading).some(l => l);

  return (
    <div className="container">
      <header className="header">
        <h1>Weather Dashboard</h1>
        <p>Advanced Async Patterns Demo</p>
      </header>

      <StatusBar
        loading={loading}
        errors={errors}
        lastUpdate={dashboardData.weather?.timestamp}
      />

      <div className="search-section">
        <SearchBar onCityChange={handleCityChange} />

        <button
          className="btn"
          onClick={handleRefresh}
          disabled={isAnyLoading}
        >
          {isAnyLoading ? 'Refreshing...' : 'Refresh All'}
        </button>
      </div>

      <div className="dashboard-grid">
        <WeatherCard
          data={dashboardData.weather}
          loading={loading.weather}
          error={errors.weather}
        />

        <ForecastCard
          data={dashboardData.forecast}
          loading={loading.forecast}
          error={errors.forecast}
        />

        <NewsCard
          data={dashboardData.news}
          loading={loading.news}
          error={errors.news}
        />

        <AlertsCard
          data={dashboardData.alerts}
          loading={loading.alerts}
          error={errors.alerts}
        />
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Implemented Features:</h2>

        <ul style={{ paddingLeft: '20px', color: '#666' }}>
          <li>✅ Retry with exponential backoff</li>
          <li>✅ Request caching and deduplication</li>
          <li>✅ Parallel loading with Promise.allSettled</li>
          <li>✅ Debounced city search and cancellation</li>
          <li>✅ Request timeouts</li>
          <li>✅ Automatic polling every 30 seconds</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
