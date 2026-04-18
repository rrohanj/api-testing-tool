import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Monitor,
  Zap,
  Compass,
  Activity,
  Play,
  AlertTriangle,
  CheckCircle,
  FileText,
  PackageSearch,
  Database,
  Shield,
  ArrowRight,
  Cpu,
  Download,
  RefreshCw,
  Settings,
  History,
  Globe,
  Server,
} from 'lucide-react';
import './App.css';

const API_BASE_URL = window.location.origin + '/api';

function App() {
  const [view, setView] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [threshold, setThreshold] = useState(500);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isPolling, setIsPolling] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [headers, setHeaders] = useState(
    '{"Content-Type": "application/json"}',
  );
  const pollingRef = useRef(null);

  const samples = [
    // --- FAST & RELIABLE (Global CDNs) ---
    {
      name: 'Google (Search IP)',
      url: 'https://www.google.com/generate_204',
      method: 'GET',
    },
    {
      name: 'Cloudflare Trace',
      url: 'https://1.1.1.1/cdn-cgi/trace',
      method: 'GET',
    },
    {
      name: 'GitHub API (Root)',
      url: 'https://api.github.com/',
      method: 'GET',
    },

    // --- MEDIUM (Data Processing) ---
    {
      name: 'JSON Placeholder',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
    },
    {
      name: 'ReqRes Users (POST)',
      url: 'https://reqres.in/api/users',
      method: 'POST',
    },
    {
      name: 'Random User Data',
      url: 'https://randomuser.me/api/',
      method: 'GET',
    },

    // --- SLOW / SIMULATED (SLA Testing) ---
    { name: 'HTTPBin (Fast)', url: 'https://httpbin.org/get', method: 'GET' },
    {
      name: 'HTTPBin (2s Delay)',
      url: 'https://httpbin.org/delay/2',
      method: 'GET',
    },
    {
      name: 'HTTPBin (3s Delay)',
      url: 'https://httpbin.org/delay/3',
      method: 'GET',
    },

    // --- REAL WORLD UTILITY ---
    {
      name: 'Current Crypto Price',
      url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
      method: 'GET',
    },
    {
      name: 'World Time API',
      url: 'http://worldtimeapi.org/api/timezone/Asia/Kolkata',
      method: 'GET',
    },
  ];

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/history`);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Backend offline');
    }
  };

  useEffect(() => {
    if (view === 'dashboard') fetchHistory();
  }, [view]);

  // Auto-Ping Logic
  useEffect(() => {
    if (isPolling && url) {
      pollingRef.current = setInterval(() => triggerTest(), 10000);
    } else {
      clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [isPolling, url, method, threshold]);

  const triggerTest = async () => {
    try {
      await axios.post(`${API_BASE_URL}/run-test`, {
        url: url,
        method: method,
        threshold: threshold,
      });
      fetchHistory();
    } catch (err) {
      console.error('Polling failed');
    }
  };

  const runTest = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    await triggerTest();
    setLoading(false);
  };

  const exportToCSV = () => {
    const csvHeaders = 'ID,Method,URL,Status,Latency(ms),Result\n';
    const rows = history
      .map(
        (h) =>
          `${h.id},${h.method},${h.url},${h.status_code},${h.response_time_ms},${h.is_slow ? 'SLOW' : 'HEALTHY'}`,
      )
      .join('\n');
    const blob = new Blob([csvHeaders + rows], { type: 'text/csv' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `api_sentinel_full_report.csv`;
    a.click();
  };

  const totalTests = history.length;
  const avgLatency =
    totalTests > 0
      ? (
          history.reduce((acc, curr) => acc + curr.response_time_ms, 0) /
          totalTests
        ).toFixed(2)
      : 0;
  const slowCount = history.filter((h) => h.is_slow).length;
  const healthScore =
    totalTests > 0
      ? (((totalTests - slowCount) / totalTests) * 100).toFixed(0)
      : 100;

  // Derived data for Multi-Graphs
  const uniqueUrls = [...new Set(history.map((item) => item.url))];

  if (view === 'landing') {
    return (
      <div className="hero-section">
        <nav className="hero-nav">
          <div className="logo">
            <Monitor color="#5e6ad2" size={24} />{' '}
            <span className="brand-title">API Sentinel</span>
          </div>
        </nav>
        <div className="hero-content">
          <div className="badge-new">Next-Gen Multi-Service Monitoring</div>
          <h1>
            Monitor APIs with <br />
            <span>Surgical Precision.</span>
          </h1>
          <p>
            The first professional suite for developers to isolate, test, and
            track multiple API latencies in real-time.
          </p>
          <button
            className="btn-hero-primary"
            onClick={() => setView('dashboard')}
          >
            Launch Console <ArrowRight size={18} />
          </button>
        </div>
        <div className="hero-grid">
          <div className="hero-card">
            <Zap size={20} color="#5e6ad2" /> <h4>Isolated Analytics</h4>
            <p>Separate performance graphs for every unique service.</p>
          </div>
          <div className="hero-card">
            <RefreshCw size={20} color="#5e6ad2" /> <h4>Auto-Polling</h4>
            <p>Continuous uptime monitoring with background workers.</p>
          </div>
          <div className="hero-card">
            <FileText size={20} color="#5e6ad2" /> <h4>SLA Reporting</h4>
            <p>Export professional CSV audits for performance review.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container dashboard-root">
      <nav className="dash-nav">
        <div
          className="nav-left"
          onClick={() => setView('landing')}
          style={{ cursor: 'pointer' }}
        >
          <Monitor color="#5e6ad2" size={20} />{' '}
          <span className="brand-name">API Sentinel</span>
        </div>
        <div className="nav-links">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            <Monitor size={14} /> Dashboard
          </button>
          <button
            className={activeTab === 'docs' ? 'active' : ''}
            onClick={() => setActiveTab('docs')}
          >
            <FileText size={14} /> Docs
          </button>
          <button
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => setActiveTab('info')}
          >
            <Cpu size={14} /> Info
          </button>
        </div>
        <div className="nav-right">
          <button className="export-btn" onClick={exportToCSV}>
            <Download size={14} /> Export Data
          </button>
        </div>
      </nav>

      {activeTab === 'dashboard' && (
        <main className="fade-in">
          <div className="heatmap-container">
            <span className="heatmap-label">
              Service Continuity (Last 20 Runs)
            </span>
            <div className="heatmap-grid">
              {[...Array(20)].map((_, i) => {
                const test = history[i];
                const status = test
                  ? test.is_slow
                    ? 'slow'
                    : 'healthy'
                  : 'empty';
                return (
                  <div
                    key={i}
                    className={`heatmap-cell ${status}`}
                    title={test ? `${test.response_time_ms}ms` : 'No Data'}
                  ></div>
                );
              })}
            </div>
          </div>

          <div className="stats-bar-premium">
            <div className="stat-card-premium">
              <span className="stat-label-p">Total Average Latency</span>
              <div className="stat-value-p">{avgLatency}ms</div>
            </div>
            <div className="stat-card-premium">
              <span className="stat-label-p">Global Health</span>
              <div
                className="stat-value-p"
                style={{ color: healthScore > 80 ? '#22c55e' : '#f43f5e' }}
              >
                {healthScore}%
              </div>
            </div>
            <div className="stat-card-premium">
              <span className="stat-label-p">History Count</span>
              <div className="stat-value-p">{totalTests}</div>
            </div>
          </div>

          <div className="dashboard-grid-main">
            {/* Request Panel */}
            <section className="card card-minimal request-panel">
              <div className="card-header-row">
                <h3 className="card-header">
                  <Compass size={16} /> New Request
                </h3>
                <div
                  className="polling-toggle"
                  onClick={() => setIsPolling(!isPolling)}
                >
                  <RefreshCw size={14} className={isPolling ? 'spin' : ''} />
                  <span>{isPolling ? 'Auto-Ping: ON' : 'Manual Mode'}</span>
                </div>
              </div>
              <div className="quick-config">
                {samples.map((s, i) => (
                  <button
                    key={i}
                    className="chip-p"
                    onClick={() => {
                      setUrl(s.url);
                      setMethod(s.method);
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <form onSubmit={runTest} className="minimal-form">
                <div className="form-group-p">
                  <label>Service URL</label>
                  <div className="input-with-select">
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                    >
                      <option>GET</option>
                      <option>POST</option>
                    </select>
                    <input
                      type="url"
                      placeholder="https://api.sentinel.io"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div
                  className="advanced-trigger"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Settings size={14} /> Settings
                </div>
                {showAdvanced && (
                  <div className="advanced-panel fade-in">
                    <div className="form-group-p">
                      <label>Headers (JSON)</label>
                      <textarea
                        value={headers}
                        onChange={(e) => setHeaders(e.target.value)}
                        className="modern-textarea"
                      />
                    </div>
                    <div className="form-group-p">
                      <label>SLA Limit (ms)</label>
                      <input
                        type="number"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  className="btn-primary-p"
                  disabled={loading}
                >
                  {loading ? (
                    'Executing...'
                  ) : (
                    <>
                      <Play size={12} /> Run Test
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Dynamic Multi-Graph Section */}
            <section className="multi-graph-container">
              {uniqueUrls.length === 0 ? (
                <div className="card card-minimal empty-state">
                  Run your first test to see performance isolated graphs.
                </div>
              ) : (
                uniqueUrls.map((uniqueUrl, index) => {
                  const urlData = history
                    .filter((h) => h.url === uniqueUrl)
                    .map((h) => ({
                      time: new Date(h.id).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      }),
                      latency: h.response_time_ms,
                    }))
                    .reverse();

                  return (
                    <div
                      key={uniqueUrl}
                      className="card card-minimal graph-card-spaced fade-in"
                    >
                      <div className="card-header-row">
                        <h3 className="card-header">
                          <Activity
                            size={16}
                            color={index % 2 === 0 ? '#5e6ad2' : '#22c55e'}
                          />{' '}
                          {new URL(uniqueUrl).hostname}
                        </h3>
                        <span className="badge-p">{urlData.length} Tests</span>
                      </div>
                      <div style={{ width: '100%', height: 160 }}>
                        <ResponsiveContainer>
                          <AreaChart data={urlData}>
                            <defs>
                              <linearGradient
                                id={`colorLine${index}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor={
                                    index % 2 === 0 ? '#5e6ad2' : '#22c55e'
                                  }
                                  stopOpacity={0.1}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={
                                    index % 2 === 0 ? '#5e6ad2' : '#22c55e'
                                  }
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f3f5"
                            />

                            {/* CHANGE 1: Explicitly link the XAxis to the "time" property in your data */}
                            <XAxis dataKey="time" hide />

                            <YAxis
                              unit="ms"
                              fontSize={10}
                              stroke="#94a3b8"
                              axisLine={false}
                              tickLine={false}
                              domain={['auto', 'auto']}
                              allowDataOverflow={false}
                            />

                            {/* CHANGE 2: Add labelFormatter and formatter to make the Tooltip read data dynamically */}
                            <Tooltip
                              /* 1. This tells the tooltip to follow the mouse cursor on the X-axis */
                              isAnimationActive={false}
                              /* 2. This forces the tooltip to display the data for the point closest to the mouse */
                              shared={false}
                              trigger="hover"
                              contentStyle={{
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              /* 3. These ensure the text inside the box actually changes */
                              labelFormatter={(label) => `Time: ${label}`}
                              formatter={(value) => [
                                `${value.toFixed(2)} ms`,
                                'Latency',
                              ]}
                            />

                            <Area
                              type="monotone"
                              dataKey="latency"
                              stroke={index % 2 === 0 ? '#5e6ad2' : '#22c55e'}
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill={`url(#colorLine${index})`}
                              /* 4. This adds the dot that follows the line, helping the Tooltip 'snap' to values */
                              activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>

          {/* Logs Table */}
          <section className="card table-container-minimal">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Endpoint</th>
                  <th>Latency</th>
                  <th>Status</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {history.map((test) => (
                  <tr key={test.id}>
                    <td>
                      <span className={`badge-p ${test.method}`}>
                        {test.method}
                      </span>
                    </td>
                    <td className="url-cell-p">{test.url}</td>
                    <td className="latency-cell">{test.response_time_ms}ms</td>
                    <td className="status-cell">{test.status_code}</td>
                    <td>
                      {test.is_slow ? (
                        <span className="result slow-p">
                          <AlertTriangle size={12} /> SLOW
                        </span>
                      ) : (
                        <span className="result fast-p">
                          <CheckCircle size={12} /> HEALTHY
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}

      {/* Docs and Info Tabs (Fixed Blank Bug) */}
      {activeTab === 'docs' && (
        <div className="content-page-wrapper fade-in">
          <div className="card content-section doc-card">
            <h2>
              <FileText size={20} /> Documentation
            </h2>
            <p>
              API Sentinel V2.5 provides isolated multi-service tracking. By
              differentiating endpoints, users can identify specific service
              regressions without data overlap.
            </p>
            <div className="docs-grid-p">
              <div className="docs-item-p">
                <h5>Isolation Engine</h5>
                <p>
                  Each unique URL is assigned a dedicated performance profile
                  and analytics card.
                </p>
              </div>
              <div className="docs-item-p">
                <h5>SLA Polling</h5>
                <p>
                  Enable Auto-Ping to continuously monitor high-priority
                  production endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="content-page-wrapper fade-in">
          <div className="card content-section doc-card">
            <h2>
              <PackageSearch size={20} /> Project Tech
            </h2>
            <p>
              Full-stack monitoring solution designed for high-resolution
              latency tracking.
            </p>
            <div className="tech-stack-p">
              <span>
                <Monitor size={14} /> React 18
              </span>
              <span>
                <Database size={14} /> FastAPI
              </span>
              <span>
                <Cpu size={14} /> SQLAlchemy
              </span>
            </div>
          </div>
        </div>
      )}

      <footer>
        <div className="footer-content-minimal">
          <div className="footer-logo-m">
            <Activity size={16} /> API SENTINEL
          </div>
          <p>© 2026 Advanced Multi-Graph Monitoring Suite.</p>
          <div className="footer-links-m">
            Active Mode: {isPolling ? 'Polling' : 'Manual'}
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
