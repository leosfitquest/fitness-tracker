import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getBodyMeasurements, createBodyMeasurement, deleteBodyMeasurement } from '../lib/database';
import type { BodyMeasurement } from '../types.ts';
import { useToast } from './Toast';

export function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<Omit<BodyMeasurement, 'id' | 'user_id' | 'date'>>({
    weight: undefined, bodyfat: undefined, neck: undefined, shoulders: undefined, chest: undefined, 
    left_bicep: undefined, right_bicep: undefined, waist: undefined, hips: undefined, 
    left_thigh: undefined, right_thigh: undefined, left_calf: undefined, right_calf: undefined
  });

  useEffect(() => {
    loadMeasurements();
  }, []);

  async function loadMeasurements() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const data = await getBodyMeasurements(session.user.id);
      setMeasurements(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load measurements", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const payload = {
        user_id: session.user.id,
        date,
        ...Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== undefined && !Number.isNaN(v)))
      };

      await createBodyMeasurement(payload as any);
      showToast("Measurements saved!", "success");
      setShowAddModal(false);
      loadMeasurements();
    } catch (err) {
      console.error(err);
      showToast("Error saving measurements", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteBodyMeasurement(id);
      showToast("Entry deleted", "success");
      setMeasurements(measurements.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      showToast("Error deleting entry", "error");
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative max-w-3xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-background z-10 sticky top-0 flex justify-between items-end border-b border-border shadow-sm">
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Measurements</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {measurements.length === 0 ? (
          <div className="text-center p-8 bg-card rounded-xl border border-border mt-8">
            <span className="text-4xl mb-4 block">📏</span>
            <p className="text-muted-foreground">No measurements yet. Start tracking your body progress!</p>
          </div>
        ) : (
          measurements.map((entry) => (
            <div key={entry.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative group">
              <button 
                onClick={() => handleDelete(entry.id)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              <div className="text-primary font-bold mb-3">{new Date(entry.date).toLocaleDateString()}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {entry.weight && <div><span className="text-xs text-muted-foreground block uppercase">Weight</span><span className="font-medium text-foreground">{entry.weight} kg</span></div>}
                {entry.bodyfat && <div><span className="text-xs text-muted-foreground block uppercase">Bodyfat</span><span className="font-medium text-foreground">{entry.bodyfat} %</span></div>}
                {entry.chest && <div><span className="text-xs text-muted-foreground block uppercase">Chest</span><span className="font-medium text-foreground">{entry.chest} cm</span></div>}
                {entry.waist && <div><span className="text-xs text-muted-foreground block uppercase">Waist</span><span className="font-medium text-foreground">{entry.waist} cm</span></div>}
                {entry.left_bicep && <div><span className="text-xs text-muted-foreground block uppercase">L Bicep</span><span className="font-medium text-foreground">{entry.left_bicep} cm</span></div>}
                {entry.right_bicep && <div><span className="text-xs text-muted-foreground block uppercase">R Bicep</span><span className="font-medium text-foreground">{entry.right_bicep} cm</span></div>}
                {entry.left_thigh && <div><span className="text-xs text-muted-foreground block uppercase">L Thigh</span><span className="font-medium text-foreground">{entry.left_thigh} cm</span></div>}
                {entry.right_thigh && <div><span className="text-xs text-muted-foreground block uppercase">R Thigh</span><span className="font-medium text-foreground">{entry.right_thigh} cm</span></div>}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-foreground">Add Measurements</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input rounded-lg px-3 py-2 text-foreground focus:border-primary outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs uppercase text-muted-foreground mb-1">Weight (kg)</label><input type="number" step="0.1" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} className="w-full bg-input rounded-lg px-3 py-2" /></div>
                <div><label className="block text-xs uppercase text-muted-foreground mb-1">Bodyfat (%)</label><input type="number" step="0.1" value={formData.bodyfat || ''} onChange={e => setFormData({...formData, bodyfat: parseFloat(e.target.value)})} className="w-full bg-input rounded-lg px-3 py-2" /></div>
                <div><label className="block text-xs uppercase text-muted-foreground mb-1">Chest (cm)</label><input type="number" step="0.1" value={formData.chest || ''} onChange={e => setFormData({...formData, chest: parseFloat(e.target.value)})} className="w-full bg-input rounded-lg px-3 py-2" /></div>
                <div><label className="block text-xs uppercase text-muted-foreground mb-1">Waist (cm)</label><input type="number" step="0.1" value={formData.waist || ''} onChange={e => setFormData({...formData, waist: parseFloat(e.target.value)})} className="w-full bg-input rounded-lg px-3 py-2" /></div>
                <div><label className="block text-xs uppercase text-muted-foreground mb-1">L Bicep (cm)</label><input type="number" step="0.1" value={formData.left_bicep || ''} onChange={e => setFormData({...formData, left_bicep: parseFloat(e.target.value)})} className="w-full bg-input rounded-lg px-3 py-2" /></div>
                <div><label className="block text-xs uppercase text-muted-foreground mb-1">R Bicep (cm)</label><input type="number" step="0.1" value={formData.right_bicep || ''} onChange={e => setFormData({...formData, right_bicep: parseFloat(e.target.value)})} className="w-full bg-input rounded-lg px-3 py-2" /></div>
                <div><label className="block text-xs uppercase text-muted-foreground mb-1">L Thigh (cm)</label><input type="number" step="0.1" value={formData.left_thigh || ''} onChange={e => setFormData({...formData, left_thigh: parseFloat(e.target.value)})} className="w-full bg-input rounded-lg px-3 py-2" /></div>
                <div><label className="block text-xs uppercase text-muted-foreground mb-1">R Thigh (cm)</label><input type="number" step="0.1" value={formData.right_thigh || ''} onChange={e => setFormData({...formData, right_thigh: parseFloat(e.target.value)})} className="w-full bg-input rounded-lg px-3 py-2" /></div>
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-lg">Cancel</button>
                <button onClick={handleSubmit} className="flex-1 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
