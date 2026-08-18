import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const TAG_COLORS = {
  'hot-lead': '#FF6B6B',
  'decision-maker': '#4ECDC4',
  'needs-sample': '#45B7D1',
  'interested': '#96CEB4',
  'follow-up': '#FFEAA7',
  'pricing-pending': '#DDA15E',
  'competitor': '#BC6C25',
  'seasonal': '#A8DADC',
};

const COMMON_TAGS = [
  { name: 'hot-lead', color: TAG_COLORS['hot-lead'] },
  { name: 'decision-maker', color: TAG_COLORS['decision-maker'] },
  { name: 'needs-sample', color: TAG_COLORS['needs-sample'] },
  { name: 'interested', color: TAG_COLORS['interested'] },
  { name: 'follow-up', color: TAG_COLORS['follow-up'] },
  { name: 'pricing-pending', color: TAG_COLORS['pricing-pending'] },
  { name: 'competitor', color: TAG_COLORS['competitor'] },
  { name: 'seasonal', color: TAG_COLORS['seasonal'] },
];

export default function Dashboard() {
  const [leads, setLeads] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data.leads || {});
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateLead(companyName, field, value) {
    const lead = leads[companyName];
    const updated = { ...lead, [field]: value };

    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          ...updated,
        }),
      });

      if (res.ok) {
        setLeads(prev => ({
          ...prev,
          [companyName]: updated,
        }));
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  }

  function addTag(companyName, tagName, tagColor) {
    const lead = leads[companyName];
    const tags = lead.tags || [];
    
    // Check if tag already exists
    if (tags.some(t => t.name === tagName)) {
      return;
    }
    
    const newTags = [...tags, { name: tagName, color: tagColor }];
    updateLead(companyName, 'tags', newTags);
    setNewTag('');
    setShowTagSuggestions(null);
  }

  function removeTag(companyName, tagName) {
    const lead = leads[companyName];
    const tags = (lead.tags || []).filter(t => t.name !== tagName);
    updateLead(companyName, 'tags', tags);
  }

  async function deleteLead(companyName) {
    if (!confirm(`Delete ${companyName}?`)) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName }),
      });

      if (res.ok) {
        setLeads(prev => {
          const updated = { ...prev };
          delete updated[companyName];
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  }

  function getFilteredLeads() {
    let filtered = Object.values(leads);

    if (search) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filter === 'existing') {
      filtered = filtered.filter(lead => lead.isExisting);
    } else if (filter !== 'all') {
      filtered = filtered.filter(lead => lead.status === filter);
    }

    return filtered;
  }

  const filtered = getFilteredLeads();
  const stats = {
    total: Object.keys(leads).length,
    followup: Object.values(leads).filter(l => l.status === 'need-followup').length,
    existing: Object.values(leads).filter(l => l.isExisting).length,
    contacts: Object.values(leads).reduce((sum, l) => sum + (l.contacts?.length || 0), 0),
  };

  if (loading) {
    return <div className={styles.loading}>Loading leads...</div>;
  }

  return (
    <>
      <Head>
        <title>SuperZoo Lead Tracker - Travel Cat</title>
        <meta name="description" content="Track and manage SuperZoo trade show leads" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>SuperZoo Lead Tracker</h1>
            <p>Manage and track all leads from August 2026 trade show</p>
          </div>
          <button className={styles.exportBtn} onClick={() => {
            const csv = 'Company,Contacts,Status,Tags,Notes\n' + 
              filtered.map(lead => {
                const contacts = lead.contacts.map(c => `${c.name} (${c.title})`).join('; ');
                const tags = (lead.tags || []).map(t => t.name).join(',');
                const notes = (lead.notes || '').replace(/"/g, '""');
                return `"${lead.name}","${contacts}","${lead.status}","${tags}","${notes}"`;
              }).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'superzoo-leads.csv';
            a.click();
          }}>
            Export CSV
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total leads</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Need follow-up</div>
            <div className={styles.statValue}>{stats.followup}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Existing customers</div>
            <div className={styles.statValue}>{stats.existing}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total contacts</div>
            <div className={styles.statValue}>{stats.contacts}</div>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.filters}>
            {['all', 'need-followup', 'interested', 'won', 'existing'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'need-followup' ? 'Need follow-up' : f === 'all' ? 'All leads' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            className={styles.searchBox}
            placeholder="Search company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.leadsList}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>No leads match your search</div>
          ) : (
            filtered.map(lead => (
              <div key={lead.name} className={styles.companyCard}>
                <div
                  className={styles.companyHeader}
                  onClick={() => setExpandedCompany(expandedCompany === lead.name ? null : lead.name)}
                >
                  <div className={styles.companyInfo}>
                    <h3 className={styles.companyName}>
  {lead.name}
  <button
    className={`${styles.badge} ${lead.isExisting ? styles.existing : styles.new}`}
    onClick={(e) => {
      e.stopPropagation();
      updateLead(lead.name, 'isExisting', !lead.isExisting);
    }}
    style={{ cursor: 'pointer', border: 'none', fontSize: '11px', padding: '0.25rem 0.5rem', borderRadius: '3px', fontWeight: 500, flex: 'shrink: 0' }}
  >
    {lead.isExisting ? 'Existing customer' : 'New lead'}
  </button>
                      {(lead.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          className={styles.tagBadge}
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </h3>
                    <p className={styles.companyMeta}>
                      {lead.contacts?.length || 0} contact{lead.contacts?.length !== 1 ? 's' : ''} ·{' '}
                      <span className={`${styles.statusBadge} ${styles[lead.status]}`}>
                        {lead.status.replace('-', ' ')}
                      </span>
                    </p>
                  </div>
                  <span className={`${styles.expandIcon} ${expandedCompany === lead.name ? styles.expanded : ''}`}>▼</span>
                </div>

                {expandedCompany === lead.name && (
                  <div className={styles.contactsSection}>
                    {lead.contacts?.map((contact, idx) => (
                      <div key={idx} className={styles.contact}>
                        <p className={styles.contactName}>{contact.name}</p>
                        {contact.title && <p className={styles.contactTitle}>{contact.title}</p>}
                        {contact.email && <p className={styles.contactEmail}>{contact.email}</p>}
                        {contact.phone && <p className={styles.contactPhone}>{contact.phone}</p>}
                      </div>
                    ))}

                    <div className={styles.tagsSection}>
                      <label className={styles.tagsLabel}>Tags</label>
                      <div className={styles.tagsContainer}>
                        {(lead.tags || []).map((tag, idx) => (
                          <div
                            key={idx}
                            className={styles.tag}
                            style={{ backgroundColor: tag.color }}
                          >
                            <span>{tag.name}</span>
                         <button
  className={styles.removeTagBtn}
  onClick={(e) => {
    e.stopPropagation();
    removeTag(lead.name, tag.name);
  }}
>
  ×
</button>
                          </div>
                        ))}
                      </div>
                      
                      <div className={styles.addTagSection}>
                        <input
                          type="text"
                          className={styles.tagInput}
                          placeholder="Add tag..."
                          value={newTag}
                          onChange={(e) => {
                            setNewTag(e.target.value);
                            setShowTagSuggestions(lead.name);
                          }}
                          onFocus={() => setShowTagSuggestions(lead.name)}
                        />
                        {showTagSuggestions === lead.name && (
                          <div className={styles.tagSuggestions}>
                            {COMMON_TAGS.filter(t => 
                              t.name.includes(newTag.toLowerCase()) &&
                              !(lead.tags || []).some(existing => existing.name === t.name)
                            ).map((tag, idx) => (
                              <button
                                key={idx}
                                className={styles.tagSuggestion}
                                onClick={() => addTag(lead.name, tag.name, tag.color)}
                              >
                                <span
                                  className={styles.colorDot}
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </button>
                            ))}
                            {newTag && !COMMON_TAGS.some(t => t.name === newTag) && (
                              <button
                                className={styles.tagSuggestion}
                                onClick={() => addTag(lead.name, newTag, '#95E1D3')}
                              >
                                <span
                                  className={styles.colorDot}
                                  style={{ backgroundColor: '#95E1D3' }}
                                />
                                Create "{newTag}"
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.notesSection}>
                      <label className={styles.notesLabel}>Notes</label>
                      <textarea
                        className={styles.notesInput}
                        placeholder="Follow-up strategy, product interest, next steps..."
                        value={lead.notes || ''}
                        onChange={e => updateLead(lead.name, 'notes', e.target.value)}
                      />
                    </div>

                    <div className={styles.statusSection}>
                      <label>Status</label>
                      <select
                        className={styles.statusSelect}
                        value={lead.status || 'need-followup'}
                        onChange={e => updateLead(lead.name, 'status', e.target.value)}
                      >
                        <option value="need-followup">Need follow-up</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="proposal">Proposal sent</option>
                        <option value="qualified">Qualified</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>

                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteLead(lead.name)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
