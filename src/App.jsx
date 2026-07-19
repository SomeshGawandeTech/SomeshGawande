import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Gauge,
  LineChart,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Target,
  Trash2,
  UserMinus,
  Users,
  Zap
} from 'lucide-react';

const DEFAULT_CUSTOMERS = [
  { id: 'C-1001', name: 'Aarav Sharma', tenure: 4, contract: 'Month-to-month', monthly: 89, total: 356, support: 5, late: 3, usage: 28, satisfaction: 42, churned: true, segment: 'SMB' },
  { id: 'C-1002', name: 'Maya Rao', tenure: 28, contract: 'Two year', monthly: 64, total: 1792, support: 1, late: 0, usage: 84, satisfaction: 88, churned: false, segment: 'Enterprise' },
  { id: 'C-1003', name: 'Noah Lewis', tenure: 8, contract: 'Month-to-month', monthly: 104, total: 832, support: 4, late: 2, usage: 35, satisfaction: 48, churned: true, segment: 'Startup' },
  { id: 'C-1004', name: 'Priya Nair', tenure: 18, contract: 'One year', monthly: 72, total: 1296, support: 2, late: 0, usage: 67, satisfaction: 74, churned: false, segment: 'SMB' },
  { id: 'C-1005', name: 'Liam Chen', tenure: 3, contract: 'Month-to-month', monthly: 96, total: 288, support: 6, late: 4, usage: 22, satisfaction: 31, churned: true, segment: 'Startup' },
  { id: 'C-1006', name: 'Sophia Patel', tenure: 40, contract: 'Two year', monthly: 58, total: 2320, support: 0, late: 0, usage: 91, satisfaction: 93, churned: false, segment: 'Enterprise' },
  { id: 'C-1007', name: 'Ethan Brooks', tenure: 13, contract: 'Month-to-month', monthly: 78, total: 1014, support: 3, late: 1, usage: 54, satisfaction: 61, churned: false, segment: 'SMB' },
  { id: 'C-1008', name: 'Anika Das', tenure: 6, contract: 'One year', monthly: 112, total: 672, support: 5, late: 2, usage: 40, satisfaction: 45, churned: true, segment: 'Startup' },
  { id: 'C-1009', name: 'Lucas Moore', tenure: 34, contract: 'Two year', monthly: 70, total: 2380, support: 1, late: 0, usage: 78, satisfaction: 86, churned: false, segment: 'Enterprise' },
  { id: 'C-1010', name: 'Zara Khan', tenure: 10, contract: 'Month-to-month', monthly: 88, total: 880, support: 2, late: 2, usage: 47, satisfaction: 55, churned: true, segment: 'SMB' },
  { id: 'C-1011', name: 'Mia Carter', tenure: 23, contract: 'One year', monthly: 61, total: 1403, support: 1, late: 0, usage: 73, satisfaction: 79, churned: false, segment: 'Enterprise' },
  { id: 'C-1012', name: 'Kabir Mehta', tenure: 5, contract: 'Month-to-month', monthly: 118, total: 590, support: 7, late: 3, usage: 18, satisfaction: 26, churned: true, segment: 'Startup' },
  { id: 'C-1013', name: 'Isha Verma', tenure: 16, contract: 'Month-to-month', monthly: 92, total: 1472, support: 4, late: 1, usage: 44, satisfaction: 52, churned: true, segment: 'SMB' },
  { id: 'C-1014', name: 'Oliver King', tenure: 31, contract: 'One year', monthly: 83, total: 2573, support: 2, late: 0, usage: 76, satisfaction: 81, churned: false, segment: 'Enterprise' },
  { id: 'C-1015', name: 'Reyansh Jain', tenure: 2, contract: 'Month-to-month', monthly: 126, total: 252, support: 8, late: 5, usage: 16, satisfaction: 22, churned: true, segment: 'Startup' },
  { id: 'C-1016', name: 'Emma Wilson', tenure: 45, contract: 'Two year', monthly: 66, total: 2970, support: 0, late: 0, usage: 89, satisfaction: 91, churned: false, segment: 'Enterprise' }
];

const CONTRACT_WEIGHT = { 'Month-to-month': 0.22, 'One year': -0.08, 'Two year': -0.18 };
const SEGMENT_WEIGHT = { Startup: 0.06, SMB: 0.02, Enterprise: -0.05 };
const PRESET_MULTIPLIER = { Balanced: 1, Aggressive: 1.12, Conservative: 0.9 };
const EMPTY_FORM = { name: '', tenure: 1, contract: 'Month-to-month', monthly: 80, support: 0, late: 0, usage: 50, satisfaction: 60, churned: false, segment: 'SMB' };
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function loadCustomers() {
  try {
    const saved = localStorage.getItem('churn_customers');
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CUSTOMERS;
  } catch {
    return DEFAULT_CUSTOMERS;
  }
}

function predictChurn(customer, preset = 'Balanced', threshold = 0.55) {
  const raw = 0.32 +
    (12 - Math.min(customer.tenure, 12)) * 0.018 +
    CONTRACT_WEIGHT[customer.contract] +
    SEGMENT_WEIGHT[customer.segment] +
    (customer.monthly - 70) * 0.003 +
    customer.support * 0.035 +
    customer.late * 0.045 +
    (55 - customer.usage) * 0.004 +
    (60 - customer.satisfaction) * 0.005;
  const risk = clamp(raw * PRESET_MULTIPLIER[preset]);
  const label = risk >= threshold ? 'Predicted churn' : risk >= threshold - 0.18 ? 'Watchlist' : 'Predicted retain';
  const className = risk >= threshold ? 'danger' : risk >= threshold - 0.18 ? 'warning' : 'success';
  const factors = [
    { label: 'Contract type', value: CONTRACT_WEIGHT[customer.contract], text: `${customer.contract} contract` },
    { label: 'Low tenure', value: (12 - Math.min(customer.tenure, 12)) * 0.018, text: `${customer.tenure} months with service` },
    { label: 'Support issues', value: customer.support * 0.035, text: `${customer.support} tickets raised` },
    { label: 'Payment friction', value: customer.late * 0.045, text: `${customer.late} late payments` },
    { label: 'Product usage', value: (55 - customer.usage) * 0.004, text: `${customer.usage}% usage score` },
    { label: 'Satisfaction', value: (60 - customer.satisfaction) * 0.005, text: `${customer.satisfaction}/100 CSAT` },
    { label: 'Customer segment', value: SEGMENT_WEIGHT[customer.segment], text: `${customer.segment} segment` },
    { label: 'Monthly charge', value: (customer.monthly - 70) * 0.003, text: `$${customer.monthly} per month` }
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { risk, label, className, factors, willChurn: risk >= threshold };
}

function Metric({ icon: Icon, label, value, detail }) {
  return <section className="metric-tile"><div className="metric-icon"><Icon size={20} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></section>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function App() {
  const [customers, setCustomers] = useState(loadCustomers);
  const [selectedId, setSelectedId] = useState(customers[0]?.id || DEFAULT_CUSTOMERS[0].id);
  const [query, setQuery] = useState('');
  const [preset, setPreset] = useState('Balanced');
  const [threshold, setThreshold] = useState(0.55);
  const [scenario, setScenario] = useState({ ...(customers[0] || DEFAULT_CUSTOMERS[0]) });
  const [newCustomer, setNewCustomer] = useState(EMPTY_FORM);

  const scored = useMemo(() => customers.map((customer) => ({ ...customer, prediction: predictChurn(customer, preset, threshold) })), [customers, preset, threshold]);
  const selected = scored.find((customer) => customer.id === selectedId) || scored[0];
  const prediction = predictChurn(scenario, preset, threshold);
  const filtered = scored.filter((customer) => `${customer.name} ${customer.id} ${customer.contract} ${customer.segment}`.toLowerCase().includes(query.toLowerCase()));
  const confusion = scored.reduce((acc, customer) => {
    const actual = Boolean(customer.churned);
    const predicted = customer.prediction.willChurn;
    if (actual && predicted) acc.tp += 1;
    if (!actual && predicted) acc.fp += 1;
    if (actual && !predicted) acc.fn += 1;
    if (!actual && !predicted) acc.tn += 1;
    return acc;
  }, { tp: 0, fp: 0, fn: 0, tn: 0 });
  const accuracy = scored.length ? (confusion.tp + confusion.tn) / scored.length : 0;
  const recall = confusion.tp + confusion.fn ? confusion.tp / (confusion.tp + confusion.fn) : 0;
  const precision = confusion.tp + confusion.fp ? confusion.tp / (confusion.tp + confusion.fp) : 0;
  const highRisk = scored.filter((customer) => customer.prediction.willChurn).length;
  const avgRisk = scored.reduce((sum, customer) => sum + customer.prediction.risk, 0) / Math.max(scored.length, 1);
  const factorTotals = prediction.factors.map((factor) => ({ ...factor, width: Math.min(100, Math.abs(factor.value) * 240) }));
  const segmentRows = ['Startup', 'SMB', 'Enterprise'].map((segment) => {
    const rows = scored.filter((customer) => customer.segment === segment);
    const avg = rows.reduce((sum, customer) => sum + customer.prediction.risk, 0) / Math.max(rows.length, 1);
    return { segment, count: rows.length, avg };
  });

  const saveCustomers = (next) => {
    setCustomers(next);
    localStorage.setItem('churn_customers', JSON.stringify(next));
  };

  const loadCustomer = (customer) => {
    setSelectedId(customer.id);
    setScenario({ ...customer });
  };

  const updateScenario = (key, value) => setScenario((current) => ({ ...current, [key]: value }));
  const updateNewCustomer = (key, value) => setNewCustomer((current) => ({ ...current, [key]: value }));

  const addCustomer = (event) => {
    event.preventDefault();
    const nextId = `C-${String(1001 + customers.length).padStart(4, '0')}`;
    const record = {
      ...newCustomer,
      id: nextId,
      name: newCustomer.name.trim() || `Customer ${customers.length + 1}`,
      total: Number(newCustomer.tenure) * Number(newCustomer.monthly),
      tenure: Number(newCustomer.tenure),
      monthly: Number(newCustomer.monthly),
      support: Number(newCustomer.support),
      late: Number(newCustomer.late),
      usage: Number(newCustomer.usage),
      satisfaction: Number(newCustomer.satisfaction),
      churned: Boolean(newCustomer.churned)
    };
    const next = [record, ...customers];
    saveCustomers(next);
    loadCustomer(record);
    setNewCustomer(EMPTY_FORM);
  };

  const deleteCustomer = (id) => {
    const next = customers.filter((customer) => customer.id !== id);
    saveCustomers(next.length ? next : DEFAULT_CUSTOMERS);
    const fallback = next[0] || DEFAULT_CUSTOMERS[0];
    loadCustomer(fallback);
  };

  const resetData = () => {
    saveCustomers(DEFAULT_CUSTOMERS);
    loadCustomer(DEFAULT_CUSTOMERS[0]);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark"><UserMinus size={24} /></div><div><p>Advanced Classification Lab</p><h1>Customer Churn Prediction</h1></div></div>
        <div className="model-chip"><Zap size={16} /> {preset} model</div>
      </header>

      <main>
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Historical behavior analysis</span>
            <h2>Predict churn, tune the classifier, and add new customer records.</h2>
            <p>The dashboard scores every customer, explains the strongest drivers, measures classification quality, and updates the dataset as you add new customers.</p>
          </div>
          <div className={`risk-gauge ${prediction.className}`}><Gauge size={30} /><strong>{Math.round(prediction.risk * 100)}%</strong><span>{prediction.label}</span></div>
        </section>

        <section className="metrics-grid">
          <Metric icon={Users} label="Customers" value={scored.length} detail="Saved records" />
          <Metric icon={AlertTriangle} label="Predicted Churn" value={highRisk} detail={`Threshold ${Math.round(threshold * 100)}%`} />
          <Metric icon={Activity} label="Avg Risk" value={`${Math.round(avgRisk * 100)}%`} detail="Across dataset" />
          <Metric icon={CheckCircle2} label="Accuracy" value={`${Math.round(accuracy * 100)}%`} detail="Against sample labels" />
        </section>

        <section className="advanced-grid">
          <div className="panel">
            <div className="panel-heading"><div><p>Model controls</p><h3>Classifier Tuning</h3></div><Target size={20} /></div>
            <div className="control-row">
              {['Balanced', 'Aggressive', 'Conservative'].map((option) => <button key={option} className={preset === option ? 'seg active' : 'seg'} onClick={() => setPreset(option)}>{option}</button>)}
            </div>
            <Field label={`Decision threshold: ${Math.round(threshold * 100)}%`}><input type="range" min="35" max="75" value={Math.round(threshold * 100)} onChange={(event) => setThreshold(Number(event.target.value) / 100)} /></Field>
          </div>
          <div className="panel confusion-panel">
            <div className="panel-heading"><div><p>Evaluation</p><h3>Confusion Matrix</h3></div><BarChart3 size={20} /></div>
            <div className="matrix-grid"><div><b>{confusion.tp}</b><span>True positive</span></div><div><b>{confusion.fp}</b><span>False positive</span></div><div><b>{confusion.fn}</b><span>False negative</span></div><div><b>{confusion.tn}</b><span>True negative</span></div></div>
            <div className="quality-row"><span>Precision {Math.round(precision * 100)}%</span><span>Recall {Math.round(recall * 100)}%</span></div>
          </div>
        </section>

        <section className="workspace-grid add-grid">
          <form className="panel" onSubmit={addCustomer}>
            <div className="panel-heading"><div><p>Data entry</p><h3>Add New Customer</h3></div><Plus size={20} /></div>
            <div className="form-grid">
              <Field label="Customer name"><input value={newCustomer.name} onChange={(event) => updateNewCustomer('name', event.target.value)} placeholder="Enter name" /></Field>
              <Field label="Segment"><select value={newCustomer.segment} onChange={(event) => updateNewCustomer('segment', event.target.value)}><option>Startup</option><option>SMB</option><option>Enterprise</option></select><ChevronDown className="select-icon" size={16} /></Field>
              <Field label="Tenure months"><input type="number" min="0" max="84" value={newCustomer.tenure} onChange={(event) => updateNewCustomer('tenure', Number(event.target.value))} /></Field>
              <Field label="Monthly charge"><input type="number" min="0" value={newCustomer.monthly} onChange={(event) => updateNewCustomer('monthly', Number(event.target.value))} /></Field>
              <Field label="Contract"><select value={newCustomer.contract} onChange={(event) => updateNewCustomer('contract', event.target.value)}><option>Month-to-month</option><option>One year</option><option>Two year</option></select><ChevronDown className="select-icon" size={16} /></Field>
              <Field label="Actual churn label"><select value={String(newCustomer.churned)} onChange={(event) => updateNewCustomer('churned', event.target.value === 'true')}><option value="false">Stayed</option><option value="true">Churned</option></select><ChevronDown className="select-icon" size={16} /></Field>
              <Field label="Support tickets"><input type="number" min="0" max="15" value={newCustomer.support} onChange={(event) => updateNewCustomer('support', Number(event.target.value))} /></Field>
              <Field label="Late payments"><input type="number" min="0" max="10" value={newCustomer.late} onChange={(event) => updateNewCustomer('late', Number(event.target.value))} /></Field>
              <Field label="Usage score"><input type="range" min="0" max="100" value={newCustomer.usage} onChange={(event) => updateNewCustomer('usage', Number(event.target.value))} /><b>{newCustomer.usage}%</b></Field>
              <Field label="Satisfaction"><input type="range" min="0" max="100" value={newCustomer.satisfaction} onChange={(event) => updateNewCustomer('satisfaction', Number(event.target.value))} /><b>{newCustomer.satisfaction}</b></Field>
            </div>
            <div className="button-row"><button className="primary-btn" type="submit"><Plus size={16} /> Add customer</button><button className="ghost-btn" type="button" onClick={resetData}><RotateCcw size={16} /> Reset sample data</button></div>
          </form>

          <div className="panel predictor-panel">
            <div className="panel-heading"><div><p>Selected scenario</p><h3>Prediction Inputs</h3></div><SlidersHorizontal size={20} /></div>
            <div className="form-grid">
              <Field label="Tenure months"><input type="number" min="0" max="84" value={scenario.tenure} onChange={(event) => updateScenario('tenure', Number(event.target.value))} /></Field>
              <Field label="Monthly charge"><input type="number" min="0" value={scenario.monthly} onChange={(event) => updateScenario('monthly', Number(event.target.value))} /></Field>
              <Field label="Support tickets"><input type="number" min="0" max="15" value={scenario.support} onChange={(event) => updateScenario('support', Number(event.target.value))} /></Field>
              <Field label="Late payments"><input type="number" min="0" max="10" value={scenario.late} onChange={(event) => updateScenario('late', Number(event.target.value))} /></Field>
              <Field label="Usage score"><input type="range" min="0" max="100" value={scenario.usage} onChange={(event) => updateScenario('usage', Number(event.target.value))} /><b>{scenario.usage}%</b></Field>
              <Field label="Satisfaction"><input type="range" min="0" max="100" value={scenario.satisfaction} onChange={(event) => updateScenario('satisfaction', Number(event.target.value))} /><b>{scenario.satisfaction}</b></Field>
              <Field label="Contract"><select value={scenario.contract} onChange={(event) => updateScenario('contract', event.target.value)}><option>Month-to-month</option><option>One year</option><option>Two year</option></select><ChevronDown className="select-icon" size={16} /></Field>
              <Field label="Segment"><select value={scenario.segment} onChange={(event) => updateScenario('segment', event.target.value)}><option>Startup</option><option>SMB</option><option>Enterprise</option></select><ChevronDown className="select-icon" size={16} /></Field>
            </div>
          </div>
        </section>

        <section className="workspace-grid lower-grid">
          <div className="panel">
            <div className="panel-heading"><div><p>Dataset</p><h3>Customer Records</h3></div><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers" /></div></div>
            <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Segment</th><th>Contract</th><th>Tenure</th><th>Risk</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((customer) => <tr className={customer.id === selected?.id ? 'selected' : ''} key={customer.id} onClick={() => loadCustomer(customer)}><td><strong>{customer.name}</strong><span>{customer.id}</span></td><td>{customer.segment}</td><td>{customer.contract}</td><td>{customer.tenure} mo</td><td>{Math.round(customer.prediction.risk * 100)}%</td><td><span className={`status-pill ${customer.prediction.className}`}>{customer.prediction.label}</span></td><td><button className="icon-btn" onClick={(event) => { event.stopPropagation(); deleteCustomer(customer.id); }}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
          </div>

          <div className="panel insight-panel">
            <div className="panel-heading"><div><p>Explainability</p><h3>Drivers And Cohorts</h3></div><LineChart size={20} /></div>
            <div className="factor-list">{factorTotals.slice(0, 5).map((factor) => <div className="factor-row" key={factor.label}><div><strong>{factor.label}</strong><span>{factor.text}</span></div><div className="factor-track"><i className={factor.value >= 0 ? 'adds-risk' : 'reduces-risk'} style={{ width: `${factor.width}%` }} /></div><em>{factor.value >= 0 ? '+' : ''}{(factor.value * 100).toFixed(1)}</em></div>)}</div>
            <div className="segment-stack">{segmentRows.map((row) => <div key={row.segment}><span>{row.segment}</span><b>{row.count}</b><i><em style={{ width: `${Math.round(row.avg * 100)}%` }} /></i><small>{Math.round(row.avg * 100)}% avg risk</small></div>)}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
