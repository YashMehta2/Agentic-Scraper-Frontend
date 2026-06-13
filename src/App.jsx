import { useState, useEffect } from 'react'
import { Plus, Play, Loader2, CheckCircle2, XCircle, ExternalLink, List, Navigation, Trash2 } from 'lucide-react'
import './App.css'

function App() {
    const [url, setUrl] = useState('')
    const [goal, setGoal] = useState('')
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(false)

    const API_BASE = import.meta.env.VITE_API_URL || '/api'

    // Fetch all jobs on mount and poll for updates
    const fetchJobs = async () => {
        try {
            const response = await fetch(`${API_BASE}/jobs`)
            const data = await response.json()
            setJobs(data)
        } catch (error) {
            console.error('Error fetching jobs:', error)
        }
    }

    useEffect(() => {
        fetchJobs()
        const interval = setInterval(fetchJobs, 3000) // Poll every 3s
        return () => clearInterval(interval)
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!url || !goal) return

        setLoading(true)
        try {
            const response = await fetch(`${API_BASE}/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, goal })
            })
            const data = await response.json()
            setUrl('')
            setGoal('')
            fetchJobs()
        } catch (error) {
            console.error('Error starting scrape:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAll = async () => {
        if (!window.confirm('Are you sure you want to clear all execution history? This cannot be undone.')) return

        try {
            await fetch(`${API_BASE}/jobs`, { method: 'DELETE' })
            fetchJobs()
        } catch (error) {
            console.error('Error clearing history:', error)
        }
    }

    const handleDeleteJob = async (id) => {
        if (!window.confirm('Delete this job?')) return

        try {
            await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' })
            fetchJobs()
        } catch (error) {
            console.error('Error deleting job:', error)
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'RUNNING': return <Loader2 className="animate-spin text-primary" size={20} />
            case 'COMPLETED': return <CheckCircle2 className="text-success" size={20} />
            case 'FAILED': return <XCircle className="text-danger" size={20} />
            default: return <Loader2 className="text-text-muted" size={20} />
        }
    }

    return (
        <div className="dashboard-container">
            <header className="main-header">
                <h1>Agentic<span className="text-primary">Scraper</span></h1>
                <p className="text-muted">Self-Improving Autonomous Web Extraction</p>
            </header>

            <main className="dashboard-content">
                <section className="input-section glass">
                    <div className="section-header">
                        <Plus size={20} />
                        <h2>New Scraping Task</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="scrape-form">
                        <div className="input-group">
                            <label>Target URL</label>
                            <input
                                type="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Extraction Goal</label>
                            <textarea
                                placeholder="What exactly should the agent extract?"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                            {loading ? 'Submitting...' : 'Launch Agent'}
                        </button>
                    </form>
                </section>

                <section className="jobs-section">
                    <div className="section-header justify-between">
                        <div className="flex items-center gap-2">
                            <List size={20} />
                            <h2>Execution History</h2>
                        </div>
                        {jobs.length > 0 && (
                            <button onClick={handleDeleteAll} className="btn-clear" title="Clear All History">
                                <Trash2 size={16} />
                                Clear All
                            </button>
                        )}
                    </div>
                    <div className="jobs-grid">
                        {jobs.length === 0 ? (
                            <div className="empty-state glass">
                                <p>No jobs found. Start your first agent above!</p>
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id} className="job-card glass">
                                    <div className="job-card-header">
                                        <span className={`status-badge ${job.status.toLowerCase()}`}>
                                            {getStatusIcon(job.status)}
                                            {job.status}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="job-id">ID: {job.id.slice(0, 8)}</span>
                                            <button 
                                                onClick={() => handleDeleteJob(job.id)} 
                                                className="btn-icon-danger" 
                                                title="Delete Job"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="job-details">
                                        <div className="detail-item">
                                            <strong>URL:</strong>
                                            <a href={job.url} target="_blank" rel="noreferrer">
                                                {job.url} <ExternalLink size={12} />
                                            </a>
                                        </div>
                                        <div className="detail-item">
                                            <strong>Goal:</strong> {job.goal}
                                        </div>
                                    </div>

                                    {job.status === 'RUNNING' && job.thought && (
                                        <div className="job-thought glass">
                                            <div className="thought-label">Agent is thinking...</div>
                                            <p>{job.thought}</p>
                                        </div>
                                    )}

                                    {job.result && (
                                        <div className="job-result">
                                            <strong>Extraction Result:</strong>
                                            <div className="result-content">
                                                {typeof job.result === 'string' ? job.result : JSON.stringify(job.result, null, 2)}
                                            </div>
                                        </div>
                                    )}
                                    {job.error && (
                                        <div className="job-error">
                                            <strong>Error Details:</strong>
                                            <p>{job.error}</p>
                                        </div>
                                    )}

                                    {job.steps && job.steps.length > 0 && (
                                        <div className="job-steps">
                                            <div className="steps-header">
                                                <div className="thought-label flex items-center gap-2">
                                                    <Navigation size={14} /> Execution Steps
                                                </div>
                                            </div>
                                            <div className="steps-container">
                                                {job.steps.map((step, index) => (
                                                    <div key={index} className="step-item">
                                                        <div className="step-number">{index + 1}</div>
                                                        <div className="step-content">
                                                            <div className="step-thought">{step.thought}</div>
                                                            {step.code && <code className="step-code">{step.code}</code>}
                                                            {step.success ? (
                                                                <div className="step-result">
                                                                    ✓ {typeof step.result === 'string' ? step.result : JSON.stringify(step.result)}
                                                                </div>
                                                            ) : (
                                                                <div className="step-error">✕ {step.error}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}

export default App
