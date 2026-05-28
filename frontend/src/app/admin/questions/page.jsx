'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Search, Upload, Download, X, CheckCircle2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { adminApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

const CSV_TEMPLATE = `subject,year,question_text,option_a,option_b,option_c,option_d,correct_option,explanation
Mathematics,2023,What is the value of x if 2x + 4 = 10?,2,3,4,5,B,2x = 6 therefore x = 3
English Language,2023,Which of the following is a pronoun?,Lagos,Beautiful,She,Quickly,C,She is a personal pronoun
Physics,2023,What is the unit of force?,Joule,Watt,Newton,Pascal,C,Force is measured in Newtons
Chemistry,2023,What is the chemical symbol for Gold?,Go,Gd,Au,Ag,C,Au comes from the Latin word Aurum`;

export default function QuestionsPage() {
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [uploading, setUploading]   = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.getQuestions({ search });
      setQuestions(res.data.questions || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search]);

  async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    try {
      await adminApi.deleteQuestion(id);
      toast.success('Question deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'questions-template.csv';
    a.click(); URL.revokeObjectURL(url);
  }

  function handleFileDrop(e) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      toast.error('Please select a CSV file');
    }
  }

  async function uploadCSV() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await adminApi.uploadQuestions(formData);
      const { inserted, skipped, errors } = res.data;
      setUploadResult({ inserted, skipped, errors });
      toast.success(`${inserted} questions uploaded successfully!`);
      setSelectedFile(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell adminOnly>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, marginBottom:4 }}>Questions</h1>
          <p style={{ color:'var(--text-2)' }}>
            {questions.length} question{questions.length !== 1 ? 's' : ''} in the bank
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download size={15} /> Download Template
          </Button>
          <Button onClick={() => { setShowUpload(v => !v); setUploadResult(null); setSelectedFile(null); }}>
            <Upload size={15} /> Upload CSV
          </Button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <Card style={{ marginBottom:20, border:'1.5px solid var(--brand)', background:'var(--brand-light)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>Upload Questions CSV</h3>
            <button onClick={() => { setShowUpload(false); setSelectedFile(null); setUploadResult(null); }}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', display:'flex' }}>
              <X size={18} />
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--brand)' : selectedFile ? 'var(--success)' : '#93c5fd'}`,
              borderRadius:'var(--radius)', padding:'32px 24px', textAlign:'center',
              background: dragOver ? 'rgba(26,86,219,.06)' : selectedFile ? 'rgba(22,163,74,.04)' : 'white',
              cursor:'pointer', transition:'all .2s', marginBottom:16,
            }}
          >
            <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleFileDrop} />
            {selectedFile ? (
              <>
                <CheckCircle2 size={36} color="var(--success)" style={{ margin:'0 auto 10px' }} />
                <div style={{ fontWeight:600, color:'var(--success)' }}>{selectedFile.name}</div>
                <div style={{ fontSize:'.82rem', color:'var(--text-3)', marginTop:4 }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                </div>
              </>
            ) : (
              <>
                <Upload size={36} color="var(--brand)" style={{ margin:'0 auto 10px' }} />
                <div style={{ fontWeight:600, color:'var(--text)' }}>Drop your CSV here or click to browse</div>
                <div style={{ fontSize:'.82rem', color:'var(--text-3)', marginTop:6 }}>
                  Must follow the template format — download it above
                </div>
              </>
            )}
          </div>

          {/* CSV format reminder */}
          <div style={{ background:'white', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:16, fontSize:'.8rem', color:'var(--text-2)', fontFamily:'monospace', overflowX:'auto', border:'1px solid var(--border)' }}>
            subject, year, question_text, option_a, option_b, option_c, option_d, correct_option, explanation
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <Button onClick={uploadCSV} loading={uploading} disabled={!selectedFile} style={{ flex:1 }}>
              <Upload size={15} /> {uploading ? 'Uploading…' : 'Upload Questions'}
            </Button>
          </div>

          {/* Upload result */}
          {uploadResult && (
            <div style={{ marginTop:16, padding:'14px 16px', borderRadius:'var(--radius-sm)', background:'white', border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:600, marginBottom:8 }}>Upload Result</div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                <span style={{ color:'var(--success)', fontWeight:600 }}>✅ {uploadResult.inserted} inserted</span>
                {uploadResult.skipped > 0 && <span style={{ color:'#f59e0b', fontWeight:600 }}>⚠️ {uploadResult.skipped} skipped</span>}
                {uploadResult.errors?.length > 0 && <span style={{ color:'var(--danger)', fontWeight:600 }}>❌ {uploadResult.errors.length} errors</span>}
              </div>
              {uploadResult.errors?.length > 0 && (
                <div style={{ marginTop:10, fontSize:'.8rem', color:'var(--danger)', maxHeight:100, overflowY:'auto' }}>
                  {uploadResult.errors.slice(0,5).map((e, i) => <div key={i}>Row {e.row}: {e.message}</div>)}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Search */}
      <Card style={{ marginBottom:20 }}>
        <Input
          placeholder="Search questions…"
          icon={<Search size={16} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size={36} /></div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign:'center', padding:48 }}>
            <Upload size={40} color="var(--text-3)" style={{ margin:'0 auto 12px' }} />
            <p style={{ color:'var(--text-3)', fontWeight:500 }}>No questions yet.</p>
            <p style={{ color:'var(--text-3)', fontSize:'.85rem', marginTop:4 }}>Download the template and upload a CSV to get started.</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.9rem' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['#', 'Question', 'Subject', 'Year', ''].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'var(--text-3)', fontWeight:600, fontSize:'.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id} style={{ borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding:'12px', color:'var(--text-3)', fontSize:'.8rem' }}>{i + 1}</td>
                  <td style={{ padding:'12px', maxWidth:420, lineHeight:1.5 }}>
                    {q.question_text?.slice(0, 90)}{q.question_text?.length > 90 ? '…' : ''}
                  </td>
                  <td style={{ padding:'12px' }}><Badge color="blue">{q.subject_name}</Badge></td>
                  <td style={{ padding:'12px', color:'var(--text-2)' }}>{q.year}</td>
                  <td style={{ padding:'12px' }}>
                    <Button size="sm" variant="danger" onClick={() => deleteQuestion(q.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
